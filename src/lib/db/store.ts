import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { and, eq, isNull, isNotNull, lte } from "drizzle-orm";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { family as sampleFamily, members as sampleMembers } from "../sample-data";
import type { Family, Member } from "../types";
import { hashToken, randomToken, validToken } from "../security";
import { migrations } from "./migrations";
import * as schema from "./schema";

export type SavedMember = Member & { version: number };
export type Preferences = Pick<Member, "introduction" | "interests" | "likes" | "avoid" | "sizes" | "note"> & { wishes: { title: string; note?: string; url?: string }[] };

export function openStore(filename: string) {
  if (filename !== ":memory:") mkdirSync(dirname(resolve(filename)), { recursive: true });
  const sqlite = new Database(filename);
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("busy_timeout = 5000");
  sqlite.pragma("journal_mode = WAL");
  sqlite.exec("CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY)");
  sqlite.transaction(() => {
    const applied = new Set((sqlite.prepare("SELECT version FROM schema_migrations").all() as { version: number }[]).map(row => row.version));
    for (const migration of migrations) {
      if (applied.has(migration.version)) continue;
      sqlite.exec(migration.sql);
      sqlite.prepare("INSERT INTO schema_migrations (version) VALUES (?)").run(migration.version);
    }
  }).immediate();
  const db = drizzle(sqlite);
  db.insert(schema.familyTable).values({ id: 1, data: { name: sampleFamily.name, year: sampleFamily.year, welcome: sampleFamily.welcome, demo: false } }).onConflictDoNothing().run();

  function getMember(id: string, includeArchived = false): SavedMember | undefined {
    const row = db.select().from(schema.membersTable).where(eq(schema.membersTable.id, id)).get();
    if (!row || (!includeArchived && row.archivedAt !== null)) return;
    const wishes = db.select().from(schema.wishesTable).where(eq(schema.wishesTable.memberId, id)).orderBy(schema.wishesTable.position).all();
    return { ...row.data, id: row.id, version: row.version, wishes: wishes.map(w => ({ id: w.id, title: w.title, note: w.note ?? undefined, url: w.url ?? undefined })) };
  }

  function insertMember(member: Member) {
    const { wishes, ...data } = member;
    db.insert(schema.membersTable).values({ id: member.id, data }).run();
    for (const [position, wish] of wishes.entries()) db.insert(schema.wishesTable).values({ ...wish, memberId: member.id, position }).run();
  }

  function seedSamples() {
    return sqlite.transaction(() => {
      if (db.select().from(schema.membersTable).get()) return false;
      for (const member of sampleMembers) insertMember(member);
      db.update(schema.familyTable).set({ data: { ...sampleFamily, demo: true } }).where(eq(schema.familyTable.id, 1)).run();
      return true;
    }).immediate();
  }

  function rotateLink(memberId: string): string | undefined {
    return sqlite.transaction(() => {
      if (!getMember(memberId)) return;
      const token = randomToken();
      db.delete(schema.sessionsTable).where(eq(schema.sessionsTable.memberId, memberId)).run();
      db.insert(schema.linksTable).values({ memberId, tokenHash: hashToken(token) }).onConflictDoUpdate({ target: schema.linksTable.memberId, set: { tokenHash: hashToken(token) } }).run();
      return token;
    }).immediate();
  }

  function revokeLink(memberId: string) {
    sqlite.transaction(() => {
      db.delete(schema.sessionsTable).where(eq(schema.sessionsTable.memberId, memberId)).run();
      db.delete(schema.linksTable).where(eq(schema.linksTable.memberId, memberId)).run();
    }).immediate();
  }

  function createSession(role: "admin" | "member", credentialHash: string, memberId?: string) {
    const token = randomToken();
    const expiresAt = Date.now() + (role === "admin" ? 12 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000);
    db.delete(schema.sessionsTable).where(lte(schema.sessionsTable.expiresAt, Date.now())).run();
    db.insert(schema.sessionsTable).values({ tokenHash: hashToken(token), role, memberId: memberId ?? null, credentialHash, expiresAt }).run();
    return { token, expiresAt };
  }

  function openMemberSession(id: string, token: string) {
    if (!validToken(token)) return;
    return sqlite.transaction(() => {
      const link = db.select().from(schema.linksTable).where(and(eq(schema.linksTable.memberId, id), eq(schema.linksTable.tokenHash, hashToken(token)))).get();
      if (!link) return;
      return createSession("member", link.tokenHash, id);
    }).immediate();
  }

  function getSession(token: string | undefined, adminHash: string, now = Date.now()) {
    if (!token || !validToken(token)) return;
    const row = db.select().from(schema.sessionsTable).where(eq(schema.sessionsTable.tokenHash, hashToken(token))).get();
    if (!row || row.expiresAt <= now) return;
    if (row.role === "admin") return adminHash && row.credentialHash === hashToken(adminHash) ? row : undefined;
    const link = db.select().from(schema.linksTable).where(eq(schema.linksTable.memberId, row.memberId!)).get();
    return link?.tokenHash === row.credentialHash ? row : undefined;
  }

  function savePreferences(id: string, version: number, preferences: Preferences) {
    return sqlite.transaction(() => {
      const member = getMember(id);
      if (!member) return "missing" as const;
      if (member.version !== version) return "conflict" as const;
      const { wishes, ...data } = preferences;
      // Reconstruct public data explicitly: credential columns are never part of a profile.
      db.update(schema.membersTable).set({ data: { id, name: member.name, avatar: member.avatar, avatarId: member.avatarId, colour: member.colour, ...data }, version: version + 1 }).where(eq(schema.membersTable.id, id)).run();
      db.delete(schema.wishesTable).where(eq(schema.wishesTable.memberId, id)).run();
      for (const [position, wish] of wishes.entries()) db.insert(schema.wishesTable).values({ ...wish, id: randomUUID(), memberId: id, position }).run();
      return "saved" as const;
    }).immediate();
  }

  function takeAttempt(key: string, maximum: number, windowMs: number, now = Date.now()) {
    return sqlite.transaction(() => {
      db.delete(schema.limitsTable).where(lte(schema.limitsTable.resetsAt, now)).run();
      const previous = db.select().from(schema.limitsTable).where(eq(schema.limitsTable.key, key)).get();
      if (previous && previous.attempts >= maximum) return false;
      db.insert(schema.limitsTable).values({ key, attempts: 1, resetsAt: now + windowMs }).onConflictDoUpdate({ target: schema.limitsTable.key, set: { attempts: (previous?.attempts ?? 0) + 1 } }).run();
      return true;
    }).immediate();
  }

  function saveName(id: string, version: number, name: string) {
    return sqlite.transaction(() => {
      const row = db.select().from(schema.membersTable).where(eq(schema.membersTable.id, id)).get();
      if (!row || row.archivedAt !== null) return "missing" as const;
      if (row.version !== version) return "conflict" as const;
      db.update(schema.membersTable).set({ data: { ...row.data, name }, version: version + 1 }).where(eq(schema.membersTable.id, id)).run();
      return "saved" as const;
    }).immediate();
  }

  function setArchived(id: string, archived: boolean) {
    return sqlite.transaction(() => {
      const member = getMember(id, true);
      if (!member) return false;
      db.update(schema.membersTable).set({ archivedAt: archived ? Date.now() : null, version: member.version + 1 }).where(eq(schema.membersTable.id, id)).run();
      if (archived) revokeLink(id);
      return true;
    }).immediate();
  }

  function saveAvatar(id: string, bytes?: Buffer) {
    return sqlite.transaction(() => {
      const row = db.select().from(schema.membersTable).where(eq(schema.membersTable.id, id)).get();
      if (!row || row.archivedAt !== null) return false;
      const avatarId = bytes ? randomUUID() : undefined;
      if (bytes) db.insert(schema.avatarsTable).values({ id: avatarId!, memberId: id, bytes }).run();
      db.update(schema.membersTable).set({ data: { ...row.data, avatarId }, version: row.version + 1 }).where(eq(schema.membersTable.id, id)).run();
      if (row.data.avatarId) db.delete(schema.avatarsTable).where(eq(schema.avatarsTable.id, row.data.avatarId)).run();
      return true;
    }).immediate();
  }

  function getAvatar(id: string) {
    const avatar = db.select().from(schema.avatarsTable).where(eq(schema.avatarsTable.id, id)).get();
    if (!avatar || getMember(avatar.memberId)?.avatarId !== id) return;
    return avatar.bytes;
  }

  function saveFamily(version: number, data: Family & { demo: boolean }) {
    return sqlite.transaction(() => {
      const previous = db.select().from(schema.familyTable).where(eq(schema.familyTable.id, 1)).get()!;
      if (previous.version !== version) return false;
      db.update(schema.familyTable).set({ data, version: version + 1 }).where(eq(schema.familyTable.id, 1)).run();
      return true;
    }).immediate();
  }

  return {
    sqlite, db, getMember, seedSamples, rotateLink, revokeLink, createSession, openMemberSession, getSession, savePreferences, takeAttempt, saveName, setArchived, saveAvatar, getAvatar, saveFamily,
    getFamily: () => { const row = db.select().from(schema.familyTable).where(eq(schema.familyTable.id, 1)).get()!; return { ...row.data, version: row.version }; },
    listMembers: () => db.select({ id: schema.membersTable.id }).from(schema.membersTable).where(isNull(schema.membersTable.archivedAt)).all().map(row => getMember(row.id)!),
    listArchivedMembers: () => db.select({ id: schema.membersTable.id }).from(schema.membersTable).where(isNotNull(schema.membersTable.archivedAt)).all().map(row => getMember(row.id, true)!),
    linkedMemberIds: () => new Set(db.select({ memberId: schema.linksTable.memberId }).from(schema.linksTable).all().map(row => row.memberId)),
    deleteSession: (token: string) => db.delete(schema.sessionsTable).where(eq(schema.sessionsTable.tokenHash, hashToken(token))).run(),
    createMember: (name: string) => {
      const member: Member = { id: randomUUID(), name, avatar: "placeholder", colour: "sage", interests: [], wishes: [], likes: [], avoid: [] };
      insertMember(member);
      return member.id;
    },
    close: () => sqlite.close(),
  };
}

type Store = ReturnType<typeof openStore>;
const globalStore = globalThis as typeof globalThis & { familyStore?: Store; familyStoreSchema?: number };
export function getStore(): Store {
  const version = migrations.at(-1)!.version;
  if (!globalStore.familyStore || globalStore.familyStoreSchema !== version) {
    globalStore.familyStore?.close();
    globalStore.familyStore = openStore(process.env.DATABASE_PATH || resolve("data/family.sqlite"));
    globalStore.familyStoreSchema = version;
  }
  return globalStore.familyStore;
}

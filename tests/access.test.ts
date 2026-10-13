import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openStore } from "../src/lib/db/store";
import { hashPassword, hashToken, randomToken, verifyPassword } from "../src/lib/security";
import { preferencesSchema } from "../src/lib/validation";

test("Editing links are member-scoped, hashed, and invalidate existing sessions on rotation/revocation", () => {
  const store = openStore(":memory:");
  try {
    store.seedSamples();
    const token = store.rotateLink("m-001")!;
    assert.equal(token.length, 43);
    const persisted = store.sqlite.prepare("SELECT token_hash FROM editing_links").get() as { token_hash: string };
    assert.equal(persisted.token_hash, hashToken(token));
    assert.ok(!JSON.stringify(store.listMembers()).includes(persisted.token_hash));
    assert.equal(store.openMemberSession("m-002", token), undefined);
    assert.equal(store.openMemberSession("m-001", "wrong"), undefined);
    const session = store.openMemberSession("m-001", token)!;
    assert.equal(store.getSession(session.token, "")?.memberId, "m-001");
    assert.equal(store.getSession(session.token, "", session.expiresAt), undefined);
    const replacement = store.rotateLink("m-001")!;
    assert.equal(store.getSession(session.token, ""), undefined);
    assert.equal(store.openMemberSession("m-001", token), undefined);
    const next = store.openMemberSession("m-001", replacement)!;
    store.revokeLink("m-001");
    assert.equal(store.getSession(next.token, ""), undefined);
    assert.equal(store.openMemberSession("m-001", replacement), undefined);
    assert.equal(store.getMember("m-001")?.name, "Sofia");
  } finally { store.close(); }
});

test("Admin sessions require the current credential and passwords verify with salted scrypt", async () => {
  const password = randomToken();
  const encoded = await hashPassword(password);
  assert.equal(await verifyPassword(password, encoded), true);
  assert.equal(await verifyPassword("wrong", encoded), false);
  assert.equal(await verifyPassword(password, ""), false);
  const store = openStore(":memory:");
  try {
    const session = store.createSession("admin", hashToken(encoded));
    assert.equal(store.getSession(session.token, encoded)?.role, "admin");
    assert.equal(store.getSession(session.token, ""), undefined);
    assert.equal(store.getSession(session.token, "different-credential"), undefined);
    store.deleteSession(session.token);
    assert.equal(store.getSession(session.token, encoded), undefined);
  } finally { store.close(); }
});

test("Saved preferences survive reopening/backup and stale writes cannot overwrite newer changes", async () => {
  const directory = mkdtempSync(join(tmpdir(), "secret-santa-store-test-"));
  let store = openStore(join(directory, "family.sqlite"));
  try {
    assert.equal(store.seedSamples(), true);
    assert.equal(store.seedSamples(), false);
    const member = store.getMember("m-001")!;
    const preferences = { introduction: "Updated introduction", interests: [], likes: [], avoid: [], wishes: [{ title: "A saved gift", url: "https://example.com/" }], sizes: [], note: "" };
    assert.equal(store.savePreferences(member.id, member.version, preferences), "saved");
    assert.equal(store.savePreferences(member.id, member.version, { ...preferences, introduction: "Stale change" }), "conflict");
    await store.sqlite.backup(join(directory, "backup.sqlite"));
    store.close();
    store = openStore(join(directory, "family.sqlite"));
    assert.equal(store.getMember(member.id)?.introduction, preferences.introduction);
    assert.equal(store.getMember(member.id)?.wishes[0].title, preferences.wishes[0].title);
    const backup = openStore(join(directory, "backup.sqlite"));
    try { assert.equal(backup.getMember(member.id)?.version, member.version + 1); } finally { backup.close(); }
    assert.equal((store.sqlite.prepare("SELECT COUNT(*) AS count FROM schema_migrations").get() as { count: number }).count, 2);
    assert.equal(store.listMembers().length, 6);
  } finally { store.close(); rmSync(directory, { recursive: true, force: true }); }
});

test("Validation rejects executable URLs, credential fields, and malformed size entries", () => {
  const valid = { version: 1, interests: [], likes: [], avoid: [], wishes: [] };
  assert.equal(preferencesSchema.safeParse(valid).success, true);
  assert.equal(preferencesSchema.safeParse({ ...valid, wishes: [{ title: "Gift", url: "javascript:alert(1)" }] }).success, false);
  assert.equal(preferencesSchema.safeParse({ ...valid, role: "admin" }).success, false);
  assert.equal(preferencesSchema.safeParse({ ...valid, sizes: [{ label: "", value: "M" }] }).success, false);
});

test("Login throttling persists and resets after the window", () => {
  const store = openStore(":memory:");
  try {
    assert.equal(store.takeAttempt("admin", 2, 1000, 100), true);
    assert.equal(store.takeAttempt("admin", 2, 1000, 100), true);
    assert.equal(store.takeAttempt("admin", 2, 1000, 100), false);
    assert.equal(store.takeAttempt("admin", 2, 1000, 1100), true);
  } finally { store.close(); }
});

test("A fresh family is empty and does not inherit fictional exchange settings", () => {
  const store = openStore(":memory:");
  try {
    assert.equal(store.listMembers().length, 0);
    assert.equal(store.getFamily().demo, false);
    assert.equal(store.getFamily().budget, undefined);
    assert.equal(store.getFamily().exchangeDate, undefined);
  } finally { store.close(); }
});

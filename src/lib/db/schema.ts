import { blob, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import type { Family, Member } from "../types";

export const familyTable = sqliteTable("family", {
  id: integer("id").primaryKey(),
  data: text("data", { mode: "json" }).$type<Family & { demo: boolean }>().notNull(),
  version: integer("version").notNull().default(1),
});
export const membersTable = sqliteTable("members", {
  id: text("id").primaryKey(),
  data: text("data", { mode: "json" }).$type<Omit<Member, "wishes">>().notNull(),
  version: integer("version").notNull().default(1),
  archivedAt: integer("archived_at"),
});
export const avatarsTable = sqliteTable("avatars", {
  id: text("id").primaryKey(),
  memberId: text("member_id").notNull().references(() => membersTable.id, { onDelete: "cascade" }),
  bytes: blob("bytes", { mode: "buffer" }).notNull(),
});
export const wishesTable = sqliteTable("wishes", {
  id: text("id").primaryKey(),
  memberId: text("member_id").notNull().references(() => membersTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  note: text("note"),
  url: text("url"),
  position: integer("position").notNull(),
});
export const linksTable = sqliteTable("editing_links", {
  memberId: text("member_id").primaryKey().references(() => membersTable.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
});
export const sessionsTable = sqliteTable("sessions", {
  tokenHash: text("token_hash").primaryKey(),
  role: text("role", { enum: ["admin", "member"] }).notNull(),
  memberId: text("member_id").references(() => membersTable.id, { onDelete: "cascade" }),
  credentialHash: text("credential_hash").notNull(),
  expiresAt: integer("expires_at").notNull(),
});
export const limitsTable = sqliteTable("login_limits", {
  key: text("key").primaryKey(),
  attempts: integer("attempts").notNull(),
  resetsAt: integer("resets_at").notNull(),
});

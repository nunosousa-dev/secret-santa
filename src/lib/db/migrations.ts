/** Versioned SQL embedded so the standalone server does not depend on source paths. */
export const migrations = [{ version: 1, sql: `
CREATE TABLE family (id INTEGER PRIMARY KEY CHECK (id = 1), data TEXT NOT NULL);
CREATE TABLE members (id TEXT PRIMARY KEY, data TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1);
CREATE TABLE wishes (
  id TEXT PRIMARY KEY, member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  title TEXT NOT NULL, note TEXT, url TEXT, position INTEGER NOT NULL
);
CREATE INDEX wishes_member ON wishes(member_id, position);
CREATE TABLE editing_links (
  member_id TEXT PRIMARY KEY REFERENCES members(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE
);
CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY, role TEXT NOT NULL CHECK(role IN ('admin', 'member')),
  member_id TEXT REFERENCES members(id) ON DELETE CASCADE,
  credential_hash TEXT NOT NULL, expires_at INTEGER NOT NULL,
  CHECK ((role = 'admin' AND member_id IS NULL) OR (role = 'member' AND member_id IS NOT NULL))
);
CREATE INDEX sessions_member ON sessions(member_id);
CREATE TABLE login_limits (key TEXT PRIMARY KEY, attempts INTEGER NOT NULL, resets_at INTEGER NOT NULL);
` }, { version: 2, sql: `
ALTER TABLE members ADD COLUMN archived_at INTEGER;
ALTER TABLE family ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
CREATE TABLE avatars (
  id TEXT PRIMARY KEY, member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  bytes BLOB NOT NULL
);
CREATE INDEX avatars_member ON avatars(member_id);
` }];

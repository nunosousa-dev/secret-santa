import Database from "better-sqlite3";
import { mkdirSync, renameSync, rmSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const filename = process.env.DATABASE_PATH;
if (!filename) throw new Error("DATABASE_PATH is required.");
const directory = process.env.BACKUP_DIR || "/backups";
mkdirSync(directory, { recursive: true });
const temporary = join(directory, `.backup-${randomUUID()}.sqlite`);
const destination = join(directory, `family-${Date.now()}.sqlite`);
const database = new Database(filename, { readonly: true, fileMustExist: true, timeout: 5000 });
try {
  // Online SQLite backup includes committed WAL data and avatar BLOBs, without migrations.
  await database.backup(temporary);
  renameSync(temporary, destination);
  console.log("Consistent family backup completed.");
} finally {
  database.close();
  rmSync(temporary, { force: true });
}

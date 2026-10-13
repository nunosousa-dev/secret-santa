import { createInterface } from "node:readline";
import { Writable } from "node:stream";
import { chmodSync, existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { hashPassword } from "../src/lib/security";

if (!process.stdin.isTTY) throw new Error("Run this command in an interactive terminal. The password will not be displayed.");
const hiddenOutput = new Writable({ write(_chunk, _encoding, done) { done(); } });
const reader = createInterface({ input: process.stdin, output: hiddenOutput, terminal: true });
reader.on("SIGINT", () => { reader.close(); process.exit(130); });
const ask = (prompt: string): Promise<string> => { process.stdout.write(prompt); return new Promise(resolve => reader.question("", answer => { process.stdout.write("\n"); resolve(answer); })); };
try {
  const filename = ".env.local";
  let content = existsSync(filename) ? readFileSync(filename, "utf8") : "APP_URL=http://localhost:3000\nDATABASE_PATH=./data/family.sqlite\n";
  if (/^ADMIN_PASSWORD_HASH=.+/m.test(content) && (await ask("Replace the password and invalidate admin sessions? Type YES: ")) !== "YES") process.exit(0);
  const password = await ask("New password (at least 12 characters): ");
  if (password.length < 12 || password.length > 256) throw new Error("Use between 12 and 256 characters.");
  if (password !== await ask("Confirm the password: ")) throw new Error("The passwords do not match.");
  const line = `ADMIN_PASSWORD_HASH=${await hashPassword(password)}`;
  content = /^ADMIN_PASSWORD_HASH=.*$/m.test(content) ? content.replace(/^ADMIN_PASSWORD_HASH=.*$/m, () => line) : `${content.trimEnd()}\n${line}\n`;
  const temporary = `.env.local.${randomUUID()}.tmp`;
  writeFileSync(temporary, content, { mode: 0o600, flag: "wx" });
  renameSync(temporary, filename); chmodSync(filename, 0o600);
  console.log("Administration configured. Restart the server to apply the change.");
} finally { reader.close(); }

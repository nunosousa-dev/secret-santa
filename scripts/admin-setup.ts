import { createInterface } from "node:readline";
import { Writable } from "node:stream";
import { chmodSync, existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { hashPassword } from "../src/lib/security";

if (!process.stdin.isTTY) throw new Error("Executa este comando num terminal interativo. A palavra-passe não será mostrada.");
const hiddenOutput = new Writable({ write(_chunk, _encoding, done) { done(); } });
const reader = createInterface({ input: process.stdin, output: hiddenOutput, terminal: true });
reader.on("SIGINT", () => { reader.close(); process.exit(130); });
const ask = (prompt: string): Promise<string> => { process.stdout.write(prompt); return new Promise(resolve => reader.question("", answer => { process.stdout.write("\n"); resolve(answer); })); };
try {
  const filename = ".env.local";
  let content = existsSync(filename) ? readFileSync(filename, "utf8") : "APP_URL=http://localhost:3000\nDATABASE_PATH=./data/family.sqlite\n";
  if (/^ADMIN_PASSWORD_HASH=.+/m.test(content) && (await ask("Substituir a palavra-passe e invalidar as sessões de administração? Escreve SIM: ")) !== "SIM") process.exit(0);
  const password = await ask("Nova palavra-passe (mínimo 12 caracteres): ");
  if (password.length < 12 || password.length > 256) throw new Error("Usa entre 12 e 256 caracteres.");
  if (password !== await ask("Repete a palavra-passe: ")) throw new Error("As palavras-passe não coincidem.");
  const line = `ADMIN_PASSWORD_HASH=${await hashPassword(password)}`;
  content = /^ADMIN_PASSWORD_HASH=.*$/m.test(content) ? content.replace(/^ADMIN_PASSWORD_HASH=.*$/m, () => line) : `${content.trimEnd()}\n${line}\n`;
  const temporary = `.env.local.${randomUUID()}.tmp`;
  writeFileSync(temporary, content, { mode: 0o600, flag: "wx" });
  renameSync(temporary, filename); chmodSync(filename, 0o600);
  console.log("Administração configurada. Reinicia o servidor para aplicar a alteração.");
} finally { reader.close(); }

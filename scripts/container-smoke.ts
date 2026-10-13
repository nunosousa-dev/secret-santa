import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "node:net";
import { randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import sharp from "sharp";
import { hashPassword, randomToken } from "../src/lib/security";

const image = process.env.TEST_IMAGE || "secret-santa:local";
const name = `secret-santa-test-${randomUUID().slice(0, 8)}`;
const dataVolume = `${name}-data`;
const backupVolume = `${name}-backups`;
const restoreVolume = `${name}-restored-data`;
const restoredName = `${name}-restored`;
const directory = mkdtempSync(join(tmpdir(), "secret-santa-container-"));
const docker = (...args: string[]) => execFileSync("docker", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
const probe = createServer();
await new Promise<void>(resolve => probe.listen(0, "127.0.0.1", resolve));
const address = probe.address(); assert.ok(address && typeof address !== "string");
const port = address.port;
await new Promise<void>(resolve => probe.close(() => resolve()));
const origin = `http://127.0.0.1:${port}`;
const password = randomToken();
const envFile = join(directory, "test.env");
writeFileSync(envFile, `APP_URL=${origin}\nADMIN_PASSWORD_HASH=${await hashPassword(password)}\n`, { mode: 0o600 });
async function ready() {
  for (let attempt = 0; attempt < 150; attempt++) {
    try { if ((await fetch(`${origin}/health/ready`, { signal: AbortSignal.timeout(1000) })).status === 200) return; } catch { /* Not ready yet. */ }
    await delay(100);
  }
  throw new Error("Container readiness check timed out.");
}
async function mutation(path: string, body: unknown, cookie = "", method = "POST") {
  return fetch(`${origin}${path}`, { method, headers: { "Content-Type": "application/json", Origin: origin, Cookie: cookie }, body: JSON.stringify(body) });
}
function runApp(container: string, volume: string) {
  docker("run", "-d", "--platform", "linux/amd64", "--name", container, "--read-only", "--cap-drop=ALL", "--security-opt=no-new-privileges", "--tmpfs", "/tmp:rw,noexec,nosuid,size=128m", "--mount", `type=volume,source=${volume},target=/data`, "--env-file", envFile, "-p", `127.0.0.1:${port}:3000`, image);
}

try {
  assert.equal(docker("image", "inspect", "--format", "{{.Architecture}}", image), "amd64");
  for (const volume of [dataVolume, backupVolume, restoreVolume]) docker("volume", "create", volume);
  runApp(name, dataVolume);
  await ready();
  assert.equal((await fetch(`${origin}/health/live`)).status, 200);
  docker("exec", name, "node", "--input-type=module", "-e", 'import assert from "node:assert/strict"; import {readdirSync,writeFileSync} from "node:fs"; assert.equal(process.getuid(),1001); assert.ok(!readdirSync("/app").some(name=>name.startsWith(".env"))); assert.throws(()=>writeFileSync("/app/test-write","no"));');
  const login = await mutation("/api/admin/login", { password }); assert.equal(login.status, 200);
  const cookie = login.headers.get("set-cookie")!.split(";")[0];
  const create = await mutation("/api/admin/members", { name: "Teste do contentor" }, cookie);
  assert.equal(create.status, 201);
  const id = (await create.json() as { id: string }).id;
  const data = { version: 1, introduction: "Guardado no volume", interests: [], likes: [], avoid: [], wishes: [{ title: "Presente persistente" }], sizes: [], note: "" };
  assert.equal((await mutation(`/api/members/${id}`, data, cookie, "PATCH")).status, 200);
  const avatar = await sharp({ create: { width: 64, height: 32, channels: 3, background: "#429365" } }).png().toBuffer();
  assert.equal((await fetch(`${origin}/api/admin/members/${id}/avatar`, { method: "POST", headers: { "Content-Type": "image/png", Origin: origin, Cookie: cookie }, body: new Uint8Array(avatar) })).status, 200);
  let profile = await (await fetch(`${origin}/p/${id}`)).text();
  const avatarPath = profile.match(/src="(\/avatars\/[^\"]+)"/)?.[1]; assert.ok(avatarPath);
  assert.equal((await fetch(`${origin}${avatarPath}`)).status, 200);
  const cards = await (await fetch(`${origin}/admin/cards`, { headers: { Cookie: cookie } })).text();
  assert.ok(cards.includes("data-print-card="));
  docker("restart", name);
  await ready();
  profile = await (await fetch(`${origin}/p/${id}`)).text();
  assert.ok(profile.includes(data.introduction));
  assert.equal((await fetch(`${origin}${avatarPath}`)).status, 200);
  docker("run", "--rm", "--platform", "linux/amd64", "--read-only", "--cap-drop=ALL", "--security-opt=no-new-privileges", "--tmpfs", "/tmp:rw,noexec,nosuid,size=64m", "--mount", `type=volume,source=${dataVolume},target=/data,readonly`, "--mount", `type=volume,source=${backupVolume},target=/backups`, "-e", "DATABASE_PATH=/data/family.sqlite", "-e", "BACKUP_DIR=/backups", image, "node", "scripts/backup.mjs");
  const verify = 'import assert from "node:assert/strict"; import {readdirSync,copyFileSync} from "node:fs"; import Database from "better-sqlite3"; const file=readdirSync("/backups").find(name=>name.endsWith(".sqlite")); assert.ok(file); copyFileSync("/backups/"+file,"/data/family.sqlite"); const db=new Database("/data/family.sqlite"); const row=db.prepare("SELECT data FROM members LIMIT 1").get(); assert.equal(JSON.parse(row.data).introduction,"Guardado no volume"); assert.equal(db.prepare("SELECT COUNT(*) AS count FROM avatars").get().count,1); db.close();';
  docker("run", "--rm", "--platform", "linux/amd64", "--read-only", "--mount", `type=volume,source=${backupVolume},target=/backups,readonly`, "--mount", `type=volume,source=${restoreVolume},target=/data`, image, "node", "--input-type=module", "-e", verify);
  assert.equal((await fetch(`${origin}/health/ready`)).status, 200);
  docker("rm", "-f", name);
  runApp(restoredName, restoreVolume);
  await ready();
  assert.ok((await (await fetch(`${origin}/p/${id}`)).text()).includes(data.introduction));
  assert.equal((await fetch(`${origin}${avatarPath}`)).status, 200);
  console.log("Passed: amd64 container, non-root/read-only runtime, isolated credentials, native avatar processing, printable cards, persistent volume after restart, online backup, and full profile/avatar recovery on a fresh volume.");
} finally {
  for (const container of [name, restoredName]) try { docker("rm", "-f", container); } catch { /* Only test containers are removed. */ }
  for (const volume of [dataVolume, backupVolume, restoreVolume]) try { docker("volume", "rm", volume); } catch { /* Only this test's volumes are removed. */ }
  rmSync(directory, { recursive: true, force: true });
}

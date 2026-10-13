import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { openStore } from "../src/lib/db/store";
import { hashPassword, hashToken, randomToken } from "../src/lib/security";
import sharp from "sharp";
import jsQR from "jsqr";

const directory = mkdtempSync(join(tmpdir(), "secret-santa-http-test-"));
const database = join(directory, "family.sqlite");
const store = openStore(database);
store.seedSamples(); store.close();
const probe = createServer();
await new Promise<void>(resolve => probe.listen(0, "127.0.0.1", resolve));
const address = probe.address();
assert.ok(address && typeof address !== "string");
const port = address.port;
await new Promise<void>(resolve => probe.close(() => resolve()));
const origin = `http://127.0.0.1:${port}`;
const password = randomToken();
let child: ChildProcess | undefined;
let exit: Promise<void> | undefined;

async function start(encoded: string) {
  child = spawn(process.execPath, ["scripts/start.mjs"], { env: { ...process.env, PORT: String(port), HOSTNAME: "127.0.0.1", APP_URL: origin, DATABASE_PATH: database, ADMIN_PASSWORD_HASH: encoded, NODE_ENV: "production" }, stdio: "ignore" });
  exit = new Promise(resolve => child!.once("exit", () => resolve()));
  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.exitCode !== null) throw new Error("Test server stopped before becoming ready.");
    try { if ((await fetch(origin, { signal: AbortSignal.timeout(500) })).ok) return; } catch { /* Not ready yet. */ }
    await delay(100);
  }
  throw new Error("Test server did not become ready.");
}
async function stop() { if (child && child.exitCode === null) child.kill("SIGTERM"); await exit; child = undefined; }
async function request(path: string, body: unknown, cookie = "", method = "POST", requestOrigin: string | null = origin) {
  return fetch(`${origin}${path}`, { method, headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}), ...(requestOrigin ? { Origin: requestOrigin } : {}) }, body: JSON.stringify(body) });
}
async function upload(id: string, bytes: Buffer, cookieValue = "", type = "image/png") {
  return fetch(`${origin}/api/admin/members/${id}/avatar`, { method: "POST", headers: { "Content-Type": type, Origin: origin, Cookie: cookieValue }, body: new Uint8Array(bytes) });
}
async function printedUrls(cookieValue: string, path = "/admin/cards") {
  const response = await fetch(`${origin}${path}`, { headers: { Cookie: cookieValue } });
  assert.equal(response.status, 200);
  const html = await response.text();
  const urls: string[] = [];
  for (const match of html.matchAll(/src="data:image\/svg\+xml;base64,([^\"]+)"/g)) {
    const svg = Buffer.from(match[1], "base64");
    const width = Number(svg.toString().match(/viewBox="0 0 (\d+)/)?.[1]) * 8;
    assert.ok(width > 0);
    const { data, info } = await sharp(svg).resize(width, width, { kernel: "nearest" }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const decoded = jsQR(new Uint8ClampedArray(data), info.width, info.height);
    assert.ok(decoded, "Every printed QR image must decode");
    urls.push(decoded.data);
  }
  assert.equal(urls.length, [...html.matchAll(/data-print-card=/g)].length);
  return { urls, html };
}
const cookie = (response: Response) => { const value = response.headers.get("set-cookie"); assert.ok(value); assert.ok(value.includes("HttpOnly")); assert.ok(value.includes("SameSite=lax")); return value.split(";")[0]; };
const preferences = { version: 1, introduction: "Preferences saved during the test", interests: ["Books"], likes: [], avoid: [], wishes: [{ title: "A saved gift idea" }], sizes: [], note: "" };

try {
  await start("");
  assert.equal((await fetch(`${origin}/health/live`)).status, 200);
  assert.equal((await fetch(`${origin}/health/ready`)).status, 503);
  assert.equal((await request("/api/admin/login", { password })).status, 503, "Unconfigured admin must stay locked");
  await stop();
  const encoded = await hashPassword(password);
  await start(encoded);
  assert.equal((await fetch(`${origin}/health/ready`)).status, 200);
  const adminPage = await (await fetch(`${origin}/admin`)).text();
  assert.match(adminPage, /<html[^>]*lang="pt-PT"/, "The interface must remain in European Portuguese");
  assert.ok(adminPage.includes("Palavra-passe do organizador"));
  assert.ok(!adminPage.includes("Perfis e ligações privadas"), "Anonymous admin view must not include protected data");
  assert.equal((await fetch(`${origin}/admin/cards`, { redirect: "manual" })).status, 307, "Printing must require admin access");
  assert.equal((await fetch(`${origin}/admin/cartoes`, { redirect: "manual" })).status, 307, "Legacy printing URLs must require the same admin access");
  assert.equal((await request("/api/admin/login", { password }, "", "POST", "https://wrong.example")).status, 403);
  assert.equal((await request("/api/admin/login", { password }, "", "POST", null)).status, 403);
  assert.equal((await request("/api/admin/login", { password: "wrong" })).status, 401);
  const adminCookie = cookie(await request("/api/admin/login", { password }));
  const originalCards = await printedUrls(adminCookie);
  assert.equal(originalCards.urls.length, 6);
  assert.deepEqual((await printedUrls(adminCookie, "/admin/cartoes")).urls, originalCards.urls, "Legacy card URLs must preserve public QR destinations");
  assert.equal((await request("/api/admin/members", { name: "Forbidden" })).status, 403);
  assert.equal((await request("/api/admin/members/m-001/link", {})).status, 403);
  assert.equal((await request("/api/members/m-001", preferences, "", "PATCH")).status, 403);
  const linkResponse = await request("/api/admin/members/m-001/link", {}, adminCookie);
  assert.equal(linkResponse.status, 200);
  assert.match(linkResponse.headers.get("cache-control") ?? "", /no-store/);
  const { url } = await linkResponse.json() as { url: string };
  assert.equal(new URL(url).pathname, "/edit/m-001", "New editing links must use the English route");
  const token = new URLSearchParams(new URL(url).hash.slice(1)).get("token")!;
  assert.equal(token.length, 43);
  assert.equal((await request("/api/edit/session", { memberId: "m-002", token })).status, 401);
  const memberCookie = cookie(await request("/api/edit/session", { memberId: "m-001", token }));
  const image = await sharp({ create: { width: 80, height: 40, channels: 4, background: "#28744f" } }).png().toBuffer();
  assert.equal((await upload("m-001", image)).status, 403);
  assert.equal((await upload("m-001", image, memberCookie)).status, 403);
  assert.equal((await request("/api/admin/family", { version: 1, name: "Forbidden", year: 2026, welcome: "", demo: false }, memberCookie, "PATCH")).status, 403);
  assert.equal((await request("/api/admin/members", { name: "Forbidden" }, memberCookie)).status, 403);
  assert.equal((await request("/api/admin/members/m-002/link", {}, memberCookie)).status, 403);
  assert.equal((await request("/api/members/m-002", preferences, memberCookie, "PATCH")).status, 403);
  assert.equal((await request("/api/members/m-001", { ...preferences, role: "admin" }, memberCookie, "PATCH")).status, 400);
  assert.equal((await request("/api/members/m-001", { ...preferences, wishes: [{ title: "No", url: "javascript:alert(1)" }] }, memberCookie, "PATCH")).status, 400);
  assert.equal((await request("/api/members/m-001", preferences, memberCookie, "PATCH")).status, 200);
  assert.equal((await request("/api/members/m-001", preferences, memberCookie, "PATCH")).status, 409);
  const publicPage = await (await fetch(`${origin}/p/m-001`)).text();
  assert.ok(publicPage.includes(preferences.introduction));
  assert.ok(!publicPage.includes(token) && !publicPage.includes(hashToken(token)) && !publicPage.includes(encoded));
  assert.ok(!(await (await fetch(`${origin}/edit/m-001`)).text()).includes("Guardar preferências"));
  assert.ok((await (await fetch(`${origin}/edit/m-001`, { headers: { Cookie: memberCookie } })).text()).includes("Guardar preferências"));
  const legacyEdit = await fetch(`${origin}/editar/m-001#token=${token}`, { redirect: "manual", headers: { Cookie: memberCookie } });
  assert.equal(legacyEdit.status, 200, "Legacy editing URLs must work without redirecting the browser-held fragment");
  assert.match(legacyEdit.headers.get("cache-control") ?? "", /no-store/);
  const legacyEditHtml = await legacyEdit.text();
  assert.ok(legacyEditHtml.includes("Guardar preferências") && !legacyEditHtml.includes(token));
  const replacementResponse = await request("/api/admin/members/m-001/link", {}, adminCookie);
  const replacement = (await replacementResponse.json() as { url: string }).url;
  const replacementToken = new URLSearchParams(new URL(replacement).hash.slice(1)).get("token")!;
  assert.equal((await request("/api/edit/session", { memberId: "m-001", token })).status, 401);
  assert.equal((await request("/api/members/m-001", { ...preferences, version: 2 }, memberCookie, "PATCH")).status, 403);
  const replacementCookie = cookie(await request("/api/edit/session", { memberId: "m-001", token: replacementToken }));
  assert.equal((await request("/api/admin/members/m-001/link", { revoke: true }, adminCookie)).status, 200);
  assert.equal((await request("/api/members/m-001", { ...preferences, version: 2 }, replacementCookie, "PATCH")).status, 403);
  assert.equal((await request("/api/edit/session", { memberId: "m-001", token: replacementToken })).status, 401);
  const created = await request("/api/admin/members", { name: "Test profile" }, adminCookie);
  assert.equal(created.status, 201);
  const createdId = (await created.json() as { id: string }).id;
  assert.equal((await fetch(`${origin}/p/${createdId}`)).status, 200);
  assert.equal((await request(`/api/admin/members/${createdId}`, { name: "New name", version: 1 }, memberCookie, "PATCH")).status, 403);
  assert.equal((await request(`/api/admin/members/${createdId}`, { name: "Updated name", version: 1 }, adminCookie, "PATCH")).status, 200);
  assert.equal((await request(`/api/admin/members/${createdId}`, { name: "Stale", version: 1 }, adminCookie, "PATCH")).status, 409);
  assert.ok((await (await fetch(`${origin}/p/${createdId}`)).text()).includes("Updated name"));
  assert.equal((await upload(createdId, Buffer.from("invalid"), adminCookie)).status, 400);
  assert.equal((await upload(createdId, Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"/>'), adminCookie)).status, 400, "Do not trust a forged PNG content type");
  assert.equal((await upload(createdId, Buffer.alloc(5 * 1024 * 1024 + 1), adminCookie)).status, 413);
  assert.equal((await upload(createdId, image, adminCookie)).status, 200);
  const avatarProfile = await (await fetch(`${origin}/p/${createdId}`)).text();
  const avatarPath = avatarProfile.match(/src="(\/avatars\/[^\"]+)"/)?.[1];
  assert.ok(avatarPath);
  const avatarResponse = await fetch(`${origin}${avatarPath}`);
  assert.equal(avatarResponse.status, 200);
  assert.equal(avatarResponse.headers.get("content-type"), "image/webp");
  const avatarBytes = Buffer.from(await avatarResponse.arrayBuffer());
  const avatarMetadata = await sharp(avatarBytes).metadata();
  assert.equal(avatarMetadata.width, 512); assert.equal(avatarMetadata.height, 512);
  const legacyAvatarPath = avatarPath.replace("/avatars/", "/avatares/");
  const legacyAvatar = await fetch(`${origin}${legacyAvatarPath}`);
  assert.equal(legacyAvatar.status, 200);
  assert.equal(legacyAvatar.headers.get("content-type"), "image/webp");
  assert.deepEqual(Buffer.from(await legacyAvatar.arrayBuffer()), avatarBytes);
  const sevenCards = await printedUrls(adminCookie);
  assert.equal(sevenCards.urls.length, 7);
  assert.ok(sevenCards.urls.includes(`${origin}/p/${createdId}`));
  assert.ok(sevenCards.html.includes(avatarPath));
  assert.ok(!sevenCards.html.includes(token), "Editing tokens must never appear in cards");
  const settings = { version: 1, name: "Test Christmas", year: 2027, welcome: "Welcome to our test family", exchangeDate: "2027-12-24", budget: { amount: 25.5, currency: "EUR" }, demo: false };
  assert.equal((await request("/api/admin/family", { ...settings, exchangeDate: "2027-02-30" }, adminCookie, "PATCH")).status, 400);
  assert.equal((await request("/api/admin/family", settings, adminCookie, "PATCH")).status, 200);
  assert.equal((await request("/api/admin/family", settings, adminCookie, "PATCH")).status, 409);
  const home = await (await fetch(origin)).text();
  assert.ok(home.includes(settings.welcome)); assert.ok(home.includes("25,50")); assert.ok(!home.includes("preferências fictícios"));
  const archivedLink = (await (await request(`/api/admin/members/${createdId}/link`, {}, adminCookie)).json() as { url: string }).url;
  const archivedToken = new URLSearchParams(new URL(archivedLink).hash.slice(1)).get("token")!;
  const archivedCookie = cookie(await request("/api/edit/session", { memberId: createdId, token: archivedToken }));
  assert.equal((await request(`/api/admin/members/${createdId}`, { action: "archive" }, memberCookie)).status, 403);
  assert.equal((await request(`/api/admin/members/${createdId}`, { action: "archive" }, adminCookie)).status, 200);
  assert.equal((await fetch(`${origin}/p/${createdId}`)).status, 404);
  assert.equal((await fetch(`${origin}${avatarPath}`)).status, 404);
  assert.equal((await fetch(`${origin}${legacyAvatarPath}`)).status, 404, "Legacy avatar routes must also hide archived members");
  assert.equal((await request(`/api/members/${createdId}`, { ...preferences, version: 3 }, archivedCookie, "PATCH")).status, 403);
  assert.equal((await printedUrls(adminCookie)).urls.length, 6);
  assert.equal((await request(`/api/admin/members/${createdId}`, { action: "restore" }, adminCookie)).status, 200);
  assert.equal((await fetch(`${origin}/p/${createdId}`)).status, 200);
  assert.equal((await fetch(`${origin}${avatarPath}`)).status, 200);
  assert.equal((await request("/api/edit/session", { memberId: createdId, token: archivedToken })).status, 401);
  await stop();
  await start(encoded);
  assert.ok((await (await fetch(`${origin}/p/m-001`)).text()).includes(preferences.introduction), "Saved preferences must survive a server restart");
  assert.equal((await fetch(`${origin}${avatarPath}`)).status, 200, "Avatar bytes must survive a server restart");
  assert.ok((await (await fetch(origin)).text()).includes(settings.welcome));
  assert.equal((await request(`/api/admin/members/${createdId}/avatar`, {}, adminCookie, "DELETE")).status, 200);
  assert.equal((await fetch(`${origin}${avatarPath}`)).status, 404);
  assert.equal((await request("/api/members/m-001", { ...preferences, version: 2 }, replacementCookie, "PATCH")).status, 403);
  assert.equal((await request("/api/session/logout", { role: "admin" }, adminCookie)).status, 200);
  assert.equal((await request("/api/admin/members", { name: "Forbidden" }, adminCookie)).status, 403);
  const beforeRotation = cookie(await request("/api/admin/login", { password }));
  await stop();
  await start(await hashPassword(randomToken()));
  assert.equal((await request("/api/admin/members", { name: "Forbidden" }, beforeRotation)).status, 403, "Credential changes must invalidate admin sessions");
  console.log("Passed: Portuguese UI, English routes and legacy aliases, protected administration/printing, CSRF, member isolation, upload validation, renaming, family settings, archive/restore, QR decoding, link/session revocation, and persistence across restarts.");
} finally {
  await stop(); rmSync(directory, { recursive: true, force: true });
}

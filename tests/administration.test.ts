import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";
import sharp from "sharp";
import jsQR from "jsqr";
import QRCode from "qrcode";
import { openStore } from "../src/lib/db/store";
import { migrations } from "../src/lib/db/migrations";
import { normaliseAvatar, MAX_AVATAR_BYTES } from "../src/lib/images";
import { cardSheets, profileQr, profileUrl } from "../src/lib/cards";
import { familySettingsSchema } from "../src/lib/validation";
import { formatBudget } from "../src/lib/sample-data";

test("Avatar processing creates a small square WebP and rejects unsupported/invalid/oversized images", async () => {
  const input = await sharp({ create: { width: 900, height: 600, channels: 4, background: "#ab5944" } }).png().toBuffer();
  const avatar = await normaliseAvatar(input);
  const metadata = await sharp(avatar).metadata();
  assert.equal(metadata.format, "webp"); assert.equal(metadata.width, 512); assert.equal(metadata.height, 512);
  assert.equal(metadata.exif, undefined);
  await assert.rejects(normaliseAvatar(Buffer.from("not an image")));
  await assert.rejects(normaliseAvatar(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><rect width="20" height="20"/></svg>')));
  await assert.rejects(normaliseAvatar(Buffer.alloc(MAX_AVATAR_BYTES + 1)));
  const large = await sharp({ create: { width: 6000, height: 5000, channels: 3, background: "white" } }).png().toBuffer();
  await assert.rejects(normaliseAvatar(large));
});

test("Renaming, avatar replacement, archiving and restoration preserve IDs and revoke access appropriately", async () => {
  const store = openStore(":memory:");
  try {
    store.seedSamples();
    const before = store.getMember("m-001")!;
    const token = store.rotateLink(before.id)!;
    const session = store.openMemberSession(before.id, token)!;
    const bytes = await normaliseAvatar(await sharp({ create: { width: 50, height: 50, channels: 3, background: "green" } }).png().toBuffer());
    store.saveAvatar(before.id, bytes);
    const uploaded = store.getMember(before.id)!;
    assert.ok(uploaded.avatarId); assert.deepEqual(store.getAvatar(uploaded.avatarId), bytes);
    assert.equal(store.saveName(before.id, before.version, "Stale"), "conflict");
    assert.equal(store.saveName(before.id, uploaded.version, "Sofia Maria"), "saved");
    assert.equal(store.getMember(before.id)?.id, before.id);
    assert.equal(store.getMember(before.id)?.wishes.length, before.wishes.length);
    store.saveAvatar(before.id, bytes);
    const replacement = store.getMember(before.id)!;
    assert.notEqual(replacement.avatarId, uploaded.avatarId);
    assert.equal(store.getAvatar(uploaded.avatarId), undefined);
    assert.equal(store.savePreferences(before.id, replacement.version, { interests: [], likes: [], avoid: [], wishes: [] }), "saved");
    assert.equal(store.getMember(before.id)?.avatarId, replacement.avatarId);
    store.setArchived(before.id, true);
    assert.equal(store.getMember(before.id), undefined);
    assert.equal(store.listArchivedMembers()[0].id, before.id);
    assert.equal(store.getAvatar(replacement.avatarId!), undefined);
    assert.equal(store.getSession(session.token, ""), undefined);
    assert.equal(store.openMemberSession(before.id, token), undefined);
    store.setArchived(before.id, false);
    assert.equal(store.getMember(before.id)?.name, "Sofia Maria");
    assert.deepEqual(store.getAvatar(replacement.avatarId!), bytes);
    assert.equal(store.openMemberSession(before.id, token), undefined);
    store.saveAvatar(before.id);
    assert.equal(store.getMember(before.id)?.avatarId, undefined);
  } finally { store.close(); }
});

test("Avatars and family settings restore together from a consistent database backup", async () => {
  const directory = mkdtempSync(join(tmpdir(), "secret-santa-avatar-backup-"));
  const store = openStore(join(directory, "family.sqlite"));
  try {
    store.seedSamples();
    const bytes = await normaliseAvatar(await sharp({ create: { width: 32, height: 32, channels: 3, background: "blue" } }).jpeg().toBuffer());
    store.saveAvatar("m-002", bytes);
    const avatarId = store.getMember("m-002")!.avatarId!;
    const family = store.getFamily();
    assert.equal(store.saveFamily(family.version, { ...family, name: "Test Christmas", demo: false }), true);
    assert.equal(store.saveFamily(family.version, { ...family, name: "Overwrite", demo: false }), false);
    await store.sqlite.backup(join(directory, "backup.sqlite"));
    const backup = openStore(join(directory, "backup.sqlite"));
    try { assert.deepEqual(backup.getAvatar(avatarId), bytes); assert.equal(backup.getFamily().name, "Test Christmas"); } finally { backup.close(); }
  } finally { store.close(); rmSync(directory, { recursive: true, force: true }); }
});

test("The avatar/archive migration upgrades a version-one database without losing member data", () => {
  const directory = mkdtempSync(join(tmpdir(), "secret-santa-migration-test-"));
  const filename = join(directory, "old.sqlite");
  const old = new Database(filename);
  old.exec(migrations[0].sql);
  old.exec("CREATE TABLE schema_migrations (version INTEGER PRIMARY KEY); INSERT INTO schema_migrations VALUES (1)");
  old.prepare("INSERT INTO members (id, data) VALUES (?, ?)").run("original", JSON.stringify({ id: "original", name: "Original name", avatar: "placeholder", colour: "sage", interests: [], likes: [], avoid: [] }));
  old.close();
  const upgraded = openStore(filename);
  try { assert.equal(upgraded.getMember("original")?.name, "Original name"); assert.equal(upgraded.getMember("original")?.avatarId, undefined); }
  finally { upgraded.close(); rmSync(directory, { recursive: true, force: true }); }
});

test("QR codes decode to permanent public profile URLs and card sheets contain at most six members", async () => {
  const origin = "https://christmas.family.example";
  const id = "ed1eff2a-9b16-4470-9287-4ba1fcce7370";
  const expected = profileUrl(origin, id);
  const dataUrl = await profileQr(origin, id);
  const svg = Buffer.from(dataUrl.split(",")[1], "base64");
  const dimension = (QRCode.create(expected, { errorCorrectionLevel: "M" }).modules.size + 8) * 8;
  const { data, info } = await sharp(svg).resize(dimension, dimension, { kernel: "nearest" }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.equal(jsQR(new Uint8ClampedArray(data), info.width, info.height)?.data, expected);
  assert.ok(!expected.includes("edit") && !expected.includes("token"));
  assert.deepEqual(cardSheets(Array.from({ length: 13 }, (_, index) => index)).map(page => page.length), [6, 6, 1]);
  assert.deepEqual(cardSheets([]), []);
});

test("Family settings reject impossible dates and unsupported currency and preserve budget cents", () => {
  const valid = { version: 1, name: "Family", year: 2026, welcome: "Hello", demo: false };
  assert.equal(familySettingsSchema.safeParse(valid).success, true);
  assert.equal(familySettingsSchema.safeParse({ ...valid, exchangeDate: "2026-02-30" }).success, false);
  assert.equal(familySettingsSchema.safeParse({ ...valid, budget: { amount: 25, currency: "INVALID" } }).success, false);
  assert.ok(formatBudget({ amount: 25.5, currency: "EUR" }).includes("25,50"));
});

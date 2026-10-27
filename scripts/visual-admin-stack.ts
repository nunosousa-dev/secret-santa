import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { openStore } from "../src/lib/db/store";
import { hashPassword, randomToken } from "../src/lib/security";
import { DATABASE_FILE, STATE_DIR, STATE_FILE, type VisualAdminState } from "./visual-admin-state";

/**
 * Prepares a fresh, isolated SQLite database under the OS temp directory
 * (never `data/family.sqlite`) with a known synthetic admin password and a
 * known synthetic member editing session, then starts the standalone
 * production server against it. This is the `webServer.command` for
 * playwright.admin.config.ts and mirrors the pattern in scripts/auth-smoke.ts;
 * it never touches real family data.
 */
rmSync(STATE_DIR, { recursive: true, force: true });
mkdirSync(STATE_DIR, { recursive: true });

const store = openStore(DATABASE_FILE);
store.seedSamples(); // 6 fictional members (m-001..m-006); also marks the family as a demo/preview

const memberId = "m-001";
const editToken = store.rotateLink(memberId);
if (!editToken) throw new Error("Could not create a sample editing link for the visual harness.");
const memberSession = store.openMemberSession(memberId, editToken);
if (!memberSession) throw new Error("Could not open a sample member session for the visual harness.");

const adminPassword = randomToken();
const adminPasswordHash = await hashPassword(adminPassword);
store.close();

const state: VisualAdminState = {
  adminPassword,
  memberId,
  memberSessionToken: memberSession.token,
  memberSessionExpiresAt: memberSession.expiresAt,
};
writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));

process.env.DATABASE_PATH = DATABASE_FILE;
process.env.ADMIN_PASSWORD_HASH = adminPasswordHash;
// PORT, HOSTNAME, APP_URL and NODE_ENV come from playwright.admin.config.ts's webServer.env.
// A non-literal specifier keeps `next build`'s TypeScript pass from trying to
// resolve this path, which is only produced by that same build (see scripts/start.mjs).
const standaloneServerEntry = ["..", ".next", "standalone", "server.js"].join("/");
await import(standaloneServerEntry);

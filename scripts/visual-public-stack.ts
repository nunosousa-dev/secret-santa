import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { openStore } from "../src/lib/db/store";
import { DATABASE_FILE, STATE_DIR, STATE_FILE, type VisualPublicState } from "./visual-public-state";

/**
 * Prepares a fresh, isolated SQLite database under the OS temp directory
 * (never `data/family.sqlite`) with the standard sample members plus one
 * synthetic long-name member with no named avatar (so the public profile
 * page's initials-fallback avatar and long-name layout both get exercised
 * without depending on a real family member's UUID), then starts the
 * standalone production server against it. This is the `webServer.command`
 * for playwright.config.ts and mirrors scripts/visual-admin-stack.ts; it
 * never touches real family data.
 */
rmSync(STATE_DIR, { recursive: true, force: true });
mkdirSync(STATE_DIR, { recursive: true });

const store = openStore(DATABASE_FILE);
store.seedSamples(); // 6 fictional members (m-001..m-006); also marks the family as a demo/preview

const longNameMemberId = store.createMember("Beatriz Montenegro Aguiar");
store.close();

const state: VisualPublicState = { longNameMemberId };
writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));

process.env.DATABASE_PATH = DATABASE_FILE;
// PORT, HOSTNAME and APP_URL come from playwright.config.ts's webServer.env.
// A non-literal specifier keeps `next build`'s TypeScript pass from trying to
// resolve this path, which is only produced by that same build (see scripts/start.mjs).
const standaloneServerEntry = ["..", ".next", "standalone", "server.js"].join("/");
await import(standaloneServerEntry);

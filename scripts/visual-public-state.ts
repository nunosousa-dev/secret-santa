import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Shared constants for the public visual-acceptance harness
 * (playwright.config.ts, scripts/visual-public-stack.ts and
 * tests/visual-acceptance.spec.ts).
 *
 * The database this harness creates is entirely synthetic and lives
 * under the OS temp directory — never under the committed/gitignored
 * `data/` directory, and never the hand-maintained repo database. This
 * keeps the public screenshot pass reproducible in any fresh clone,
 * worktree or CI run, instead of depending on one developer's locally
 * seeded real family data.
 */
export const PORT = 3100;
export const HOST = "127.0.0.1";
export const ORIGIN = `http://${HOST}:${PORT}`;

export const STATE_DIR = join(tmpdir(), "secret-santa-visual-public");
export const DATABASE_FILE = join(STATE_DIR, "family.sqlite");
export const STATE_FILE = join(STATE_DIR, "state.json");

export type VisualPublicState = {
  longNameMemberId: string;
};

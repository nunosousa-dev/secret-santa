import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Shared constants for the admin/edit visual-acceptance harness
 * (playwright.admin.config.ts, scripts/visual-admin-stack.ts and
 * tests/visual-acceptance-admin.spec.ts).
 *
 * The database and credentials this harness creates are entirely
 * synthetic and live under the OS temp directory — never under the
 * committed/gitignored `data/` directory, and never derived from a
 * real family member or a real admin password.
 */
export const PORT = 3101;
export const HOST = "127.0.0.1";
export const ORIGIN = `http://${HOST}:${PORT}`;

export const STATE_DIR = join(tmpdir(), "secret-santa-visual-admin");
export const DATABASE_FILE = join(STATE_DIR, "family.sqlite");
export const STATE_FILE = join(STATE_DIR, "state.json");

export type VisualAdminState = {
  adminPassword: string;
  memberId: string;
  memberSessionToken: string;
  memberSessionExpiresAt: number;
};

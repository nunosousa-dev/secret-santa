/** Parses one HTTP(S) origin, rejecting embedded credentials, and returns its canonical form. */
export function parseOrigin(value: string, setting: string): string {
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new Error(`${setting} must be an HTTP(S) origin`);
  return url.origin;
}

/**
 * `APP_URL` is the canonical origin used for shared links and printed QR codes.
 * `ADDITIONAL_ORIGINS` (comma-separated) lists other hostnames serving the same app
 * from which browser mutations are also accepted.
 */
export function allowedOrigins(env: Record<string, string | undefined>): string[] {
  const canonical = parseOrigin(env.APP_URL || "http://localhost:3000", "APP_URL");
  const additional = (env.ADDITIONAL_ORIGINS ?? "").split(",").map(value => value.trim()).filter(Boolean).map(value => parseOrigin(value, "ADDITIONAL_ORIGINS"));
  return [...new Set([canonical, ...additional])];
}

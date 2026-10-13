import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";

export const randomToken = () => randomBytes(32).toString("base64url");
export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
export const validToken = (token: string) => /^[A-Za-z0-9_-]{43}$/.test(token);

function derive(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (error, key) => error ? reject(error) : resolve(key));
  });
}

export function validPasswordHash(value: string): boolean {
  return /^scrypt:32768:8:1:[a-f0-9]{32}:[a-f0-9]{128}$/.test(value);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  return `scrypt:32768:8:1:${salt}:${(await derive(password, salt)).toString("hex")}`;
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  if (!validPasswordHash(encoded) || password.length > 256) return false;
  const parts = encoded.split(":");
  const actual = await derive(password, parts[4]);
  return timingSafeEqual(actual, Buffer.from(parts[5], "hex"));
}

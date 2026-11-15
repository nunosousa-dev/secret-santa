import "server-only";
import { cookies } from "next/headers";
import { getStore } from "./db";
import { allowedOrigins } from "./origins";
import { validPasswordHash } from "./security";

export const ADMIN_COOKIE = "as_admin";
export const MEMBER_COOKIE = "as_member";

export function adminPasswordHash(): string {
  const value = process.env.ADMIN_PASSWORD_HASH ?? "";
  return validPasswordHash(value) ? value : "";
}

export function appOrigin(): string {
  return allowedOrigins(process.env)[0];
}

export function acceptedOrigins(): string[] {
  return allowedOrigins(process.env);
}

export async function adminSession() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  const session = getStore().getSession(token, adminPasswordHash());
  return session?.role === "admin" ? session : undefined;
}

export async function canEditMember(id: string) {
  if (await adminSession()) return true;
  const token = (await cookies()).get(MEMBER_COOKIE)?.value;
  const session = getStore().getSession(token, adminPasswordHash());
  return session?.role === "member" && session.memberId === id;
}

export async function setSessionCookie(name: string, session: { token: string; expiresAt: number }) {
  (await cookies()).set(name, session.token, {
    httpOnly: true, secure: appOrigin().startsWith("https:"), sameSite: "lax", path: "/", expires: new Date(session.expiresAt),
  });
}

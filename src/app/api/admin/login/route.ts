import { ADMIN_COOKIE, adminPasswordHash, setSessionCookie } from "@/lib/auth";
import { getStore } from "@/lib/db";
import { hashToken, verifyPassword } from "@/lib/security";
import { handleMutation, HttpError, json, readJson } from "@/lib/http";

export async function POST(request: Request) {
  return handleMutation(request, async () => {
    const encoded = adminPasswordHash();
    if (!encoded) throw new HttpError(503, "A administração ainda não está disponível.");
    if (!getStore().takeAttempt("admin-login", 20, 15 * 60 * 1000)) throw new HttpError(429, "Demasiadas tentativas. Tenta novamente dentro de 15 minutos.");
    const body = await readJson(request);
    const password = body && typeof body === "object" && "password" in body ? body.password : undefined;
    if (typeof password !== "string" || !(await verifyPassword(password, encoded))) throw new HttpError(401, "Palavra-passe incorreta.");
    await setSessionCookie(ADMIN_COOKIE, getStore().createSession("admin", hashToken(encoded)));
    return json({ ok: true });
  });
}

import { MEMBER_COOKIE, setSessionCookie } from "@/lib/auth";
import { getStore } from "@/lib/db";
import { handleMutation, HttpError, json, readJson } from "@/lib/http";

export async function POST(request: Request) {
  return handleMutation(request, async () => {
    const body = await readJson(request);
    if (!body || typeof body !== "object" || !("memberId" in body) || !("token" in body) || typeof body.memberId !== "string" || typeof body.token !== "string") throw new HttpError(400, "Ligação de edição inválida.");
    const session = getStore().openMemberSession(body.memberId, body.token);
    if (!session) throw new HttpError(401, "Esta ligação é inválida ou foi substituída. Pede uma nova ao organizador.");
    await setSessionCookie(MEMBER_COOKIE, session);
    return json({ ok: true });
  });
}

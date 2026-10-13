import { adminSession, appOrigin } from "@/lib/auth";
import { getStore } from "@/lib/db";
import { handleMutation, HttpError, json, readJson } from "@/lib/http";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleMutation(request, async () => {
    const body = await readJson(request);
    if (!(await adminSession())) throw new HttpError(403, "Acesso reservado ao organizador.");
    const { id } = await params;
    if (!getStore().getMember(id)) throw new HttpError(404, "Perfil não encontrado.");
    if (body && typeof body === "object" && "revoke" in body && body.revoke === true) {
      getStore().revokeLink(id);
      return json({ ok: true });
    }
    const token = getStore().rotateLink(id)!;
    return json({ url: `${appOrigin()}/edit/${encodeURIComponent(id)}#token=${token}` });
  });
}

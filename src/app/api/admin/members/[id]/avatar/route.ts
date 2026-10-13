import { adminSession } from "@/lib/auth";
import { getStore } from "@/lib/db";
import { handleMutation, HttpError, json, readBody, readJson } from "@/lib/http";
import { MAX_AVATAR_BYTES, normaliseAvatar } from "@/lib/images";

type Context = { params: Promise<{ id: string }> };
export async function POST(request: Request, { params }: Context) {
  return handleMutation(request, async () => {
    if (!(await adminSession())) throw new HttpError(403, "Acesso reservado ao organizador.");
    const { id } = await params;
    if (!getStore().getMember(id)) throw new HttpError(404, "Perfil não encontrado.");
    const input = await readBody(request, MAX_AVATAR_BYTES);
    let bytes: Buffer;
    try { bytes = await normaliseAvatar(input); } catch (error) { throw new HttpError(400, error instanceof Error ? error.message : "Imagem inválida."); }
    if (!(await adminSession())) throw new HttpError(403, "A sessão terminou. Volta a entrar.");
    if (!getStore().saveAvatar(id, bytes)) throw new HttpError(404, "Perfil não encontrado.");
    return json({ ok: true });
  }, ["image/png", "image/jpeg", "image/webp", "application/octet-stream"]);
}
export async function DELETE(request: Request, { params }: Context) {
  return handleMutation(request, async () => {
    await readJson(request);
    if (!(await adminSession())) throw new HttpError(403, "Acesso reservado ao organizador.");
    if (!getStore().saveAvatar((await params).id)) throw new HttpError(404, "Perfil não encontrado.");
    return json({ ok: true });
  });
}

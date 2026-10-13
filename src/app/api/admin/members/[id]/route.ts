import { adminSession } from "@/lib/auth";
import { getStore } from "@/lib/db";
import { handleMutation, HttpError, json, readJson } from "@/lib/http";
import { archiveSchema, renameSchema } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, { params }: Context) {
  return handleMutation(request, async () => {
    const parsed = renameSchema.safeParse(await readJson(request), { error: () => "Revê o nome e recarrega o perfil se necessário." });
    if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);
    if (!(await adminSession())) throw new HttpError(403, "Acesso reservado ao organizador.");
    const result = getStore().saveName((await params).id, parsed.data.version, parsed.data.name);
    if (result === "missing") throw new HttpError(404, "Perfil não encontrado.");
    if (result === "conflict") throw new HttpError(409, "O perfil foi alterado. Recarrega a página antes de mudar o nome.");
    return json({ ok: true });
  });
}
export async function POST(request: Request, { params }: Context) {
  return handleMutation(request, async () => {
    const parsed = archiveSchema.safeParse(await readJson(request));
    if (!parsed.success) throw new HttpError(400, "Escolhe uma ação válida.");
    if (!(await adminSession())) throw new HttpError(403, "Acesso reservado ao organizador.");
    if (!getStore().setArchived((await params).id, parsed.data.action === "archive")) throw new HttpError(404, "Perfil não encontrado.");
    return json({ ok: true });
  });
}

import { canEditMember } from "@/lib/auth";
import { getStore } from "@/lib/db";
import { handleMutation, HttpError, json, readJson } from "@/lib/http";
import { preferencesSchema } from "@/lib/validation";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleMutation(request, async () => {
    const { id } = await params;
    const parsed = preferencesSchema.safeParse(await readJson(request), { error: () => "Valor inválido. Revê este campo." });
    if (!parsed.success) return json({ error: "Revê os campos indicados.", fields: parsed.error.issues.map(issue => ({ path: issue.path.join("."), message: issue.message })) }, 400);
    // Authorise immediately before the synchronous transaction, including link revocation.
    if (!(await canEditMember(id))) throw new HttpError(403, "Não tens acesso para editar este perfil.");
    const { version, ...preferences } = parsed.data;
    const result = getStore().savePreferences(id, version, preferences);
    if (result === "missing") throw new HttpError(404, "Perfil não encontrado.");
    if (result === "conflict") throw new HttpError(409, "Este perfil foi alterado noutro dispositivo. Recarrega a página antes de guardar novamente.");
    return json({ ok: true, version: version + 1 });
  });
}

import { adminSession } from "@/lib/auth";
import { getStore } from "@/lib/db";
import { handleMutation, HttpError, json, readJson } from "@/lib/http";
import { familySettingsSchema } from "@/lib/validation";

export async function PATCH(request: Request) {
  return handleMutation(request, async () => {
    const parsed = familySettingsSchema.safeParse(await readJson(request), { error: () => "Revê o título, ano, data e orçamento." });
    if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);
    if (!(await adminSession())) throw new HttpError(403, "Acesso reservado ao organizador.");
    const { version, ...data } = parsed.data;
    if (!getStore().saveFamily(version, data)) throw new HttpError(409, "As definições foram alteradas. Recarrega a página antes de guardar.");
    return json({ ok: true, version: version + 1 });
  });
}

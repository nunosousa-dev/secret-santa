import { adminSession } from "@/lib/auth";
import { getStore } from "@/lib/db";
import { handleMutation, HttpError, json, readJson } from "@/lib/http";
import { memberNameSchema } from "@/lib/validation";

export async function POST(request: Request) {
  return handleMutation(request, async () => {
    if (!(await adminSession())) throw new HttpError(403, "Acesso reservado ao organizador.");
    const parsed = memberNameSchema.safeParse(await readJson(request), { error: () => "Escreve um nome válido." });
    if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);
    return json({ id: getStore().createMember(parsed.data.name) }, 201);
  });
}

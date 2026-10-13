import { cookies } from "next/headers";
import { ADMIN_COOKIE, MEMBER_COOKIE } from "@/lib/auth";
import { getStore } from "@/lib/db";
import { handleMutation, json, readJson } from "@/lib/http";

export async function POST(request: Request) {
  return handleMutation(request, async () => {
    const body = await readJson(request);
    const role = body && typeof body === "object" && "role" in body ? body.role : "member";
    const name = role === "admin" ? ADMIN_COOKIE : MEMBER_COOKIE;
    const jar = await cookies();
    const token = jar.get(name)?.value;
    if (token) getStore().deleteSession(token);
    jar.delete(name);
    return json({ ok: true });
  });
}

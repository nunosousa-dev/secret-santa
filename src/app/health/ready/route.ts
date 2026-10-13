import { adminPasswordHash } from "@/lib/auth";
import { getStore } from "@/lib/db";

export function GET() {
  try {
    if (!adminPasswordHash()) throw new Error("Admin unavailable");
    getStore().sqlite.prepare("SELECT 1").get();
    return Response.json({ status: "ready" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ status: "unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

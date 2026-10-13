import { getStore } from "@/lib/db";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const bytes = getStore().getAvatar((await params).id);
  if (!bytes) return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  return new Response(new Uint8Array(bytes), { headers: {
    "Content-Type": "image/webp", "Content-Length": String(bytes.length),
    "Cache-Control": "public, max-age=86400, immutable", "X-Content-Type-Options": "nosniff",
  } });
}

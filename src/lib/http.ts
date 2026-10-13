import "server-only";
import { appOrigin } from "./auth";

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });

export function assertSameOrigin(request: Request, contentTypes = ["application/json"]) {
  if (request.headers.get("origin") !== appOrigin()) throw new HttpError(403, "Pedido não autorizado.");
  if (!contentTypes.includes(request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() ?? "")) throw new HttpError(415, "Formato de pedido inválido.");
}

export async function readBody(request: Request, maximum = 64 * 1024): Promise<Buffer> {
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "Pedido vazio.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    size += chunk.value.byteLength;
    if (size > maximum) { await reader.cancel(); throw new HttpError(413, "O ficheiro ou formulário é demasiado grande."); }
    chunks.push(chunk.value);
  }
  return Buffer.concat(chunks);
}

export async function readJson(request: Request): Promise<unknown> {
  const body = await readBody(request);
  try { return JSON.parse(body.toString("utf8")); } catch { throw new HttpError(400, "Não foi possível ler o formulário."); }
}

export async function handleMutation(request: Request, handler: () => Promise<Response>, contentTypes?: string[]) {
  try { assertSameOrigin(request, contentTypes); return await handler(); }
  catch (error) {
    if (error instanceof HttpError) return json({ error: error.message }, error.status);
    // Do not log request bodies, passwords, tokens, or credential-bearing URLs.
    console.error("A server mutation failed.");
    return json({ error: "Não foi possível concluir o pedido. Tenta novamente." }, 500);
  }
}

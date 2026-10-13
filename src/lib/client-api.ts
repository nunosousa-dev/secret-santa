export class ApiError extends Error {
  constructor(message: string, public status: number, public fields: { path: string; message: string }[] = []) { super(message); }
}

export async function apiRequest<T>(path: string, body: unknown, method = "POST"): Promise<T> {
  const response = await fetch(path, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store" });
  const data = await response.json();
  if (!response.ok) throw new ApiError(data.error || "Não foi possível concluir o pedido.", response.status, data.fields ?? []);
  return data as T;
}

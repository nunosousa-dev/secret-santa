import { z } from "zod";

const short = z.string().trim().max(120, "Usa até 120 caracteres.");
const optionalText = z.string().trim().max(1500, "Usa até 1500 caracteres.").optional();
const list = z.array(short.min(1, "Remove as linhas vazias.")).max(30, "Usa até 30 itens.");
const shopUrl = z.string().trim().max(2048).refine(value => {
  if (!value) return true;
  try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password; } catch { return false; }
}, "Usa uma ligação http ou https válida.").optional();

export const preferencesSchema = z.object({
  version: z.number().int().positive(),
  introduction: z.string().trim().max(200).optional(),
  interests: list,
  likes: list,
  avoid: list,
  wishes: z.array(z.object({ title: short.min(1, "Escreve um título para o desejo."), note: optionalText, url: shopUrl }).strict()).max(30),
  sizes: z.array(z.object({ label: short.min(1), value: short.min(1) }).strict()).max(15).optional(),
  note: optionalText,
}).strict();

export const memberNameSchema = z.object({ name: z.string().trim().min(1, "Escreve o nome.").max(80, "Usa até 80 caracteres.") }).strict();

export const renameSchema = memberNameSchema.extend({ version: z.number().int().positive() }).strict();
export const archiveSchema = z.object({ action: z.enum(["archive", "restore"]) }).strict();
const exchangeDate = z.string().refine(value => {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "Escolhe uma data válida.").optional().transform(value => value || undefined);
export const familySettingsSchema = z.object({
  version: z.number().int().positive(),
  name: z.string().trim().min(1, "Escreve um título para a família.").max(80),
  year: z.number().int().min(2000).max(2100),
  welcome: z.string().trim().max(500),
  exchangeDate,
  budget: z.object({ amount: z.number().min(0.01).max(10000).multipleOf(0.01, "Usa até duas casas decimais no orçamento."), currency: z.enum(["EUR", "GBP", "USD"]) }).strict().optional(),
  demo: z.boolean(),
}).strict();

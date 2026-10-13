"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Family } from "@/lib/types";
import { apiRequest } from "@/lib/client-api";
import styles from "./forms.module.css";

export function FamilySettings({ family }: { family: Family & { demo: boolean; version: number } }) {
  const router = useRouter();
  const [version, setVersion] = useState(family.version);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const amount = String(form.get("amount") ?? "");
    const body = { version, name: form.get("name"), welcome: form.get("welcome"), year: Number(form.get("year")), exchangeDate: form.get("exchangeDate"), budget: amount ? { amount: Number(amount), currency: form.get("currency") } : undefined, demo: form.get("demo") === "on" };
    setPending(true); setError(""); setMessage("");
    try { const result = await apiRequest<{ version: number }>("/api/admin/family", body, "PATCH"); setVersion(result.version); setMessage("Definições guardadas."); router.refresh(); }
    catch (error) { setError(error instanceof Error ? error.message : "Não foi possível guardar."); }
    finally { setPending(false); }
  }
  return <section className={styles.card}><h2>O nosso encontro</h2><form className={styles.form} onSubmit={save}><fieldset disabled={pending}>
    <div className={styles.field}><label htmlFor="family-name">Título da família</label><input id="family-name" name="name" required maxLength={80} defaultValue={family.name} /></div>
    <div className={styles.field}><label htmlFor="family-welcome">Mensagem de boas-vindas</label><textarea id="family-welcome" name="welcome" rows={3} maxLength={500} defaultValue={family.welcome} /></div>
    <div className={styles.field}><label htmlFor="family-year">Ano</label><input id="family-year" name="year" type="number" inputMode="numeric" required min={2000} max={2100} defaultValue={family.year} /></div>
    <div className={styles.field}><label htmlFor="family-date">Data da troca (opcional)</label><input id="family-date" name="exchangeDate" type="date" defaultValue={family.exchangeDate ?? ""} /></div>
    <div className={styles.field}><label htmlFor="family-budget">Orçamento por presente (opcional)</label><input id="family-budget" name="amount" type="number" inputMode="decimal" min="0.01" max="10000" step="0.01" defaultValue={family.budget?.amount ?? ""} /></div>
    <div className={styles.field}><label htmlFor="family-currency">Moeda</label><select id="family-currency" name="currency" defaultValue={family.budget?.currency ?? "EUR"}><option value="EUR">Euro (€)</option><option value="GBP">Libra (£)</option><option value="USD">Dólar ($)</option></select></div>
    <label className={styles.checkbox}><input name="demo" type="checkbox" defaultChecked={family.demo} /><span>Esta família ainda usa perfis de exemplo</span></label><p className={styles.help}>Desmarca quando os perfis forem reais para retirar o aviso de pré-visualização.</p>
    {message && <p className={styles.status} role="status">{message}</p>}{error && <p className={`${styles.status} ${styles.error}`} role="alert">{error}</p>}
    <button type="submit" className="button" disabled={pending}>{pending ? "A guardar…" : "Guardar definições"}</button>
  </fieldset></form></section>;
}

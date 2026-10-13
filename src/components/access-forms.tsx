"use client";

import { useState, type FormEvent } from "react";
import { apiRequest } from "@/lib/client-api";
import styles from "./forms.module.css";

export function AdminLogin() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const password = new FormData(event.currentTarget).get("password");
    setPending(true); setError("");
    try { await apiRequest("/api/admin/login", { password }); window.location.replace("/admin"); }
    catch (error) { setError(error instanceof Error ? error.message : "Não foi possível entrar."); setPending(false); }
  }
  return <form onSubmit={submit} className={styles.form}>
    <div className={styles.field}><label htmlFor="admin-password">Palavra-passe do organizador</label><input id="admin-password" name="password" type="password" autoComplete="current-password" required maxLength={256} disabled={pending} /></div>
    {error && <p className={`${styles.status} ${styles.error}`} role="alert">{error}</p>}
    <button className="button" disabled={pending} type="submit">{pending ? "A entrar…" : "Entrar na administração"}</button>
  </form>;
}

export function EditAccess({ memberId }: { memberId: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function open() {
    const token = new URLSearchParams(window.location.hash.slice(1)).get("token");
    // A fragment is not sent to the server. Remove it before exchanging the token.
    window.history.replaceState(null, "", window.location.pathname);
    if (!token) { setError("Abre a ligação privada completa que o organizador te enviou."); return; }
    setPending(true); setError("");
    try { await apiRequest("/api/edit/session", { memberId, token }); window.location.replace(`/edit/${encodeURIComponent(memberId)}`); }
    catch (error) { setError(error instanceof Error ? error.message : "Não foi possível abrir a edição."); setPending(false); }
  }
  return <div className={styles.form}><p className={styles.help}>Esta ligação permite editar apenas o teu perfil. Guarda-a para voltares mais tarde.</p>{error && <p role="alert" className={`${styles.status} ${styles.error}`}>{error} Volta a abrir a ligação original para tentar novamente.</p>}<button className="button" type="button" disabled={pending} onClick={open}>{pending ? "A abrir…" : "Abrir a minha edição"}</button></div>;
}

export function LogoutButton({ role }: { role: "admin" | "member" }) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function logout() {
    setPending(true); setError("");
    try { await apiRequest("/api/session/logout", { role }); window.location.replace(role === "admin" ? "/admin" : "/"); }
    catch { setError("Não foi possível sair. Tenta novamente."); setPending(false); }
  }
  return <div><button type="button" className={styles.textButton} disabled={pending} onClick={logout}>{pending ? "A sair…" : "Terminar sessão"}</button>{error && <p role="alert" className={styles.help}>{error}</p>}</div>;
}

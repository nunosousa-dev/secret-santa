"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/client-api";
import { LogoutButton } from "./access-forms";
import { MemberTools, type AdminMember } from "./member-tools";
import { FamilySettings } from "./family-settings";
import type { Family } from "@/lib/types";
import styles from "./forms.module.css";

export function AdminPanel({ members, archived, family }: { members: AdminMember[]; archived: { id: string; name: string }[]; family: Family & { demo: boolean; version: number } }) {
  const router = useRouter();
  const [links, setLinks] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const name = new FormData(form).get("name");
    setBusy("new"); setError("");
    try { await apiRequest("/api/admin/members", { name }); form.reset(); router.refresh(); }
    catch (error) { setError(error instanceof Error ? error.message : "Não foi possível criar o perfil."); }
    finally { setBusy(""); }
  }

  async function changeLink(member: typeof members[number], revoke = false) {
    if ((revoke || member.hasLink || links[member.id]) && !window.confirm(revoke ? `Revogar a ligação de ${member.name}? As sessões de edição também serão terminadas.` : `Substituir a ligação de ${member.name}? A ligação anterior e as sessões abertas com ela deixarão de funcionar.`)) return;
    setBusy(member.id); setError(""); setCopied("");
    try {
      const result = await apiRequest<{ url?: string }>(`/api/admin/members/${member.id}/link`, { revoke });
      setLinks(previous => { const next = { ...previous }; if (result.url) next[member.id] = result.url; else delete next[member.id]; return next; });
      router.refresh();
    } catch (error) { setError(error instanceof Error ? error.message : "Não foi possível alterar a ligação."); }
    finally { setBusy(""); }
  }

  async function copy(id: string) {
    try { await navigator.clipboard.writeText(links[id]); setCopied(id); }
    catch { setError("Não foi possível copiar automaticamente. Seleciona e copia a ligação no campo."); }
  }

  async function archive(member: { id: string; name: string }, restore = false) {
    if (!restore && !window.confirm(`Arquivar ${member.name}? O perfil deixa de estar público e o acesso de edição será revogado. Poderás restaurá-lo mais tarde.`)) return;
    setBusy(member.id); setError("");
    try {
      await apiRequest(`/api/admin/members/${member.id}`, { action: restore ? "restore" : "archive" });
      setLinks(previous => { const next = { ...previous }; delete next[member.id]; return next; });
      router.refresh();
    } catch (error) { setError(error instanceof Error ? error.message : "Não foi possível atualizar o perfil."); }
    finally { setBusy(""); }
  }

  return <>
    <div className={styles.actions}><Link className="button button-secondary" href="/admin/cards">Preparar cartões do sorteio</Link></div>
    <FamilySettings family={family} />
    <section className={styles.card}><h2>Acrescentar à família</h2><form className={styles.form} onSubmit={create}><div className={styles.field}><label htmlFor="new-name">Nome</label><input id="new-name" name="name" required maxLength={80} autoComplete="off" disabled={Boolean(busy)} /></div><button type="submit" className="button" disabled={Boolean(busy)}>{busy === "new" ? "A criar…" : "Criar perfil"}</button></form></section>
    {error && <p role="alert" className={`${styles.status} ${styles.error}`}>{error}</p>}
    <section className={styles.card}><h2>Perfis e ligações privadas</h2><p className={styles.lead}>Envia a ligação de edição apenas à pessoa certa. A ligação pública do perfil pode ser partilhada com toda a família.</p>
      {members.length === 0 && <p className={styles.help}>Ainda não há perfis. Acrescenta o primeiro membro acima.</p>}
      <ul className={styles.memberList}>{members.map(member => <li className={styles.memberRow} key={member.id}>
        <h3 className={styles.memberName}>{member.name}</h3>
        <MemberTools member={member} />
        <div className={styles.actions}><Link className={styles.textButton} href={`/p/${member.id}`}>Ver perfil público</Link><Link className={styles.textButton} href={`/edit/${member.id}`}>Editar preferências</Link></div>
        <div className={styles.actions}><button type="button" className="button button-secondary" disabled={Boolean(busy)} onClick={() => changeLink(member)}>{busy === member.id ? "A atualizar…" : member.hasLink ? "Substituir ligação privada" : "Criar ligação privada"}</button>{member.hasLink && <button className={styles.textButton} type="button" disabled={Boolean(busy)} onClick={() => changeLink(member, true)}>Revogar ligação</button>}</div>
        {links[member.id] && <div className={styles.privateLink}><p className={styles.help}>Copia esta ligação agora. Por segurança, não a poderás recuperar após sair desta página; poderás criar outra.</p><div className={styles.field}><label htmlFor={`private-${member.id}`}>Ligação privada de {member.name}</label><input id={`private-${member.id}`} readOnly value={links[member.id]} onFocus={event => event.target.select()} /></div><button type="button" className="button" onClick={() => copy(member.id)}>{copied === member.id ? "Ligação copiada!" : "Copiar ligação"}</button></div>}
        <button className={styles.textButton} type="button" disabled={Boolean(busy)} onClick={() => archive(member)}>Arquivar perfil</button>
      </li>)}</ul>
    </section>
    {archived.length > 0 && <section className={styles.card}><h2>Perfis arquivados</h2><p className={styles.lead}>Restaurar mantém o endereço original. Para voltar a editar, cria uma nova ligação privada.</p><ul className={styles.memberList}>{archived.map(member => <li className={styles.memberRow} key={member.id}><h3 className={styles.memberName}>{member.name}</h3><button className="button button-secondary" type="button" disabled={Boolean(busy)} onClick={() => archive(member, true)}>Restaurar perfil</button></li>)}</ul></section>}
    <LogoutButton role="admin" />
  </>;
}

import type { Metadata } from "next";
import Link from "next/link";
import { adminPasswordHash, adminSession } from "@/lib/auth";
import { getStore } from "@/lib/db";
import { AdminLogin } from "@/components/access-forms";
import { AdminPanel } from "@/components/admin-panel";
import styles from "@/components/forms.module.css";

export const metadata: Metadata = { title: "Administração" };

export default async function AdminPage() {
  const session = await adminSession();
  const linkedIds = session ? getStore().linkedMemberIds() : new Set<string>();
  return <main id="conteudo" className={`container ${styles.page} ${!session ? styles.login : ""}`}>
    <Link className={styles.back} href="/">← Voltar à família</Link><p className="eyebrow">O CANTINHO DO ORGANIZADOR</p><h1>Preparar o nosso Natal.</h1>
    {session ? <AdminPanel family={getStore().getFamily()} archived={getStore().listArchivedMembers().map(member => ({ id: member.id, name: member.name }))} members={getStore().listMembers().map(member => ({ id: member.id, name: member.name, avatar: member.avatar, avatarId: member.avatarId, colour: member.colour, version: member.version, hasLink: linkedIds.has(member.id) }))} /> : adminPasswordHash() ? <><p className={styles.lead}>Entra para gerir os perfis e as ligações privadas da família.</p><section className={styles.card}><AdminLogin /></section></> : <p className={styles.lead}>A administração ainda não está disponível. Contacta o organizador.</p>}
  </main>;
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { adminSession, canEditMember } from "@/lib/auth";
import { getStore } from "@/lib/db";
import { EditAccess } from "@/components/access-forms";
import { MemberEditor } from "@/components/member-editor";
import styles from "@/components/forms.module.css";

export const metadata: Metadata = { title: "Editar preferências" };

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const member = getStore().getMember(id);
  if (!member) notFound();
  const allowed = await canEditMember(id);
  return <main id="conteudo" className={`container ${styles.page}`}><Link className={styles.back} href={`/p/${id}`}>← Ver perfil público</Link><p className="eyebrow">O MEU CANTINHO DE NATAL</p><h1>Os desejos de {member.name}.</h1>{allowed ? <MemberEditor member={member} isAdmin={Boolean(await adminSession())} /> : <section className={styles.card}><h2>A tua ligação privada</h2><EditAccess memberId={id} /></section>}</main>;
}

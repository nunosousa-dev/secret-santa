import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { adminSession, appOrigin } from "@/lib/auth";
import { getStore } from "@/lib/db";
import { cardSheets, profileQr } from "@/lib/cards";
import { Avatar } from "@/components/avatar";
import { PrintButton } from "@/components/print-button";
import styles from "./print.module.css";

export const metadata: Metadata = { title: "Cartões do sorteio" };
export default async function CardsPage() {
  if (!(await adminSession())) redirect("/admin");
  const origin = appOrigin();
  const members = getStore().listMembers();
  const cards = await Promise.all(members.map(async member => ({ member, qr: await profileQr(origin, member.id) })));
  return <main id="conteudo" className={`container ${styles.page}`}>
    <div className={styles.tools} data-print-hidden><Link href="/admin">← Voltar à administração</Link><p className="eyebrow">O NOSSO SORTEIO</p><h1>Um cartão, uma surpresa.</h1><p>Imprime em A4, a 100% de escala, sem cabeçalhos nem rodapés do navegador. Recorta pelo contorno e dobra ao meio na horizontal e depois na vertical, pelas linhas centrais, com o conteúdo para dentro. Baralha os cartões e abre o teu para ler o QR code.</p><p className={styles.origin}>Os QR codes apontam para <strong>{origin}</strong>. Confirma que este será o endereço definitivo antes de imprimir.</p>{cards.length > 0 ? <PrintButton /> : <p>Ainda não há perfis ativos. Acrescenta membros à família antes de imprimir.</p>}</div>
    {cardSheets(cards).map((sheet, index) => <section className={styles.sheet} key={index} aria-label={`Folha de cartões ${index + 1}`}><div className={styles.grid}>{sheet.map(({ member, qr }) => <article data-print-card data-member-id={member.id} className={styles.card} key={member.id}>
      <div className={styles.quarter}><div className={styles.avatar}><Avatar member={member} eager /></div></div>
      <div className={styles.quarter}><h2 className={member.name.length > 45 ? styles.longName : member.name.length > 24 ? styles.mediumName : undefined}>{member.name}</h2></div>
      <div className={`${styles.quarter} ${styles.qrQuarter}`}><Image src={qr} alt={`QR code para o perfil de ${member.name}`} width={240} height={240} unoptimized loading="eager" className={styles.qr} /></div>
    </article>)}</div></section>)}
  </main>;
}

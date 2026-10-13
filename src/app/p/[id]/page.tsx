import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { Icon } from "@/components/icon";
import { getStore } from "@/lib/db";
import styles from "./profile.module.css";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const member = getStore().getMember((await params).id);
  return { title: member ? `Os desejos de ${member.name}` : "Perfil não encontrado" };
}

export default async function ProfilePage({ params }: Props) {
  const member = getStore().getMember((await params).id);
  if (!member) notFound();
  const hasPreferences = member.likes.length > 0 || member.avoid.length > 0 || Boolean(member.sizes?.length);
  return (
    <main id="content" className={`container ${styles.profile}`}>
      <Link href="/#family" className={styles.back}><Icon name="back" size={18} />Voltar à família</Link>
      <section className={styles.intro} aria-labelledby="profile-title">
        <Avatar member={member} large />
        <div><p className="eyebrow">UM PRESENTE A PENSAR EM MIM</p><h1 id="profile-title">Olá, sou {member.name}<span aria-hidden="true">.</span></h1>{member.introduction && <p className={styles.introduction}>{member.introduction}</p>}<ul className={styles.interests} aria-label="Interesses">{member.interests.map(interest => <li key={interest}>{interest}</li>)}</ul></div>
        <span className={styles.introStar} aria-hidden="true">✳</span>
      </section>
      <div className={styles.content}>
        <section className={styles.wishes} aria-labelledby="wishes-title">
          <div className={styles.sectionHeading}><span className={styles.sectionIcon}><Icon name="gift" /></span><div><p className="eyebrow">UM POUCO DE INSPIRAÇÃO</p><h2 id="wishes-title">A minha lista de desejos</h2></div></div>
          <p className={styles.sectionDescription}>Algumas ideias que me fariam sorrir. A surpresa fica por tua conta.</p>
          {member.wishes.length ? <ul className={styles.wishList}>{member.wishes.map((wish, index) => <li key={wish.id}><span className={styles.wishNumber}>{String(index + 1).padStart(2, "0")}</span><div><h3>{wish.title}</h3>{wish.note && <p>{wish.note}</p>}{wish.url && <a href={wish.url} target="_blank" rel="noopener noreferrer" className={styles.shopLink}>Ver ideia na loja <Icon name="arrow" size={15} /><span className="sr-only"> (abre num novo separador)</span></a>}</div></li>)}</ul> : <div className={styles.empty}><Icon name="sparkles" size={29} /><h3>A lista ainda está a ganhar forma.</h3><p>{member.name} ainda não partilhou desejos. Volta mais tarde para descobrir novas ideias.</p></div>}
          {member.note && <aside className={styles.note}><Icon name="heart" size={21} /><div><h3>Uma nota minha</h3><p>{member.note}</p></div></aside>}
        </section>
        {hasPreferences && <aside className={styles.preferences} aria-label="Preferências pessoais">
          {member.likes.length > 0 && <section><h2><Icon name="heart" size={19} />Gosto de…</h2><ul>{member.likes.map(like => <li key={like}><Icon name="check" size={15} />{like}</li>)}</ul></section>}
          {member.avoid.length > 0 && <section><h2><Icon name="avoid" size={19} />Prefiro evitar</h2><ul>{member.avoid.map(item => <li key={item}>{item}</li>)}</ul></section>}
          {Boolean(member.sizes?.length) && <section><h2><Icon name="shirt" size={19} />Os meus tamanhos</h2><dl>{member.sizes?.map(size => <div key={size.label}><dt>{size.label}</dt><dd>{size.value}</dd></div>)}</dl></section>}
        </aside>}
      </div>
      <div className={styles.bottomLink}><Link href="/#family" className="button button-secondary"><Icon name="back" size={17} />Descobrir o resto da família</Link></div>
    </main>
  );
}

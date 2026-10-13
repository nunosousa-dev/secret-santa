"use client";

import { useState } from "react";
import Link from "next/link";
import type { Member } from "@/lib/types";
import { Avatar } from "./avatar";
import { Icon } from "./icon";
import styles from "./family-directory.module.css";

const normalise = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-PT");

export function FamilyDirectory({ members }: { members: Member[] }) {
  const [query, setQuery] = useState("");
  const visible = members.filter(member => normalise(`${member.name} ${member.interests.join(" ")}`).includes(normalise(query.trim())));
  return (
    <section id="family" aria-labelledby="family-title" className={styles.directory}>
      <div className={styles.heading}>
        <div><p className="eyebrow">À VOLTA DA NOSSA ÁRVORE</p><h2 id="family-title">A nossa família<span className={styles.count}>{members.length}</span></h2><p className={styles.description}>Conhece os desejos de cada um. A inspiração começa aqui.</p></div>
        <div className={styles.search}>
          <Icon name="search" size={19} />
          <label className="sr-only" htmlFor="member-search">Procurar por nome ou interesse</label>
          <input id="member-search" type="search" placeholder="Procurar na família…" value={query} onChange={event => setQuery(event.target.value)} autoComplete="off" />
          {query && <button type="button" aria-label="Limpar pesquisa" onClick={() => setQuery("")}><Icon name="close" size={17} /></button>}
        </div>
      </div>
      <p className="sr-only" role="status" aria-live="polite">{visible.length} {visible.length === 1 ? "perfil encontrado" : "perfis encontrados"}.</p>
      {visible.length > 0 ? <ul className={styles.grid}>{visible.map(member => (
        <li key={member.id}>
          <Link href={`/p/${member.id}`} className={styles.card} aria-label={`Ver perfil de ${member.name}`}>
            <div className={styles.portrait}><Avatar member={member} /><span className={styles.portraitStar} aria-hidden="true">✧</span></div>
            <h3>{member.name}</h3>
            <p className={styles.introduction}>{member.introduction}</p>
            <div className={styles.tags}>{member.interests.slice(0, 2).map(interest => <span key={interest}>{interest}</span>)}</div>
            <span className={styles.cardLink}>Ver desejos <Icon name="arrow" size={16} /></span>
          </Link>
        </li>
      ))}</ul> : members.length === 0 ? <div className={styles.empty}><Icon name="heart" size={26} /><h3>A família está a chegar.</h3><p>O organizador está a preparar os primeiros perfis. Volta em breve!</p></div> : <div className={styles.empty}><Icon name="search" size={26} /><h3>Não encontrámos ninguém.</h3><p>Experimenta outro nome ou interesse.</p><button className="button button-secondary" type="button" onClick={() => setQuery("")}>Ver toda a família</button></div>}
    </section>
  );
}

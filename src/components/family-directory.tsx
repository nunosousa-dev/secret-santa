"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Member } from "@/lib/types";
import { Avatar } from "./avatar";
import { Icon } from "./icon";
import styles from "./family-directory.module.css";

const normalise = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-PT");

export function FamilyDirectory({ members }: { members: Member[] }) {
  const [query, setQuery] = useState("");
  const revealedOnce = useRef(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const searchTerm = normalise(query.trim());
  const visible = members.filter(member => normalise(`${member.name} ${member.interests.join(" ")}`).includes(searchTerm));
  const searching = searchTerm.length > 0;
  // Reveal the results only when they are genuinely off-screen, and at most once per search session:
  // the paper world never scrolls itself twice.
  const handleQuery = (value: string) => {
    setQuery(value);
    if (!value.trim()) { revealedOnce.current = false; return; }
    if (revealedOnce.current) return;
    revealedOnce.current = true;
    const grid = resultsRef.current?.querySelector("ul");
    if (grid && grid.getBoundingClientRect().top >= window.innerHeight) requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: "auto", block: "start" }));
  };
  const clearQuery = () => {
    handleQuery("");
    searchRef.current?.focus({ preventScroll: true });
  };
  useEffect(() => {
    // Same-page hash changes through client links do not scroll; honour the return contract.
    if (window.location.hash === "#family") requestAnimationFrame(() => document.getElementById("family")?.scrollIntoView({ behavior: "auto", block: "start" }));
  }, []);
  return (
    <section id="family" aria-labelledby="family-title" className={styles.directory}>
      <div className={styles.heading}>
        <div><h2 id="family-title">A nossa família<span className={styles.count} aria-hidden="true">{members.length}</span><span className="sr-only">{members.length === 1 ? ": 1 pessoa" : `: ${members.length} pessoas`}</span></h2><p className={styles.description}>Conhece os desejos de cada um. A inspiração começa aqui.</p></div>
        <div className={styles.search}>
          <Icon name="search" size={19} />
          <label className="sr-only" htmlFor="member-search">Procurar por nome ou interesse</label>
          <input ref={searchRef} id="member-search" type="search" placeholder="Procurar na família…" value={query} onChange={event => handleQuery(event.target.value)} onKeyDown={event => { if (event.key === "Escape") clearQuery(); }} aria-controls="family-results" enterKeyHint="search" autoComplete="off" />
          {query && <button type="button" aria-label="Limpar pesquisa" onClick={clearQuery}><Icon name="close" size={17} /></button>}
        </div>
      </div>
      <div ref={resultsRef} id="family-results" className={styles.results}>
        <p className={searching && visible.length > 0 ? styles.resultCount : "sr-only"} role="status" aria-live="polite" aria-atomic="true">{searching && <>{visible.length} {visible.length === 1 ? "perfil encontrado" : "perfis encontrados"}</>}</p>
        {visible.length > 0 ? <ul className={styles.grid}>{visible.map(member => (
          <li key={member.id}>
            <Link href={`/p/${member.id}`} className={styles.card}>
              <div className={styles.portrait}><Avatar member={member} /><Icon name="star" size={22} className={styles.portraitStar} /></div>
              <h3>{member.name}</h3>
              <p className={styles.introduction}>{member.introduction}</p>
              <div className={styles.tags}>{member.interests.slice(0, 3).map(interest => <span key={interest}>{interest}</span>)}{member.interests.length > 3 && <span>+{member.interests.length - 3}</span>}</div>
              <span className={styles.cardLink}>Ver desejos <Icon name="arrow" size={16} /></span>
            </Link>
          </li>
        ))}</ul> : members.length === 0 ? <div className={styles.empty}><Icon name="heart" size={26} /><h3>A família está a chegar.</h3><p>O organizador está a preparar os primeiros perfis. Volta em breve!</p></div> : <div className={styles.empty}><Icon name="search" size={26} /><h3>Não encontrámos ninguém.</h3><p>Experimenta outro nome ou interesse.</p><button className="button button-secondary" type="button" onClick={clearQuery}>Ver toda a família</button></div>}
      </div>
      {searching && <button type="button" className={styles.backToTop} onClick={() => window.scrollTo({ top: 0, behavior: "auto" })}><Icon name="arrow" size={14} style={{ transform: "rotate(-90deg)" }} /> Voltar ao topo</button>}
    </section>
  );
}

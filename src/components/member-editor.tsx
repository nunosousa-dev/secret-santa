"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import type { SavedMember } from "@/lib/db/store";
import { ApiError, apiRequest } from "@/lib/client-api";
import { LogoutButton } from "./access-forms";
import styles from "./forms.module.css";

const lines = (value: FormDataEntryValue | null) => String(value ?? "").split("\n").map(line => line.trim()).filter(Boolean);
function fieldLabel(path: string) {
  const [section, index, field] = path.split(".");
  const labels: Record<string, string> = { introduction: "Apresentação", interests: "Interesses", likes: "Gosto de", avoid: "Prefiro evitar", note: "Nota", wishes: "Desejos", sizes: "Tamanhos", title: "Título", url: "Ligação para a loja", label: "Tipo", value: "Tamanho", version: "Perfil" };
  if (["wishes", "sizes"].includes(section) && index !== undefined) return `${section === "wishes" ? "Desejo" : "Tamanho"} ${Number(index) + 1}${field ? ` · ${labels[field] ?? "Campo"}` : ""}`;
  return labels[section] ?? "Campo";
}

export function MemberEditor({ member, isAdmin }: { member: SavedMember; isAdmin: boolean }) {
  // UI-only keys also work on phones previewing over plain HTTP on the LAN.
  const nextKey = useRef(0);
  const [wishes, setWishes] = useState(member.wishes.map(wish => ({ ...wish, note: wish.note ?? "", url: wish.url ?? "" })));
  const [sizes, setSizes] = useState((member.sizes ?? []).map((size, index) => ({ ...size, key: `size-${index}` })));
  const [version, setVersion] = useState(member.version);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<ApiError | Error | null>(null);
  useEffect(() => { window.history.replaceState(null, "", window.location.pathname); }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const data = {
      version, introduction: String(form.get("introduction") ?? ""), interests: lines(form.get("interests")),
      likes: lines(form.get("likes")), avoid: lines(form.get("avoid")), note: String(form.get("note") ?? ""),
      wishes: wishes.map(({ title, note, url }) => ({ title, note, url })),
      sizes: sizes.filter(size => size.label.trim() || size.value.trim()).map(({ label, value }) => ({ label, value })),
    };
    setPending(true); setMessage(""); setError(null);
    try {
      const result = await apiRequest<{ version: number }>(`/api/members/${member.id}`, data, "PATCH");
      setVersion(result.version); setMessage("Preferências guardadas. A família já pode ver as novidades!");
    } catch (error) { setError(error instanceof Error ? error : new Error("Não foi possível guardar.")); }
    finally { setPending(false); }
  }

  return <>
    <form onSubmit={submit} className={styles.form}>
      <fieldset disabled={pending}>
        <section className={styles.card}>
          <h2>Um pouco sobre mim</h2>
          <div className={styles.form}>
            <div className={styles.field}><label htmlFor="introduction">A minha apresentação</label><textarea id="introduction" name="introduction" rows={2} maxLength={200} defaultValue={member.introduction} /></div>
            <div className={styles.field}><label htmlFor="interests">Os meus interesses</label><textarea id="interests" name="interests" rows={3} defaultValue={member.interests.join("\n")} aria-describedby="interests-help" /><p id="interests-help" className={styles.help}>Um interesse por linha, por exemplo: livros, cozinha ou caminhadas.</p></div>
          </div>
        </section>
        <section className={styles.section} aria-labelledby="edit-wishes-title">
          <h3 id="edit-wishes-title">A minha lista de desejos</h3><p className={styles.help}>Podes deixar a lista vazia ou acrescentar até 30 ideias.</p>
          {wishes.map((wish, index) => <div key={wish.id} className={styles.item}>
            <div className={styles.smallHeading}><h4>Desejo {index + 1}</h4><button type="button" className={styles.textButton} aria-label={`Remover desejo ${index + 1}`} onClick={() => setWishes(wishes.filter(item => item.id !== wish.id))}>Remover</button></div>
            <div className={styles.field}><label htmlFor={`title-${wish.id}`}>O que gostava de receber</label><input id={`title-${wish.id}`} required maxLength={120} value={wish.title} onChange={event => setWishes(wishes.map(item => item.id === wish.id ? { ...item, title: event.target.value } : item))} /></div>
            <div className={styles.field}><label htmlFor={`note-${wish.id}`}>Mais detalhes (opcional)</label><textarea id={`note-${wish.id}`} rows={2} maxLength={1500} value={wish.note} onChange={event => setWishes(wishes.map(item => item.id === wish.id ? { ...item, note: event.target.value } : item))} /></div>
            <div className={styles.field}><label htmlFor={`url-${wish.id}`}>Ligação para a loja (opcional)</label><input id={`url-${wish.id}`} type="url" inputMode="url" autoCapitalize="none" autoComplete="off" maxLength={2048} placeholder="https://…" value={wish.url} onChange={event => setWishes(wishes.map(item => item.id === wish.id ? { ...item, url: event.target.value } : item))} /></div>
          </div>)}
          <button type="button" className="button button-secondary" disabled={wishes.length >= 30} onClick={() => setWishes([...wishes, { id: `new-${nextKey.current++}`, title: "", note: "", url: "" }])}>Acrescentar um desejo</button>
        </section>
        <section className={styles.card}><h2>As minhas preferências</h2><div className={styles.form}>
          <div className={styles.field}><label htmlFor="likes">Gosto de…</label><textarea id="likes" name="likes" rows={3} defaultValue={member.likes.join("\n")} aria-describedby="preferences-help" /></div>
          <div className={styles.field}><label htmlFor="avoid">Prefiro evitar</label><textarea id="avoid" name="avoid" rows={3} defaultValue={member.avoid.join("\n")} aria-describedby="preferences-help" /></div>
          <p id="preferences-help" className={styles.help}>Um item por linha. Estes campos são opcionais.</p>
        </div></section>
        <section className={styles.section} aria-labelledby="sizes-title"><h3 id="sizes-title">Os meus tamanhos</h3>
          {sizes.map((size, index) => <div className={styles.item} key={size.key}><div className={styles.smallHeading}><h4>Tamanho {index + 1}</h4><button type="button" className={styles.textButton} aria-label={`Remover tamanho ${index + 1}`} onClick={() => setSizes(sizes.filter(item => item.key !== size.key))}>Remover</button></div><div className={styles.field}><label htmlFor={`label-${size.key}`}>Tipo de roupa ou acessório</label><input id={`label-${size.key}`} required maxLength={120} placeholder="Ex.: calçado" value={size.label} onChange={event => setSizes(sizes.map(item => item.key === size.key ? { ...item, label: event.target.value } : item))} /></div><div className={styles.field}><label htmlFor={`value-${size.key}`}>Tamanho e notas</label><input id={`value-${size.key}`} required maxLength={120} placeholder="Ex.: 38 ou M, corte largo" value={size.value} onChange={event => setSizes(sizes.map(item => item.key === size.key ? { ...item, value: event.target.value } : item))} /></div></div>)}
          <button type="button" className="button button-secondary" disabled={sizes.length >= 15} onClick={() => setSizes([...sizes, { key: `new-${nextKey.current++}`, label: "", value: "" }])}>Acrescentar um tamanho</button>
        </section>
        <div className={styles.field}><label htmlFor="personal-note">Uma nota minha (opcional)</label><textarea id="personal-note" name="note" rows={4} maxLength={1500} defaultValue={member.note} /></div>
        <p className={styles.help}>As preferências guardadas ficam visíveis na tua página pública. Partilha apenas o que te sentes confortável em mostrar.</p>
        {error && <div role="alert" className={`${styles.status} ${styles.error}`}><p>{error.message}</p>{error instanceof ApiError && error.fields.length > 0 && <ul>{error.fields.map(field => <li key={field.path}>{fieldLabel(field.path)}: {field.message}</li>)}</ul>}{error instanceof ApiError && error.status === 409 && <button type="button" className={styles.textButton} onClick={() => window.location.reload()}>Recarregar o perfil</button>}</div>}
        {message && <p role="status" className={styles.status}>{message}</p>}
        <div className={styles.actions}><button type="submit" className="button" disabled={pending}>{pending ? "A guardar…" : "Guardar preferências"}</button><Link className="button button-secondary" href={`/p/${member.id}`}>Ver o meu perfil</Link></div>
      </fieldset>
    </form>
    {!isAdmin && <LogoutButton role="member" />}
  </>;
}

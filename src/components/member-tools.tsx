"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Member } from "@/lib/types";
import { apiRequest } from "@/lib/client-api";
import { Avatar } from "./avatar";
import styles from "./forms.module.css";

export type AdminMember = Pick<Member, "id" | "name" | "avatar" | "avatarId" | "colour"> & { version: number; hasLink: boolean };

export function MemberTools({ member }: { member: AdminMember }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState("");
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  async function rename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = new FormData(event.currentTarget).get("name");
    setPending(true); setError(""); setMessage("");
    try { await apiRequest(`/api/admin/members/${member.id}`, { name, version: member.version }, "PATCH"); setMessage("Nome guardado. O endereço do perfil continua igual."); router.refresh(); }
    catch (error) { setError(error instanceof Error ? error.message : "Não foi possível guardar o nome."); }
    finally { setPending(false); }
  }

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const file = new FormData(form).get("avatar");
    if (!(file instanceof File) || !file.size) { setError("Escolhe um avatar primeiro."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Escolhe uma imagem até 5 MB."); return; }
    setPending(true); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/admin/members/${member.id}/avatar`, { method: "POST", headers: { "Content-Type": file.type || "application/octet-stream" }, body: file });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível guardar o avatar.");
      form.reset(); setPreview(""); setMessage("Avatar guardado."); router.refresh();
    } catch (error) { setError(error instanceof Error ? error.message : "Não foi possível guardar o avatar."); }
    finally { setPending(false); }
  }

  async function removeAvatar() {
    if (!window.confirm(`Remover o avatar de ${member.name} e voltar ao avatar de substituição?`)) return;
    setPending(true); setError(""); setMessage("");
    try { await apiRequest(`/api/admin/members/${member.id}/avatar`, {}, "DELETE"); setMessage("Avatar removido."); router.refresh(); }
    catch (error) { setError(error instanceof Error ? error.message : "Não foi possível remover o avatar."); }
    finally { setPending(false); }
  }

  return <details className={styles.details}><summary>Nome e avatar</summary><div className={styles.form}>
    <Avatar member={member} />
    <form className={styles.form} onSubmit={rename}><div className={styles.field}><label htmlFor={`name-${member.id}`}>Nome no perfil e no cartão</label><input id={`name-${member.id}`} name="name" required maxLength={80} defaultValue={member.name} disabled={pending} /></div><button type="submit" className="button button-secondary" disabled={pending}>Guardar nome</button></form>
    <form className={styles.form} onSubmit={upload}><div className={styles.field}><label htmlFor={`avatar-${member.id}`}>Avatar</label><input id={`avatar-${member.id}`} name="avatar" type="file" accept="image/png,image/jpeg,image/webp" required disabled={pending} aria-describedby={`avatar-help-${member.id}`} onChange={event => { const file = event.target.files?.[0]; setPreview(file && file.size <= 5 * 1024 * 1024 && ["image/png", "image/jpeg", "image/webp"].includes(file.type) ? URL.createObjectURL(file) : ""); }} /><p id={`avatar-help-${member.id}`} className={styles.help}>PNG, JPEG ou WebP até 5 MB. A imagem será recortada ao centro num quadrado.</p></div>{preview && <Image className={styles.avatarPreview} src={preview} alt={`Pré-visualização do avatar de ${member.name}`} width={160} height={160} unoptimized />}<div className={styles.actions}><button type="submit" className="button button-secondary" disabled={pending}>{pending ? "A guardar…" : "Guardar avatar"}</button>{member.avatarId && <button type="button" className={styles.textButton} disabled={pending} onClick={removeAvatar}>Remover avatar</button>}</div></form>
    {message && <p className={styles.status} role="status">{message}</p>}{error && <p className={`${styles.status} ${styles.error}`} role="alert">{error}</p>}
  </div></details>;
}

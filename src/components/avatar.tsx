import type { Member } from "@/lib/types";
import Image from "next/image";
import styles from "./avatar.module.css";

const portraits = {
  sofia: { skin: "#e8ae88", hair: "#674339", top: "#b8694f", long: true, fringe: false, glasses: false },
  miguel: { skin: "#d89b72", hair: "#42382d", top: "#677b65", long: false, fringe: false, glasses: true },
  ines: { skin: "#efc3a3", hair: "#543f3a", top: "#9b83a8", long: true, fringe: true, glasses: false },
  joao: { skin: "#c99069", hair: "#44362f", top: "#be8b4f", long: false, fringe: true, glasses: false },
  ana: { skin: "#e7b18e", hair: "#ab7552", top: "#a3666d", long: true, fringe: false, glasses: true },
  tomas: { skin: "#e5b18b", hair: "#775238", top: "#678399", long: false, fringe: false, glasses: false },
};

/** Uploaded avatars are already resized; vector/initial placeholders remain available. */
export function Avatar({ member, large = false, eager = false }: { member: Pick<Member, "name" | "avatar" | "avatarId" | "colour">; large?: boolean; eager?: boolean }) {
  if (member.avatarId) return <span className={`${styles.avatar} ${styles[member.colour]} ${large ? styles.large : ""}`}><Image src={`/avatars/${member.avatarId}`} alt="" width={512} height={512} unoptimized loading={eager ? "eager" : "lazy"} /></span>;
  if (member.avatar === "placeholder") {
    const initials = member.name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("");
    return <span className={`${styles.avatar} ${styles[member.colour]} ${large ? styles.large : ""}`}><svg viewBox="0 0 120 120" aria-hidden="true"><text x="60" y="64" dominantBaseline="middle" textAnchor="middle" fontFamily="Georgia, serif" fontSize="38" fill="#294b3c">{initials}</text></svg></span>;
  }
  const p = portraits[member.avatar];
  return (
    <span className={`${styles.avatar} ${styles[member.colour]} ${large ? styles.large : ""}`}>
      <svg viewBox="0 0 120 120" fill="none" aria-hidden="true">
        {p.long && <path d="M29 65V47c0-36 62-37 62 0v41H29Z" fill={p.hair} />}
        <path d="M17 120v-14c0-30 86-30 86 0v14" fill={p.top} />
        <path d="M49 77v15c0 14 22 14 22 0V77" fill={p.skin} />
        <path d="m49 90 11 13 11-13" stroke="#fff" strokeOpacity=".45" strokeWidth="2" />
        <ellipse cx="60" cy="54" rx="26" ry="32" fill={p.skin} />
        <path d={p.fringe ? "M33 51c-9-30 15-38 30-35 24 1 28 18 24 36l-9-20-7 12-12-15-24 24Z" : "M33 52c-12-34 19-43 35-35 21 1 24 22 18 36l-8-25c-8 12-23 17-43 14Z"} fill={p.hair} />
        <circle cx="48" cy="56" r="2" fill="#45372e" /><circle cx="72" cy="56" r="2" fill="#45372e" />
        <path d="m60 58-2 8h4M52 74c5 4 11 4 16-1" stroke="#925e48" strokeWidth="2" strokeLinecap="round" />
        <ellipse cx="42" cy="67" rx="5" ry="3" fill="#ce816c" opacity=".4" /><ellipse cx="78" cy="67" rx="5" ry="3" fill="#ce816c" opacity=".4" />
        {p.glasses && <g stroke="#493e36" strokeWidth="2"><rect x="37" y="49" width="20" height="15" rx="6" /><rect x="63" y="49" width="20" height="15" rx="6" /><path d="M57 54h6" /></g>}
      </svg>
    </span>
  );
}

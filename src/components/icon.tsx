import type { CSSProperties } from "react";

type IconName = "gift" | "arrow" | "back" | "search" | "star" | "heart" | "calendar" | "coin" | "sparkles" | "close" | "check" | "avoid" | "shirt";
const paths: Record<IconName, React.ReactNode> = {
  gift: <><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M5 12v8h14v-8M12 8v12M12 8H8.5a2.5 2.5 0 1 1 2.45-3c.3.8 1.05 3 1.05 3Zm0 0h3.5a2.5 2.5 0 1 0-2.45-3C12.75 5.8 12 8 12 8Z" /></>,
  arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  back: <path d="M19 12H5m6-6-6 6 6 6" />,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></>,
  star: <path d="m12 3 2.6 5.7 6.2.7-4.6 4.2 1.3 6.1-5.5-3.1-5.5 3.1 1.3-6.1-4.6-4.2 6.2-.7L12 3Z" />,
  heart: <path d="M20.5 4.7a5.5 5.5 0 0 0-7.8 0L12 5.4l-.7-.7a5.5 5.5 0 0 0-7.8 7.8L12 21l8.5-8.5a5.5 5.5 0 0 0 0-7.8Z" />,
  calendar: <><rect x="4" y="5" width="16" height="16" rx="2" /><path d="M8 3v4m8-4v4M4 11h16m-11 4h2" /></>,
  coin: <><circle cx="12" cy="12" r="9" /><path d="M15 7.5a5 5 0 1 0 0 9M7 10h7m-7 4h7" /></>,
  sparkles: <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z" /><path d="m20 2 .5 1.5L22 4l-1.5.5L20 6l-.5-1.5L18 4l1.5-.5L20 2Z" /></>,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  check: <path d="m5 12 4 4L19 6" />,
  avoid: <><circle cx="12" cy="12" r="9" /><path d="m6 6 12 12" /></>,
  shirt: <path d="m8 3-5 3 3 5 2-1v11h8V10l2 1 3-5-5-3a4 4 0 0 1-8 0Z" />,
};

export function Icon({ name, size = 20, className, style }: { name: IconName; size?: number; className?: string; style?: CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className} style={style}>{paths[name]}</svg>;
}

import QRCode from "qrcode";

export function profileUrl(origin: string, memberId: string): string {
  return new URL(`/p/${encodeURIComponent(memberId)}`, origin).href;
}
export async function profileQr(origin: string, memberId: string): Promise<string> {
  const svg = await QRCode.toString(profileUrl(origin, memberId), { type: "svg", errorCorrectionLevel: "M", margin: 4, color: { dark: "#000000", light: "#ffffff" } });
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
export function cardSheets<T>(members: T[]): T[][] {
  const pages: T[][] = [];
  for (let i = 0; i < members.length; i += 6) pages.push(members.slice(i, i + 6));
  return pages;
}

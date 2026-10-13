import sharp from "sharp";

export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
export async function normaliseAvatar(input: Buffer): Promise<Buffer> {
  if (input.length === 0 || input.length > MAX_AVATAR_BYTES) throw new Error("Escolhe uma imagem até 5 MB.");
  try {
    const image = sharp(input, { limitInputPixels: 25_000_000, failOn: "warning" });
    const metadata = await image.metadata();
    if (!["jpeg", "png", "webp"].includes(metadata.format ?? "") || (metadata.pages ?? 1) !== 1) throw new Error("Unsupported image");
    return await image.rotate().resize(512, 512, { fit: "cover" }).webp({ quality: 85 }).toBuffer();
  } catch { throw new Error("Escolhe uma imagem PNG, JPEG ou WebP válida, sem animação e até 25 megapíxeis."); }
}

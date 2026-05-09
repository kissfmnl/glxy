import { readWebsiteFile } from "@/lib/websiteDisk";

/** Max. grootte voor data-URI in DB (~900KB ruwe base64). */
export const MAX_IMAGE_DATA_URI_CHARS = 1_200_000;

export function guessImageMimeFromFilename(name: string): string {
  const l = name.toLowerCase();
  if (l.endsWith(".png")) return "image/png";
  if (l.endsWith(".jpg") || l.endsWith(".jpeg")) return "image/jpeg";
  if (l.endsWith(".gif")) return "image/gif";
  if (l.endsWith(".webp")) return "image/webp";
  if (l.endsWith(".svg")) return "image/svg+xml";
  return "application/octet-stream";
}

/**
 * Leest een lokaal `/api/media/…`-bestand en zet het om naar een data-URI zodat het
 * in de database overleeft (ephemeral schijf na deploy).
 */
export async function inlineApiMediaUrlIfLocal(url: string | null | undefined): Promise<string | null> {
  if (!url?.trim()) return null;
  const s = url.trim();
  if (s.startsWith("data:image/")) return s.length <= MAX_IMAGE_DATA_URI_CHARS ? s : null;
  if (!s.startsWith("/api/media/")) return s;
  const m = /^\/api\/media\/(.+)$/.exec(s);
  if (!m?.[1]) return s;
  const decoded = decodeURIComponent(m[1].replace(/\+/g, " "));
  if (decoded.includes("..")) return s;
  const rel = `Website/media/${decoded}`;
  const file = await readWebsiteFile(rel);
  if (!file) return s;
  const mime = guessImageMimeFromFilename(decoded);
  if (!mime.startsWith("image/")) return s;
  const b64 = file.data.toString("base64");
  const dataUri = `data:${mime};base64,${b64}`;
  if (dataUri.length > MAX_IMAGE_DATA_URI_CHARS) return s;
  return dataUri;
}

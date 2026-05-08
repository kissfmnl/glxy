/** Maakt een publieke URL voor een bestand opgeslagen als `Website/media/...`. */
export function publicMediaUrlFromStoragePath(storagePath: string): string {
  const norm = storagePath.replace(/\\/g, "/");
  const m = /^Website\/media\/(.+)$/i.exec(norm);
  if (!m?.[1]) return "";
  return `/api/media/${m[1].split("/").map((seg) => encodeURIComponent(seg)).join("/")}`;
}

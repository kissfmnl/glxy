import path from "path";
import { getWebsiteWriteRoot } from "@/lib/websiteDisk";

/** Absoluut pad voor `Website/...` relatief aan schrijf-root (alleen voor media onder Website/). */
export function absoluteWebsitePath(relUnderWebsite: string): string {
  const segments = relUnderWebsite
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .split("/")
    .filter(Boolean);
  if (segments[0] !== "Website") {
    throw new Error("Pad moet onder Website/ beginnen");
  }
  const abs = path.normalize(path.join(getWebsiteWriteRoot(), ...segments));
  const base = path.join(getWebsiteWriteRoot(), "Website");
  if (abs !== base && !abs.startsWith(base + path.sep)) {
    throw new Error("Ongeldig pad");
  }
  return abs;
}

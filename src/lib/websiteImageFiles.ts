import { readdir } from "fs/promises";
import path from "path";
import { getWebsiteDiskRoots } from "@/lib/websiteDisk";

const IMAGE_RE = /\.(png|jpe?g|webp|avif|svg|ico)$/i;

export async function listWebsiteImageFiles(): Promise<string[]> {
  const seen = new Set<string>();

  async function walk(websiteRoot: string, dir: string) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(websiteRoot, full);
      else {
        const rel = path.relative(websiteRoot, full).replace(/\\/g, "/");
        if (IMAGE_RE.test(rel)) seen.add(`Website/${rel}`);
      }
    }
  }

  for (const root of getWebsiteDiskRoots()) {
    const websiteRoot = path.join(root, "Website");
    try {
      await walk(websiteRoot, websiteRoot);
    } catch {
      /* map ontbreekt op deze root */
    }
  }

  return Array.from(seen).sort((a, b) => a.localeCompare(b));
}

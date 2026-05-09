import path from "path";
import { promises as fs } from "fs";

/**
 * Optioneel persistent volume voor `Website/` (uploads, favicon, enz.).
 * Zet op de host-pad waar je volume gemount is; nieuwe uploads gaan hierheen.
 * Lezen: eerst dit pad, daarna `process.cwd()` (gebundelde Logo’s uit de repo).
 */
export function getWebsiteDiskRoots(): string[] {
  const extra = process.env.WEBSITE_FILES_ROOT?.trim();
  const ordered = extra ? [path.resolve(extra), process.cwd()] : [process.cwd()];
  return Array.from(new Set(ordered));
}

function ensureWritableWebsiteRootConfigured() {
  const configured = process.env.WEBSITE_FILES_ROOT?.trim();
  const allowEphemeral = process.env.ALLOW_EPHEMERAL_WEBSITE_FILES === "1";
  if (!configured && process.env.NODE_ENV === "production" && !allowEphemeral) {
    // In productie willen we liever een volume, maar blokkeren is te frustrerend tijdens setup.
    // Railway/Nixpacks heeft wel een schrijfbare ephemeral disk; die kan bij deploy/restart leeg raken.
    // eslint-disable-next-line no-console
    console.warn(
      "[websiteDisk] WEBSITE_FILES_ROOT ontbreekt in productie; uploads gaan naar ephemeral disk. Zet WEBSITE_FILES_ROOT of ALLOW_EPHEMERAL_WEBSITE_FILES=1."
    );
  }
}

export function getWebsiteWriteRoot(): string {
  return getWebsiteDiskRoots()[0];
}

function toWebsiteRel(rel: string): string {
  const n = rel.replace(/\\/g, "/").replace(/^\/+/, "");
  return n.startsWith("Website/") ? n : `Website/${n}`;
}

/** Absoluut pad per schijf-root; alleen paden onder `{root}/Website`. */
export function websiteFileReadCandidates(rel: string): string[] {
  const relW = toWebsiteRel(rel);
  const segments = relW.split("/").filter(Boolean);
  if (segments[0] !== "Website") return [];
  const out: string[] = [];
  for (const root of getWebsiteDiskRoots()) {
    const abs = path.normalize(path.join(root, ...segments));
    const base = path.join(root, "Website");
    if (abs === base || abs.startsWith(base + path.sep)) out.push(abs);
  }
  return out;
}

export async function readWebsiteFile(rel: string): Promise<{ abs: string; data: Buffer } | null> {
  for (const abs of websiteFileReadCandidates(rel)) {
    try {
      const data = await fs.readFile(abs);
      return { abs, data };
    } catch {
      /* volgende root */
    }
  }
  return null;
}

/** Schrijf onder Website/; retourneert `Website/...` voor in de database. */
export async function writeUnderWebsite(segmentsUnderWebsite: string[], data: Buffer): Promise<string> {
  ensureWritableWebsiteRootConfigured();
  const root = getWebsiteWriteRoot();
  const base = path.join(root, "Website");
  const abs = path.normalize(path.join(base, ...segmentsUnderWebsite));
  if (!abs.startsWith(base + path.sep)) {
    throw new Error("Invalid website path");
  }
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, data);
  const rel = path.relative(base, abs).replace(/\\/g, "/");
  return `Website/${rel}`;
}

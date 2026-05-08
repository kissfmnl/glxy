export type ProgramPreset = {
  id: string;
  name: string;
  label: string | null;
  notes: string | null;
  coHostName: string | null;
  programImagePath: string | null;
  programColor: string | null;
  updatedAt: string;
};

function norm(value: unknown): string | null {
  const text = String(value ?? "").trim();
  return text.length ? text : null;
}

function normColor(value: unknown): string | null {
  const text = String(value ?? "").trim().toLowerCase();
  if (!/^#[0-9a-f]{6}$/.test(text)) return null;
  return text;
}

export function parseProgramPresetsJson(raw: string | null | undefined): ProgramPreset[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const out: ProgramPreset[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const id = String((item as any).id ?? "").trim();
      const name = String((item as any).name ?? "").trim();
      if (!id || !name) continue;
      out.push({
        id,
        name,
        label: norm((item as any).label),
        notes: norm((item as any).notes),
        coHostName: norm((item as any).coHostName),
        programImagePath: norm((item as any).programImagePath),
        programColor: normColor((item as any).programColor),
        updatedAt: String((item as any).updatedAt ?? new Date().toISOString()),
      });
    }
    return out.sort((a, b) => a.name.localeCompare(b.name, "nl"));
  } catch {
    return [];
  }
}

export function serializeProgramPresetsJson(presets: ProgramPreset[]): string {
  const cleaned = presets
    .filter((p) => p.id.trim() && p.name.trim())
    .map((p) => ({
      id: p.id.trim(),
      name: p.name.trim(),
      label: norm(p.label),
      notes: norm(p.notes),
      coHostName: norm(p.coHostName),
      programImagePath: norm(p.programImagePath),
      programColor: normColor(p.programColor),
      updatedAt: p.updatedAt || new Date().toISOString(),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "nl"));
  return JSON.stringify(cleaned);
}

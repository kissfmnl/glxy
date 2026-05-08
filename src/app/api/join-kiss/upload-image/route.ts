import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import path from "path";
import { writeUnderWebsite } from "@/lib/websiteDisk";

function normalizeSlot(input: string) {
  const v = input.trim().toUpperCase();
  return v === "DJ" || v === "PRODUCER" || v === "OTHER" ? v : null;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Niet geautoriseerd." }, { status: 401 });
  }

  const fd = await req.formData();
  const slotRaw = String(fd.get("slot") || "");
  const slot = normalizeSlot(slotRaw);
  if (!slot) return NextResponse.json({ error: "Ongeldige vacature-slot." }, { status: 400 });

  const file = (fd.get("file") as File | null) || null;
  if (!file || file.size === 0) return NextResponse.json({ error: "Geen bestand ontvangen." }, { status: 400 });

  const mime = String(file.type || "").toLowerCase();
  const allowedMime = new Set(["image/png", "image/jpeg"]);
  if (!allowedMime.has(mime)) {
    return NextResponse.json(
      { error: "Alleen JPG/JPEG of PNG is toegestaan voor maximale apparaat-compatibiliteit." },
      { status: 400 }
    );
  }
  const ext = path.extname(file.name || "").toLowerCase() || ".jpg";
  const safeExt = ext === ".png" ? ".png" : ".jpg";
  const fileName = `vacature-${slot.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${safeExt}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const imagePath = await writeUnderWebsite(["uploads", fileName], bytes);

  return NextResponse.json({ imagePath });
}

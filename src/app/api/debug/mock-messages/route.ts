import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Debug endpoint mag nooit tijdens `next build` worden geëvalueerd.
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const mockMessages = [
      {
        senderPhone: "+31612345678",
        senderName: "Mark Mossing",
        content: "Hoi Kiss FM! Kunnen jullie Rivers draaien van Afrojack? 😍",
        type: "TEXT",
        messageId: "mock_" + Date.now() + "_1",
      },
      {
        senderPhone: "+31687654321",
        senderName: "Linda",
        content: "Goeiemorgen guys! Super lekkere muziek weer vandaag. 🔥",
        type: "TEXT",
        messageId: "mock_" + Date.now() + "_2",
      },
      {
        senderPhone: "+31655667788",
        senderName: "Daan",
        content: "",
        type: "AUDIO",
        mediaId: "mock_audio_1",
        messageId: "mock_" + Date.now() + "_3",
      },
      {
        senderPhone: "+31699001122",
        senderName: "Sanne",
        content: "File op de A4 bij Schiphol, sta al 20 minuten stil! 🚗💨",
        type: "TEXT",
        messageId: "mock_" + Date.now() + "_4",
      },
      {
        senderPhone: "+31611223344",
        senderName: "Jasper",
        content: "Kan ik nog meedoen met de winactie? #KISSFM",
        type: "TEXT",
        messageId: "mock_" + Date.now() + "_5",
      }
    ];

    for (const msg of mockMessages) {
      await prisma.message.create({
        data: {
          ...msg,
          receivedAt: new Date(Date.now() - Math.random() * 1000000),
          isRead: false,
          isPinned: false,
        }
      });
    }

    return NextResponse.redirect(new URL("/admin", process.env.NEXTAUTH_URL || "http://localhost:3000"), { status: 303 });
  } catch (error) {
    console.error("Mock messages seed error:", error);
    return NextResponse.json({ error: "Failed to seed mock messages" }, { status: 500 });
  }
}

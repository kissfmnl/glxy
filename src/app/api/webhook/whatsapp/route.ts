import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ============================================================
// GET — Webhook Verificatie door Meta
// ============================================================
// Meta stuurt een GET-request naar dit endpoint zodra je de webhook-URL
// voor het eerst instelt in het Meta Developer Dashboard.
// Wij controleren het token en sturen de `hub.challenge` terug.
// Daarna is de webhook actief en begint Meta POST-requests te sturen.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  // Controleer of mode en token correct zijn
  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log("[WhatsApp Webhook] ✅ Verificatie geslaagd.");
    // Stuur de challenge terug als plain text — Meta vereist dit
    return new NextResponse(challenge, { status: 200 });
  }

  console.error("[WhatsApp Webhook] ❌ Verificatie mislukt. Controleer WHATSAPP_VERIFY_TOKEN.");
  return new NextResponse("Forbidden", { status: 403 });
}

// ============================================================
// POST — Inkomende berichten verwerken
// ============================================================
// Meta pusht elk binnenkomend WhatsApp-bericht naar dit endpoint.
// We parsen de payload, extraheren het bericht en slaan het op in de database.
export async function POST(request: NextRequest) {
  let body: WhatsAppWebhookPayload;

  try {
    body = await request.json();
  } catch {
    return new NextResponse("Bad Request: Invalid JSON", { status: 400 });
  }

  // Meta stuurt altijd een 200 status snel terug verwachten (anders retries)
  // We verwerken asynchroon na het sturen van de 200.
  try {
    const entry = body?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    // Alleen doorgaan als er berichten in de payload zitten
    if (value?.messages && value.messages.length > 0) {
      for (const message of value.messages) {
        const senderPhone = message.from;
        const messageId = message.id;
        let content = "";
        let type = "TEXT";
        let mediaId: string | undefined;

        if (message.type === "text") {
          content = message.text?.body ?? "";
          type = "TEXT";
        } else if (message.type === "audio") {
          content = "Audiobericht"; // Placeholder tekst
          type = "AUDIO";
          mediaId = message.audio?.id;
        } else {
          console.log(`[WhatsApp Webhook] Bericht type '${message.type}' overgeslagen.`);
          continue;
        }

        // Haal de profielnaam op uit het contacts object
        const senderName = value.contacts?.find(
          (c: any) => c.wa_id === senderPhone
        )?.profile?.name ?? null;

        await prisma.message.upsert({
          where: { messageId },
          update: {},
          create: {
            messageId,
            senderPhone,
            senderName,
            content,
            type: type as any,
            mediaId: mediaId ?? null,
          },
        });

        console.log(`[WhatsApp Webhook] ✅ ${type} bericht opgeslagen van ${senderPhone}`);
      }
    }
  } catch (error) {
    // Log de fout maar stuur altijd 200 terug naar Meta!
    // Als we 500 terugsturen, blijft Meta het bericht eindeloos opnieuw proberen.
    console.error("[WhatsApp Webhook] ❌ Fout bij verwerken:", error);
  }

  return new NextResponse("OK", { status: 200 });
}

// ============================================================
// TypeScript types voor de Meta Webhook Payload
// ============================================================
interface WhatsAppContact {
  wa_id: string;
  profile: { name: string };
}

interface WhatsAppMessage {
  from: string;
  id: string;
  type: string;
  text?: { body: string };
  audio?: { id: string; mime_type: string }; // Toegevoegd voor audio support
  timestamp: string;
}

interface WhatsAppWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messages?: WhatsAppMessage[];
        contacts?: WhatsAppContact[];
      };
      field: string;
    }>;
  }>;
}

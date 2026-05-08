import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/media/[id]
 * Proxy route om audioberichten van Meta te streamen/downloaden.
 * Meta Media API vereist een Bearer token en geeft een tijdelijke URL terug.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const mediaId = params.id;
  const token = process.env.WHATSAPP_API_TOKEN;

  if (!token) {
    return new NextResponse("API Token missing", { status: 500 });
  }

  try {
    // Stap 1: Haal de media metadata op (inclusief de download URL)
    const metadataResponse = await fetch(
      `https://graph.facebook.com/v19.0/${mediaId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!metadataResponse.ok) {
      return new NextResponse("Failed to fetch media metadata", { status: 404 });
    }

    const metadata = await metadataResponse.json();
    const downloadUrl = metadata.url;

    // Stap 2: Download de daadwerkelijke media data
    const mediaResponse = await fetch(downloadUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!mediaResponse.ok) {
      return new NextResponse("Failed to download media", { status: 500 });
    }

    // Stap 3: Stream de data terug naar de client met de juiste headers
    const contentType = mediaResponse.headers.get("Content-Type") || "audio/ogg";
    
    return new NextResponse(mediaResponse.body, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="whatsapp-audio-${mediaId}.mp3"`, // We forceren MP3-achtige header voor browsers
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("[Media API] Fout:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

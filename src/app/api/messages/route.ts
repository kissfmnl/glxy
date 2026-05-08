import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const MOCK_MESSAGES: any[] = [
  {
    id: "mock1",
    type: "TEXT",
    senderPhone: "31612345678",
    senderName: "Mark Mossing",
    content: "Ziet er strak uit die nieuwe teal kleur! #37b5ab 🚀",
    messageId: "msg_mock_1",
    mediaId: null,
    mediaUrl: null,
    receivedAt: new Date().toISOString(),
    isRead: false,
    isPinned: true
  },
  {
    id: "mock2",
    type: "AUDIO",
    senderPhone: "31698765432",
    senderName: "Luc van de Station",
    content: "Audiobericht van Luc",
    messageId: "msg_mock_2",
    mediaId: "mock_audio_1",
    mediaUrl: null,
    receivedAt: new Date(Date.now() - 600000).toISOString(),
    isRead: false,
    isPinned: false
  },
  {
    id: "mock3",
    type: "TEXT",
    senderPhone: "31611223344",
    senderName: "Anonieme Luisteraar",
    content: "Kan de nieuwe track van Afrojack gedraaid worden?",
    messageId: "msg_mock_3",
    mediaId: null,
    mediaUrl: null,
    receivedAt: new Date(Date.now() - 3600000).toISOString(),
    isRead: true,
    isPinned: false
  }
];

export async function GET() {
  const session = await getServerSession(authOptions);
  
  try {
    const dbMessages = await prisma.message.findMany({
      orderBy: [
        { isPinned: "desc" },
        { isRead: "asc" },
        { receivedAt: "desc" },
      ],
      take: 50,
    });

    let messages = dbMessages;
    
    // Injecteer mocks als user dat aan heeft staan
    if ((session?.user as any)?.showMockMessages) {
      messages = [...MOCK_MESSAGES, ...dbMessages];
    }

    return NextResponse.json(messages);
  } catch (error) {
    console.warn("[API/messages] Database error of onbereikbaar.");
    return NextResponse.json(MOCK_MESSAGES);
  }
}

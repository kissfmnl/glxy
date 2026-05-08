import { prisma } from "@/lib/prisma";
import Link from "next/link";

/**
 * WhatsApp Widget — toont de 3 meest recente ongelezen berichten.
 * Dit is een Server Component: leest direct uit de database.
 * Wordt gebruikt in het Dashboard Bento-grid.
 */
export default async function WhatsAppWidget() {
  let unreadMessages: any[] = [];
  let totalUnread = 0;

  try {
    unreadMessages = await prisma.message.findMany({
      where: { isRead: false },
      orderBy: { receivedAt: "desc" },
      take: 4,
    });
    totalUnread = await prisma.message.count({ where: { isRead: false } });
  } catch (error) {
    console.warn("[WhatsAppWidget] Database niet gevonden of onbereikbaar. Mocking data...");
    unreadMessages = [
      {
        id: "mock1",
        type: "TEXT",
        senderName: "Mark (KISS)",
        senderPhone: "31612345678",
        content: "Hey, kun je 'Love Inc - You're A Superstar' draaien?",
        receivedAt: new Date(),
      },
      {
        id: "mock-audio",
        type: "AUDIO",
        senderName: "Luisteraar 1",
        senderPhone: "31600000001",
        mediaId: "123",
        content: "Audiobericht",
        receivedAt: new Date(Date.now() - 1000 * 60 * 2),
      },
    ];
    totalUnread = 2;
  }

  return (
    <div className="card flex h-full flex-col rounded-3xl p-6">
      {/* Header */}
      <div className="mb-5 flex shrink-0 items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.025.507 3.933 1.395 5.608L0 24l6.562-1.369A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.882a9.866 9.866 0 01-5.031-1.378l-.361-.214-3.741.981.998-3.648-.235-.374A9.86 9.86 0 012.118 12C2.118 6.58 6.58 2.118 12 2.118c5.42 0 9.882 4.462 9.882 9.882 0 5.42-4.462 9.882-9.882 9.882z" />
            </svg>
          </div>
          <span className="text-white font-semibold text-sm">WhatsApp</span>
        </div>
        {totalUnread > 0 && (
          <span className="badge-unread">{totalUnread} ongelezen</span>
        )}
      </div>

      {/* Berichtenlijst */}
      <div className="custom-scrollbar flex-1 space-y-2 overflow-y-auto pr-1">
        {unreadMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 opacity-40">
            <svg className="w-8 h-8 text-brand-primary mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-brand-muted text-[10px] font-black uppercase tracking-widest">Alles bijgewerkt</p>
          </div>
        ) : (
          unreadMessages.map((msg) => (
            <div
              key={msg.id}
              className="bg-white/5 rounded-xl p-3 hover:bg-white/8 transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-900 dark:text-white text-xs font-bold truncate">
                  {msg.senderName ?? <span className="privacy-blur">{msg.senderPhone}</span>}
                </span>
          <div
            title={msg.isPinned ? "Gepind" : "Niet gepind"}
            className={`p-1.5 rounded-md transition-colors ${
              msg.isPinned
                ? "text-yellow-500"
                : "text-gray-300 dark:text-gray-600"
            }`}
          >
            <svg className={`w-3.5 h-3.5 ${msg.isPinned ? "rotate-45" : ""}`} fill="currentColor" viewBox="0 0 24 24">
              <path d="M16,12V4H17V2H7V4H8V12L6,14V16H11V22H13V16H18V14L16,12M8.8,14L10,12.8V4H14V12.8L15.2,14H8.8Z" />
            </svg>
          </div>
        </div>
        
        {msg.type === "AUDIO" ? (
          <div className="flex items-center gap-2 mt-1.5 py-1 px-2 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/10">
            <svg className="w-3 h-3 text-brand-primary animate-pulse" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
            </svg>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Audio beschikbaar</span>
            <Link href="/whatsapp" className="ml-auto text-[10px] text-gray-400 hover:text-brand-primary font-bold underline">Luister</Link>
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400 text-xs line-clamp-2 mt-1">{msg.content}</p>
        )}
      </div>
    ))
  )}
</div>

{/* Footer knop */}
<div className="mt-5 border-t pt-5 transition-colors duration-200" style={{ borderColor: "var(--border-color)" }}>
  <Link
    href="/whatsapp"
    className="btn-primary flex w-full justify-center py-3.5 text-xs shadow-sm transition-colors hover:opacity-95"
  >
    Bekijk alle berichten →
  </Link>
</div>
    </div>
  );
}

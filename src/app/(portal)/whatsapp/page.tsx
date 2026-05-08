"use client";

import { useMemo, useState, useTransition } from "react";
import useSWR from "swr";
import { markAsRead, togglePin } from "@/app/actions/messageActions";
import { PortalPageShell } from "@/components/portal/PortalPageShell";

interface Message {
  id: string;
  type: "TEXT" | "AUDIO";
  senderPhone: string;
  senderName: string | null;
  content: string;
  mediaId: string | null;
  receivedAt: string;
  isRead: boolean;
  isPinned: boolean;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function WhatsAppInboxPage() {
  const { data: messages, isLoading, mutate } = useSWR<Message[]>(
    "/api/messages",
    fetcher,
    { refreshInterval: 5_000 }
  );

  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");

  const contacts = useMemo(() => {
    if (!messages) return [];
    const groups: Record<
      string,
      { name: string | null; phone: string; lastMessage: Message; unreadCount: number }
    > = {};

    messages.forEach((m) => {
      if (!groups[m.senderPhone]) {
        groups[m.senderPhone] = {
          name: m.senderName,
          phone: m.senderPhone,
          lastMessage: m,
          unreadCount: 0,
        };
      }
      if (!m.isRead) groups[m.senderPhone].unreadCount++;
    });

    return Object.values(groups).filter(
      (c) =>
        c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery)
    );
  }, [messages, searchQuery]);

  const selectedMessages = useMemo(() => {
    if (!messages || !selectedPhone) return [];
    return messages.filter((m) => m.senderPhone === selectedPhone).reverse();
  }, [messages, selectedPhone]);

  const selectedContact = contacts.find((c) => c.phone === selectedPhone);

  function handleAction(action: Function, ...args: any[]) {
    startTransition(async () => {
      await action(...args);
      mutate();
    });
  }

  if (isLoading && !messages) {
    return (
      <PortalPageShell width="wide">
        <div className="flex min-h-[50vh] items-center justify-center rounded-3xl border border-gray-200 bg-white dark:border-white/10 dark:bg-dark-card">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-brand-primary" />
        </div>
      </PortalPageShell>
    );
  }

  return (
    <PortalPageShell width="wide">
    <div className="relative flex h-[min(100dvh-7.5rem,900px)] min-h-[480px] overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-premium dark:border-white/5 dark:bg-dark-card">
      <div className="w-1/3 border-r dark:border-white/5 flex flex-col bg-gray-50/50 dark:bg-white/[0.02]">
        <div className="p-6 border-b dark:border-white/5">
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4">Conversaties</h2>
          <div className="relative">
            <input
              type="text"
              placeholder="Zoek contact..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-white/5 border dark:border-white/10 rounded-xl px-10 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-primary transition-all"
            />
            <svg className="w-4 h-4 absolute left-4 top-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {contacts.length === 0 ? (
            <div className="p-8 text-center text-gray-400 dark:text-gray-500 text-sm font-medium">Geen gesprekken gevonden</div>
          ) : (
            contacts.map((contact) => (
              <button
                key={contact.phone}
                onClick={() => setSelectedPhone(contact.phone)}
                className={`w-full p-5 flex items-center gap-4 border-b dark:border-white/5 transition-all text-left ${
                  selectedPhone === contact.phone ? "bg-white dark:bg-white/10 shadow-sm" : "hover:bg-white/50 dark:hover:bg-white/5"
                }`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-black transition-colors ${
                  selectedPhone === contact.phone ? "bg-brand-primary text-white" : "bg-brand-primary/10 text-brand-primary"
                }`}>
                  {(contact.name ?? contact.phone).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <p className={`text-sm font-black truncate ${selectedPhone === contact.phone ? "text-brand-primary" : "text-gray-900 dark:text-white"}`}>
                      {contact.name || <span className="privacy-blur text-[11px] opacity-70 tracking-tighter">{contact.phone}</span>}
                    </p>
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500">
                      {new Date(contact.lastMessage.receivedAt).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0">
                    {contact.lastMessage.type === "AUDIO" && (
                      <svg className="w-3 h-3 text-brand-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                      </svg>
                    )}
                    <p className="text-xs text-gray-500 truncate font-medium">
                      {contact.lastMessage.type === "AUDIO" ? "Audiobericht" : contact.lastMessage.content}
                    </p>
                  </div>
                </div>
                {contact.unreadCount > 0 && (
                  <div className="w-5 h-5 bg-brand-primary rounded-full flex items-center justify-center text-[10px] text-white font-black shadow-lg shadow-brand-primary/20">
                    {contact.unreadCount}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white dark:bg-dark-card relative shadow-sm border-l dark:border-white/5 z-10">
        {selectedContact ? (
          <>
            <div className="p-5 border-b dark:border-white/5 flex justify-between items-center bg-white/50 dark:bg-white/[0.01] backdrop-blur-md z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-primary flex items-center justify-center text-white font-black shadow-lg shadow-brand-primary/20">
                  {(selectedContact.name ?? selectedContact.phone).charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-gray-900 dark:text-white font-black text-lg leading-none mb-1.5">
                    {selectedContact.name ?? "Onbekende luisteraar"}
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-[0.2em] privacy-blur">
                      {selectedContact.phone}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-all text-gray-400 group" title="Contact info">
                  <svg className="w-5 h-5 group-hover:text-brand-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-gray-50/30 dark:bg-transparent">
              {selectedMessages.map((m) => (
                <div key={m.id} className={`flex ${m.isPinned ? "justify-center my-8" : "justify-start"}`}>
                  {m.isPinned && (
                    <div className="absolute left-0 right-0 border-t-2 border-dashed border-brand-primary/10 z-0"></div>
                  )}

                  <div className={`relative max-w-[80%] group ${
                    m.isPinned
                      ? "bg-brand-primary/[0.03] border-2 border-brand-primary/20 rounded-3xl p-6 z-10 shadow-2xl shadow-brand-primary/5"
                      : "bg-white dark:bg-white/5 border dark:border-white/10 p-5 rounded-3xl rounded-tl-none shadow-premium transition-all hover:border-brand-primary/20"
                  }`}>
                    {m.isPinned && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-primary text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-brand-primary/20">
                        Gepind bericht
                      </div>
                    )}

                    <div className="flex justify-between items-start gap-6 mb-3">
                      <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                        {new Date(m.receivedAt).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <div className="flex gap-2 items-center opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => handleAction(togglePin, m.id, m.isPinned)}
                          className={`p-1.5 rounded-lg transition-all ${
                            m.isPinned ? "text-brand-primary bg-brand-primary/10" : "text-gray-400 dark:text-gray-500 hover:text-brand-primary hover:bg-brand-primary/5"
                          }`}
                          title="Pin bericht"
                          disabled={isPending}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleAction(markAsRead, m.id, m.isRead)}
                          className={`p-1.5 rounded-lg transition-all ${
                            m.isRead ? "text-gray-400 bg-gray-100 dark:bg-white/5" : "text-green-500 bg-green-500/10 hover:bg-green-500/20"
                          }`}
                          title="Markeer als gelezen"
                          disabled={isPending}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {m.type === "AUDIO" ? (
                      <div className="bg-brand-primary/5 p-5 rounded-2xl border border-brand-primary/10 shadow-inner">
                        <div className="flex items-center gap-5">
                          <audio controls className="h-9 flex-1 invert dark:invert-0 opacity-90 custom-audio-player">
                            <source src={`/api/media/${m.mediaId}`} type="audio/ogg" />
                          </audio>
                          <a href={`/api/media/${m.mediaId}`} download className="w-10 h-10 flex items-center justify-center bg-brand-primary text-white rounded-xl shadow-lg shadow-brand-primary/20 hover:scale-105 transition-transform">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </a>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-800 dark:text-gray-100 text-[15px] leading-relaxed font-bold">
                        {m.content}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-8 border-t dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.01]">
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="Typ een reactie (binnenkort beschikbaar)..."
                  disabled
                  className="flex-1 bg-white dark:bg-white/5 border dark:border-white/10 rounded-2xl px-6 py-4 text-sm italic text-gray-400 dark:text-gray-500 cursor-not-allowed shadow-inner"
                />
                <button disabled className="w-14 h-14 bg-gray-100 dark:bg-white/10 rounded-2xl flex items-center justify-center text-gray-300 cursor-not-allowed">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-gray-50/20">
            <div className="w-32 h-32 bg-white dark:bg-white/5 rounded-3xl flex items-center justify-center mb-8 shadow-premium border dark:border-white/5">
              <svg className="w-12 h-12 text-gray-200 dark:text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3">Selecteer een chat</h3>
            <p className="text-gray-500 dark:text-gray-500 text-sm max-w-xs font-medium">
              Kies een luisteraar in de lijst om direct de chatgeschiedenis in te zien en berichten te beheren.
            </p>
          </div>
        )}
      </div>
    </div>
    </PortalPageShell>
  );
}


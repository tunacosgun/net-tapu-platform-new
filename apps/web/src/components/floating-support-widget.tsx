'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import apiClient from '@/lib/api-client';
import {
  MessageCircle,
  X,
  Send,
  Check,
  CheckCheck,
  ArrowLeft,
  Plus,
} from 'lucide-react';

type Ticket = {
  id: string;
  subject: string;
  status: string;
  unreadUser: number;
  lastMessageAt: string | null;
  createdAt: string;
};

type Message = {
  id: string;
  senderRole: 'user' | 'admin' | 'system' | 'consultant';
  body: string | null;
  attachmentUrl: string | null;
  attachmentType: string | null;
  attachmentName: string | null;
  readAt: string | null;
  createdAt: string;
};

function formatTime(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Floating support chat bubble shown on every public page.
 *
 * Logged-out: prompts the user to log in (keeps the lift-into-account
 *   moment honest — anonymous chat lacks reply-back identity).
 * Logged-in: pulls their existing tickets, lets them open one or start
 *   a new conversation right from the bubble, mirroring the WhatsApp
 *   embed pattern competitors use.
 *
 * Hidden on /admin/* and /profile/support (the user is already in a
 * dedicated chat surface, the bubble would just stack).
 */
export function FloatingSupportWidget() {
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [view, setView] = useState<'list' | 'chat' | 'new'>('list');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState({ subject: '', initialMessage: '' });
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Skip rendering on surfaces that already host a chat UI.
  const hide =
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/profile/support') ||
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/register');

  // Pull unread count periodically (logged in only). Cheap.
  useEffect(() => {
    if (!isAuthenticated || hide) { setUnread(0); return; }
    const fetchCount = () => {
      apiClient
        .get<{ count: number }>('/support/unread-count')
        .then(({ data }) => setUnread(data.count))
        .catch(() => undefined);
    };
    fetchCount();
    const id = setInterval(fetchCount, 30000);
    return () => clearInterval(id);
  }, [isAuthenticated, hide]);

  // When the panel opens, load the ticket list.
  useEffect(() => {
    if (!open || !isAuthenticated) return;
    apiClient.get<Ticket[]>('/support/tickets').then(({ data }) => {
      setTickets(Array.isArray(data) ? data : []);
    }).catch(() => undefined);
  }, [open, isAuthenticated]);

  // Active chat polling.
  useEffect(() => {
    if (!open || view !== 'chat' || !activeId) return;
    let cancelled = false;
    const load = async () => {
      try {
        const { data } = await apiClient.get<{ ticket: Ticket; messages: Message[] }>(`/support/tickets/${activeId}`);
        if (cancelled) return;
        setActiveTicket(data.ticket);
        setMessages(data.messages);
        apiClient.post(`/support/tickets/${activeId}/read`).catch(() => undefined);
      } catch { /* ignore */ }
    };
    load();
    const id = setInterval(load, 6000);
    return () => { cancelled = true; clearInterval(id); };
  }, [open, view, activeId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length, view]);

  if (hide || isLoading) return null;

  async function sendMessage() {
    if (!activeId) return;
    const text = body.trim();
    if (!text) return;
    setSending(true);
    try {
      await apiClient.post(`/support/tickets/${activeId}/messages`, { body: text });
      setBody('');
      const { data } = await apiClient.get<{ ticket: Ticket; messages: Message[] }>(`/support/tickets/${activeId}`);
      setActiveTicket(data.ticket);
      setMessages(data.messages);
    } finally {
      setSending(false);
    }
  }

  async function createTicket() {
    if (!draft.subject.trim()) return;
    const { data } = await apiClient.post<Ticket>('/support/tickets', {
      subject: draft.subject.trim(),
      initialMessage: draft.initialMessage.trim() || undefined,
    });
    setDraft({ subject: '', initialMessage: '' });
    setActiveId(data.id);
    setView('chat');
  }

  function openTicket(t: Ticket) {
    setActiveId(t.id);
    setActiveTicket(t);
    setView('chat');
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`fixed bottom-5 right-5 z-[9990] flex h-14 w-14 items-center justify-center rounded-full shadow-2xl transition-all hover:scale-105 ${
          open ? 'bg-slate-700' : 'bg-emerald-600 hover:bg-emerald-700'
        }`}
        aria-label="Destek"
      >
        {open ? <X className="h-6 w-6 text-white" /> : <MessageCircle className="h-6 w-6 text-white" />}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white shadow-md">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-24 right-5 z-[9991] flex h-[560px] max-h-[calc(100vh-120px)] w-[380px] max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          {/* Header */}
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 px-4 py-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {view === 'chat' && (
                  <button
                    onClick={() => { setView('list'); setActiveId(null); }}
                    className="rounded-md p-1 text-emerald-100 hover:bg-white/10"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                )}
                <div>
                  <p className="font-bold text-white text-sm">
                    {view === 'chat' ? activeTicket?.subject || 'Sohbet' : view === 'new' ? 'Yeni Talep' : 'NetTapu Destek'}
                  </p>
                  <p className="text-[11px] text-emerald-100">
                    {view === 'list' ? 'Sorularınız için 7/24 destek' : view === 'new' ? 'Konuyu ve mesajınızı yazın' : 'Genelde 1 saat içinde dönüş'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {!isAuthenticated ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
                <MessageCircle className="h-7 w-7 text-emerald-600" />
              </div>
              <p className="font-semibold text-slate-900">Destek için giriş yapın</p>
              <p className="mt-1 text-sm text-slate-500">
                Hızlı yanıt almak ve konuşmalarınızı kaydetmek için hesabınıza giriş yapın.
              </p>
              <a
                href={`/login?returnTo=${encodeURIComponent(pathname || '/')}`}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Giriş Yap
              </a>
              <a href="/contact" className="mt-2 text-xs text-emerald-700 hover:underline">
                Üye olmadan iletişim formu
              </a>
            </div>
          ) : view === 'list' ? (
            <>
              <div className="flex-1 overflow-y-auto">
                {tickets.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                    <MessageCircle className="mb-2 h-8 w-8 text-slate-300" />
                    <p className="text-sm font-semibold text-slate-900">Henüz konuşmanız yok</p>
                    <p className="mt-1 text-xs text-slate-500">Aşağıdan yeni bir destek talebi başlatın.</p>
                  </div>
                ) : (
                  tickets.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => openTicket(t)}
                      className="flex w-full items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">{t.subject}</p>
                        <p className="text-[11px] text-slate-500">{formatTime(t.lastMessageAt || t.createdAt)}</p>
                      </div>
                      {t.unreadUser > 0 && (
                        <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{t.unreadUser}</span>
                      )}
                    </button>
                  ))
                )}
              </div>
              <div className="border-t border-slate-200 p-3">
                <button
                  onClick={() => setView('new')}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  <Plus className="h-4 w-4" />
                  Yeni Konuşma Başlat
                </button>
              </div>
            </>
          ) : view === 'new' ? (
            <div className="flex flex-1 flex-col p-4">
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Konu</label>
                  <input
                    value={draft.subject}
                    onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
                    placeholder="Örn. Depozito iadesi"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Mesaj</label>
                  <textarea
                    value={draft.initialMessage}
                    onChange={(e) => setDraft({ ...draft, initialMessage: e.target.value })}
                    rows={5}
                    placeholder="Detayları yazın…"
                    className="mt-1 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="mt-auto flex gap-2 pt-3">
                <button
                  onClick={createTicket}
                  disabled={!draft.subject.trim()}
                  className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"
                >
                  Gönder
                </button>
                <button onClick={() => setView('list')} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  Geri
                </button>
              </div>
            </div>
          ) : (
            <>
              <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto bg-slate-50/30 p-3">
                {messages.length === 0 ? (
                  <p className="py-8 text-center text-xs text-slate-400">Henüz mesaj yok</p>
                ) : (
                  messages.map((m) => {
                    if (m.senderRole === 'system') {
                      return (
                        <div key={m.id} className="flex justify-center">
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">{m.body}</span>
                        </div>
                      );
                    }
                    const mine = m.senderRole === 'user';
                    return (
                      <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl px-3 py-1.5 ${mine ? 'bg-emerald-600 text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-900 rounded-bl-sm'}`}>
                          {m.body && <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>}
                          <div className={`flex items-center justify-end gap-1 mt-0.5 text-[9px] ${mine ? 'text-emerald-100' : 'text-slate-400'}`}>
                            <span>{formatTime(m.createdAt)}</span>
                            {mine && (m.readAt ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              {activeTicket?.status === 'closed' ? (
                <div className="border-t border-slate-200 p-3 text-center text-xs text-slate-500">Bu talep kapatıldı.</div>
              ) : (
                <div className="border-t border-slate-200 p-2.5">
                  <div className="flex items-end gap-2">
                    <textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder="Mesajınızı yazın…"
                      rows={1}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      className="max-h-24 flex-1 resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={sending || !body.trim()}
                      className="rounded-lg bg-emerald-600 p-2 text-white hover:bg-emerald-700 disabled:opacity-40"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}

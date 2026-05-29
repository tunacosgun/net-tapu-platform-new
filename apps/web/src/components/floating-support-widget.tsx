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
  Paperclip,
  Sparkles,
  ChevronRight,
  Loader2,
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
  ShieldCheck,
  Clock3,
  HelpCircle,
  Phone,
} from 'lucide-react';

type Ticket = {
  id: string;
  subject: string;
  status: 'open' | 'in_progress' | 'waiting_user' | 'closed';
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

const STATUS_PILL: Record<string, { label: string; cls: string }> = {
  open: { label: 'Yeni', cls: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'Görüşmede', cls: 'bg-amber-100 text-amber-700' },
  waiting_user: { label: 'Sizden cevap bekleniyor', cls: 'bg-violet-100 text-violet-700' },
  closed: { label: 'Kapalı', cls: 'bg-slate-200 text-slate-600' },
};

function formatRelativeTime(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'az önce';
  if (min < 60) return `${min} dk önce`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour} saat önce`;
  const day = Math.floor(hour / 24);
  if (day < 7) return `${day} gün önce`;
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
}

function formatTime(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

function MessageAttachment({ url, type, name }: { url: string; type: string | null; name: string | null }) {
  const isImage = (type || '').startsWith('image/');
  const isVideo = (type || '').startsWith('video/');
  if (isImage) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="block">
        <img src={url} alt={name || ''} className="max-h-40 rounded-lg border border-slate-200" />
      </a>
    );
  }
  if (isVideo) return <video src={url} controls className="max-h-40 rounded-lg" />;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      download={name || undefined}
      className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
    >
      <FileText className="h-3.5 w-3.5 text-slate-500" />
      <span className="truncate max-w-[180px]">{name || 'Dosya'}</span>
    </a>
  );
}

/**
 * Premium floating support widget.
 *
 * Design lifts cues from Intercom/Crisp: bubble button + tall panel with a
 * gradient header showing agent presence ("Çevrimiçi"), an emoji greeting,
 * and a "typical response time" line. Logged-in users see their thread
 * list with status pills + relative-time stamps. Empty state offers two
 * quick paths: start a chat or read the FAQ.
 *
 * Hidden on /admin/*, /profile/support, /login, /register so it doesn't
 * stack with existing chat surfaces.
 */
export function FloatingSupportWidget() {
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [view, setView] = useState<'list' | 'chat' | 'new'>('list');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [pendingFile, setPendingFile] = useState<{ url: string; name: string; type: string } | null>(null);
  const [draft, setDraft] = useState({ subject: '', initialMessage: '' });
  const [submittingNew, setSubmittingNew] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const hide =
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/profile/support') ||
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/register');

  useEffect(() => {
    if (!isAuthenticated || hide) { setUnread(0); return; }
    const fetchCount = () => {
      apiClient.get<{ count: number }>('/support/unread-count')
        .then(({ data }) => setUnread(data.count))
        .catch(() => undefined);
    };
    fetchCount();
    const id = setInterval(fetchCount, 30000);
    return () => clearInterval(id);
  }, [isAuthenticated, hide]);

  useEffect(() => {
    if (!open || !isAuthenticated) return;
    setLoadingList(true);
    apiClient.get<Ticket[]>('/support/tickets')
      .then(({ data }) => setTickets(Array.isArray(data) ? data : []))
      .catch(() => setTickets([]))
      .finally(() => setLoadingList(false));
  }, [open, isAuthenticated, view]);

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

  const firstName = (user as { firstName?: string } | null)?.firstName
    || user?.email?.split('@')[0]
    || '';
  const greeting = `Merhaba${firstName ? ` ${firstName}` : ''} 👋`;

  async function uploadFile(file: File) {
    const fd = new FormData();
    fd.append('file', file);
    const { data } = await apiClient.post<{ url: string; filename: string; mimetype: string }>('/support/attachments', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    setPendingFile({ url: data.url, name: data.filename, type: data.mimetype });
  }

  async function sendMessage() {
    if (!activeId) return;
    const text = body.trim();
    if (!text && !pendingFile) return;
    setSending(true);
    try {
      await apiClient.post(`/support/tickets/${activeId}/messages`, {
        body: text || undefined,
        attachmentUrl: pendingFile?.url,
        attachmentType: pendingFile?.type,
        attachmentName: pendingFile?.name,
      });
      setBody('');
      setPendingFile(null);
      const { data } = await apiClient.get<{ ticket: Ticket; messages: Message[] }>(`/support/tickets/${activeId}`);
      setActiveTicket(data.ticket);
      setMessages(data.messages);
    } finally {
      setSending(false);
    }
  }

  async function createTicket() {
    if (!draft.subject.trim()) return;
    setSubmittingNew(true);
    try {
      const { data } = await apiClient.post<Ticket>('/support/tickets', {
        subject: draft.subject.trim(),
        initialMessage: draft.initialMessage.trim() || undefined,
      });
      setDraft({ subject: '', initialMessage: '' });
      setActiveId(data.id);
      setView('chat');
    } finally {
      setSubmittingNew(false);
    }
  }

  function openTicket(t: Ticket) {
    setActiveId(t.id);
    setActiveTicket(t);
    setView('chat');
  }

  return (
    <>
      {/* Floating button (with pulse halo) */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`group fixed bottom-5 right-5 z-[9990] flex h-14 w-14 items-center justify-center rounded-full shadow-[0_10px_30px_-5px_rgba(16,185,129,0.5)] ring-2 ring-white transition-all hover:scale-105 active:scale-95 ${
          open ? 'bg-slate-800 ring-slate-200' : 'bg-gradient-to-br from-emerald-500 to-emerald-700'
        }`}
        aria-label="Destek"
      >
        {!open && (
          <>
            <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-emerald-400/40" style={{ animationDuration: '2.5s' }} />
            <span className="absolute -inset-1 -z-10 rounded-full bg-emerald-500/15 blur-md" />
          </>
        )}
        {open
          ? <X className="h-5 w-5 text-white" strokeWidth={2.5} />
          : <MessageCircle className="h-6 w-6 text-white" strokeWidth={2.25} />}
        {!open && unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white shadow-md ring-2 ring-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-24 right-5 z-[9991] flex h-[620px] max-h-[calc(100vh-120px)] w-[400px] max-w-[calc(100vw-32px)] origin-bottom-right animate-in fade-in zoom-in-95 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)]">
          {/* Premium gradient header */}
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 px-5 pt-5 pb-4">
            {/* Decorative blurred circles */}
            <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-emerald-400/20 blur-2xl" />
            <div className="absolute -bottom-8 -left-4 h-24 w-24 rounded-full bg-teal-300/15 blur-xl" />

            <div className="relative flex items-start justify-between">
              <div className="min-w-0 flex-1">
                {view === 'chat' ? (
                  <button
                    onClick={() => { setView('list'); setActiveId(null); }}
                    className="mb-1 inline-flex items-center gap-1 text-xs text-emerald-100 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    Konuşmalar
                  </button>
                ) : view === 'new' ? (
                  <button
                    onClick={() => setView('list')}
                    className="mb-1 inline-flex items-center gap-1 text-xs text-emerald-100 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    Geri
                  </button>
                ) : null}

                {view === 'list' && (
                  <>
                    <h3 className="text-xl font-bold text-white tracking-tight">{greeting}</h3>
                    <p className="mt-0.5 text-sm text-emerald-50/90">Size nasıl yardımcı olabiliriz?</p>
                  </>
                )}
                {view === 'chat' && (
                  <>
                    <h3 className="truncate text-base font-bold text-white">{activeTicket?.subject || 'Sohbet'}</h3>
                    {activeTicket && (
                      <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_PILL[activeTicket.status].cls}`}>
                        {STATUS_PILL[activeTicket.status].label}
                      </span>
                    )}
                  </>
                )}
                {view === 'new' && (
                  <>
                    <h3 className="text-base font-bold text-white">Yeni Konuşma</h3>
                    <p className="mt-0.5 text-xs text-emerald-100">Sorununuzu yazın, ekibimiz yanıtlasın.</p>
                  </>
                )}
              </div>

              {view === 'list' && (
                <div className="ml-3 flex shrink-0 -space-x-1.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-400 text-sm font-bold text-amber-900 ring-2 ring-emerald-600">A</div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-300 text-sm font-bold text-rose-900 ring-2 ring-emerald-600">M</div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-300 text-sm font-bold text-sky-900 ring-2 ring-emerald-600">K</div>
                </div>
              )}
            </div>

            {view === 'list' && (
              <div className="mt-3 flex items-center gap-2 text-[11px] text-emerald-100">
                <span className="flex items-center gap-1">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
                  </span>
                  Çevrimiçi
                </span>
                <span className="text-emerald-200/60">·</span>
                <span className="flex items-center gap-1">
                  <Clock3 className="h-3 w-3" />
                  Genelde 5 dk içinde cevaplıyoruz
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          {!isAuthenticated ? (
            <div className="flex flex-1 flex-col">
              <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                  <MessageCircle className="h-7 w-7 text-emerald-600" />
                  <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-amber-500" />
                </div>
                <p className="font-bold text-slate-900">Hesabınızla giriş yapın</p>
                <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
                  Hızlı yanıt almak, dosya yüklemek ve konuşma geçmişinizi saklamak için giriş yapın.
                </p>
                <a
                  href={`/login?returnTo=${encodeURIComponent(pathname || '/')}`}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 transition-colors"
                >
                  Giriş Yap
                </a>
                <a
                  href={`/register?returnTo=${encodeURIComponent(pathname || '/')}`}
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-emerald-200 px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
                >
                  Ücretsiz Üye Ol
                </a>
              </div>
              <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-3">
                <a href="/contact" className="flex items-center justify-between text-xs text-slate-600 hover:text-emerald-700">
                  <span className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> Üye olmadan iletişim formu</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          ) : view === 'list' ? (
            <>
              <div className="flex-1 overflow-y-auto">
                {loadingList ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-50 to-emerald-100">
                      <Sparkles className="h-6 w-6 text-emerald-600" />
                    </div>
                    <p className="text-sm font-bold text-slate-900">Henüz konuşmanız yok</p>
                    <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                      Aşağıdan yeni bir konuşma başlatın — ekibimiz size yardımcı olmaya hazır.
                    </p>
                    <div className="mt-5 w-full space-y-2">
                      <a href="/sss" className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-left transition-colors hover:border-emerald-300 hover:bg-emerald-50/40">
                        <span className="flex items-center gap-2 text-sm">
                          <HelpCircle className="h-4 w-4 text-emerald-600" />
                          <span className="font-semibold text-slate-700">Sıkça Sorulan Sorular</span>
                        </span>
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </a>
                      <a href="/contact" className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-left transition-colors hover:border-emerald-300 hover:bg-emerald-50/40">
                        <span className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-emerald-600" />
                          <span className="font-semibold text-slate-700">Telefon ile arayın</span>
                        </span>
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    <p className="px-4 pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Son Konuşmalar
                    </p>
                    {tickets.map((t) => {
                      const st = STATUS_PILL[t.status];
                      return (
                        <button
                          key={t.id}
                          onClick={() => openTicket(t)}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-700 font-bold text-sm">
                            {t.subject.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate text-sm font-semibold text-slate-900">{t.subject}</p>
                              {t.unreadUser > 0 && (
                                <span className="shrink-0 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{t.unreadUser}</span>
                              )}
                            </div>
                            <div className="mt-0.5 flex items-center gap-2">
                              <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${st.cls}`}>
                                {st.label}
                              </span>
                              <span className="text-[10px] text-slate-400">{formatRelativeTime(t.lastMessageAt || t.createdAt)}</span>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="border-t border-slate-200 bg-white p-3">
                <button
                  onClick={() => setView('new')}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 hover:shadow-xl hover:shadow-emerald-600/40 transition-all"
                >
                  <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform" />
                  Yeni Konuşma Başlat
                </button>
                <p className="mt-2 flex items-center justify-center gap-1 text-[10px] text-slate-400">
                  <ShieldCheck className="h-3 w-3" />
                  Mesajlarınız uçtan uca güvenli iletilir
                </p>
              </div>
            </>
          ) : view === 'new' ? (
            <div className="flex flex-1 flex-col p-4">
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Konu</label>
                  <input
                    value={draft.subject}
                    onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
                    placeholder="Örn. Depozito iadesi hakkında"
                    className="mt-1.5 w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:bg-white focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Mesajınız</label>
                  <textarea
                    value={draft.initialMessage}
                    onChange={(e) => setDraft({ ...draft, initialMessage: e.target.value })}
                    rows={6}
                    placeholder="Detayları yazın…"
                    className="mt-1.5 w-full resize-none rounded-xl border-2 border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:bg-white focus:outline-none transition-colors"
                  />
                </div>
              </div>
              <div className="mt-auto flex gap-2 pt-4">
                <button
                  onClick={createTicket}
                  disabled={!draft.subject.trim() || submittingNew}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 hover:shadow-xl transition-all disabled:opacity-40 disabled:shadow-none"
                >
                  {submittingNew ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Gönder
                </button>
              </div>
            </div>
          ) : (
            <>
              <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-gradient-to-b from-slate-50/40 to-white px-3 py-4">
                {messages.length === 0 ? (
                  <p className="py-8 text-center text-xs text-slate-400">Henüz mesaj yok</p>
                ) : (
                  messages.map((m, idx) => {
                    if (m.senderRole === 'system') {
                      return (
                        <div key={m.id} className="flex justify-center">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] text-slate-500">{m.body}</span>
                        </div>
                      );
                    }
                    const mine = m.senderRole === 'user';
                    const prev = messages[idx - 1];
                    const showAvatar = !mine && (!prev || prev.senderRole !== m.senderRole);
                    return (
                      <div key={m.id} className={`flex items-end gap-1.5 ${mine ? 'justify-end' : 'justify-start'}`}>
                        {!mine && (
                          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-[10px] font-bold text-white ring-2 ring-white shadow-sm ${showAvatar ? '' : 'invisible'}`}>
                            NT
                          </div>
                        )}
                        <div className={`max-w-[78%] rounded-2xl px-3.5 py-2 shadow-sm ${
                          mine
                            ? 'bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-br-sm'
                            : 'bg-white border border-slate-200 text-slate-900 rounded-bl-sm'
                        }`}>
                          {!mine && showAvatar && (
                            <p className="text-[10px] font-bold text-emerald-700 mb-0.5">NetTapu Destek</p>
                          )}
                          {m.body && <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{m.body}</p>}
                          {m.attachmentUrl && (
                            <div className={m.body ? 'mt-2' : ''}>
                              <MessageAttachment url={m.attachmentUrl} type={m.attachmentType} name={m.attachmentName} />
                            </div>
                          )}
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
                <div className="border-t border-slate-200 bg-slate-50 p-3 text-center text-xs text-slate-500">
                  Bu konuşma kapatıldı. Yeni bir konuşma başlatabilirsiniz.
                </div>
              ) : (
                <div className="border-t border-slate-200 bg-white p-3">
                  {pendingFile && (
                    <div className="mb-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      {pendingFile.type.startsWith('image/') ? <ImageIcon className="h-3.5 w-3.5 text-slate-500" /> : pendingFile.type.startsWith('video/') ? <VideoIcon className="h-3.5 w-3.5 text-slate-500" /> : <FileText className="h-3.5 w-3.5 text-slate-500" />}
                      <span className="text-xs text-slate-600 truncate flex-1">{pendingFile.name}</span>
                      <button onClick={() => setPendingFile(null)} className="text-slate-400 hover:text-slate-600">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  <div className="flex items-end gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadFile(f).catch(() => undefined);
                        e.target.value = '';
                      }}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    >
                      <Paperclip className="h-4 w-4" />
                    </button>
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
                      className="max-h-24 flex-1 resize-none rounded-xl bg-slate-100 px-3 py-2 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={sending || (!body.trim() && !pendingFile)}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-emerald-700 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-40 disabled:shadow-none"
                    >
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Footer credit */}
          {view === 'list' && (
            <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-2 text-center">
              <p className="text-[10px] text-slate-400">
                Destek altyapısı <span className="font-bold text-slate-600">NetTapu</span> tarafından sağlanmaktadır
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
}

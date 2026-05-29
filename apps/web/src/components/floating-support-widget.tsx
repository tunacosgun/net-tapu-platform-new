'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
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
  ChevronRight,
  Loader2,
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
  Search,
  Star,
  Zap,
  HelpCircle,
  Phone,
  Headphones,
  ShieldCheck,
  Smile,
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

const STATUS_DOT: Record<string, string> = {
  open: 'bg-blue-500',
  in_progress: 'bg-amber-500',
  waiting_user: 'bg-violet-500',
  closed: 'bg-slate-300',
};

const STATUS_LABEL: Record<string, string> = {
  open: 'Yeni',
  in_progress: 'Görüşmede',
  waiting_user: 'Cevap bekleniyor',
  closed: 'Kapalı',
};

const QUICK_LINKS = [
  { icon: HelpCircle, label: 'Sıkça Sorulan Sorular', href: '/sss', cls: 'text-emerald-600 bg-emerald-50' },
  { icon: Phone, label: 'Bizi arayın', href: '/contact', cls: 'text-blue-600 bg-blue-50' },
  { icon: Headphones, label: 'Sesli yardım al', href: '/contact', cls: 'text-violet-600 bg-violet-50' },
];

function formatRelativeTime(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'az önce';
  if (min < 60) return `${min} dk`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour} sa`;
  const day = Math.floor(hour / 24);
  if (day < 7) return `${day} gün`;
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
        <img src={url} alt={name || ''} className="max-h-40 rounded-xl border border-slate-200 shadow-sm" />
      </a>
    );
  }
  if (isVideo) return <video src={url} controls className="max-h-40 rounded-xl shadow-sm" />;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      download={name || undefined}
      className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 shadow-sm"
    >
      <FileText className="h-3.5 w-3.5 text-slate-500" />
      <span className="truncate max-w-[180px]">{name || 'Dosya'}</span>
    </a>
  );
}

export function FloatingSupportWidget() {
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [view, setView] = useState<'home' | 'list' | 'chat' | 'new'>('home');
  const [search, setSearch] = useState('');
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
      } catch { /* */ }
    };
    load();
    const id = setInterval(load, 6000);
    return () => { cancelled = true; clearInterval(id); };
  }, [open, view, activeId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length, view]);

  const filteredTickets = useMemo(() => {
    if (!search.trim()) return tickets;
    const q = search.toLowerCase();
    return tickets.filter((t) => t.subject.toLowerCase().includes(q));
  }, [tickets, search]);

  if (hide || isLoading) return null;

  const firstName = (user as { firstName?: string } | null)?.firstName
    || user?.email?.split('@')[0]
    || '';
  const greeting = firstName ? `Merhaba ${firstName} 👋` : 'Merhaba 👋';
  const recentTicket = tickets[0];

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

  // ─────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* FAB */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileTap={{ scale: 0.92 }}
        whileHover={{ scale: 1.05 }}
        className="fixed bottom-6 right-6 z-[9990] flex h-[60px] w-[60px] items-center justify-center rounded-full shadow-[0_20px_50px_-12px_rgba(16,185,129,0.65)]"
        style={{
          background: open
            ? 'linear-gradient(135deg, #1e293b, #0f172a)'
            : 'linear-gradient(135deg, #10b981 0%, #059669 50%, #0d9488 100%)',
        }}
        aria-label="Destek"
      >
        {/* Pulsing rings */}
        {!open && (
          <>
            <motion.span
              className="absolute inset-0 rounded-full bg-emerald-400"
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 1.6, opacity: 0 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
            />
            <motion.span
              className="absolute inset-0 rounded-full bg-emerald-400"
              initial={{ scale: 1, opacity: 0.4 }}
              animate={{ scale: 1.9, opacity: 0 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 0.7 }}
            />
          </>
        )}

        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="h-6 w-6 text-white" strokeWidth={2.5} />
            </motion.div>
          ) : (
            <motion.div key="msg" initial={{ rotate: -45, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 45, opacity: 0 }}>
              <MessageCircle className="h-7 w-7 text-white" strokeWidth={2.25} fill="currentColor" fillOpacity={0.12} />
            </motion.div>
          )}
        </AnimatePresence>

        {!open && unread > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 flex h-6 min-w-[24px] items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-600 px-1.5 text-[11px] font-bold text-white shadow-lg ring-[3px] ring-white"
          >
            {unread > 99 ? '99+' : unread}
          </motion.span>
        )}
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: 'spring', damping: 22, stiffness: 250 }}
            className="fixed bottom-[100px] right-6 z-[9991] flex h-[640px] max-h-[calc(100vh-130px)] w-[420px] max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.35)] backdrop-blur-xl"
          >
            {/* HEADER — premium mesh gradient */}
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-700" />
              <div className="absolute inset-0 opacity-40" style={{
                backgroundImage: `radial-gradient(circle at 20% 20%, #34d399 0%, transparent 40%),
                                  radial-gradient(circle at 80% 30%, #0ea5e9 0%, transparent 35%),
                                  radial-gradient(circle at 50% 90%, #fbbf24 0%, transparent 40%)`,
              }} />
              <div className="absolute inset-0 backdrop-blur-[60px]" />

              <div className="relative px-5 pt-5 pb-4">
                {/* Top row: back / title / agents */}
                {view !== 'home' && (
                  <button
                    onClick={() => {
                      if (view === 'chat') { setView('list'); setActiveId(null); }
                      else setView('home');
                    }}
                    className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-50 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Geri
                  </button>
                )}

                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {view === 'home' && (
                      <>
                        <h2 className="text-2xl font-extrabold text-white tracking-tight">{greeting}</h2>
                        <p className="mt-0.5 text-sm font-medium text-emerald-50/95">Size nasıl yardımcı olabiliriz?</p>
                      </>
                    )}
                    {view === 'list' && (
                      <>
                        <h2 className="text-xl font-bold text-white tracking-tight">Konuşmalarınız</h2>
                        <p className="mt-0.5 text-xs text-emerald-100/90">Tüm destek geçmişiniz</p>
                      </>
                    )}
                    {view === 'chat' && (
                      <>
                        <h2 className="truncate text-base font-bold text-white">{activeTicket?.subject || 'Sohbet'}</h2>
                        {activeTicket && (
                          <div className="mt-1 flex items-center gap-1.5">
                            <span className={`inline-block h-1.5 w-1.5 rounded-full ${STATUS_DOT[activeTicket.status]}`} />
                            <span className="text-[11px] text-emerald-100">{STATUS_LABEL[activeTicket.status]}</span>
                          </div>
                        )}
                      </>
                    )}
                    {view === 'new' && (
                      <>
                        <h2 className="text-xl font-bold text-white">Yeni Konuşma</h2>
                        <p className="mt-0.5 text-xs text-emerald-100">Konuyu yazın, hemen başlayalım</p>
                      </>
                    )}
                  </div>

                  {/* Agents stack (only on home) */}
                  {view === 'home' && (
                    <div className="flex shrink-0 -space-x-2">
                      {['#fbbf24', '#fb7185', '#60a5fa'].map((bg, i) => (
                        <div
                          key={i}
                          className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-extrabold text-white ring-[3px] ring-white/30 backdrop-blur"
                          style={{ background: bg }}
                        >
                          {['A', 'M', 'K'][i]}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Trust ribbon (home only) */}
                {view === 'home' && (
                  <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-white/95">
                    <span className="flex items-center gap-1">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300/80" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
                      </span>
                      Çevrimiçi
                    </span>
                    <span className="text-emerald-200/40">·</span>
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      ~5 dk yanıt
                    </span>
                    <span className="text-emerald-200/40">·</span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-amber-300 text-amber-300" />
                      4.9/5
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* CONTENT */}
            <div className="flex flex-1 flex-col overflow-hidden bg-slate-50/40">
              {!isAuthenticated ? (
                <UnauthedView pathname={pathname || '/'} />
              ) : view === 'home' ? (
                <HomeView
                  recentTicket={recentTicket}
                  loadingList={loadingList}
                  onOpenTicket={(t) => openTicket(t)}
                  onSeeAll={() => setView('list')}
                  onNew={() => setView('new')}
                />
              ) : view === 'list' ? (
                <ListView
                  tickets={filteredTickets}
                  search={search}
                  onSearch={setSearch}
                  loading={loadingList}
                  onOpen={openTicket}
                  onNew={() => setView('new')}
                />
              ) : view === 'new' ? (
                <NewView
                  draft={draft}
                  onChange={setDraft}
                  onSubmit={createTicket}
                  submitting={submittingNew}
                />
              ) : (
                <ChatView
                  scrollRef={scrollRef}
                  messages={messages}
                  activeTicket={activeTicket}
                  body={body}
                  onBodyChange={setBody}
                  onSend={sendMessage}
                  sending={sending}
                  pendingFile={pendingFile}
                  onClearFile={() => setPendingFile(null)}
                  onPickFile={() => fileInputRef.current?.click()}
                  fileInputRef={fileInputRef}
                  onFileSelected={(f) => uploadFile(f).catch(() => undefined)}
                />
              )}
            </div>

            {/* Footer (home only) */}
            {view === 'home' && (
              <div className="border-t border-slate-100 bg-white px-4 py-2.5">
                <p className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
                  <ShieldCheck className="h-3 w-3 text-emerald-600" />
                  Güvenli ve gizli · Destek altyapısı <span className="font-bold text-slate-600">NetTapu</span>
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SUB-VIEWS

function UnauthedView({ pathname }: { pathname: string }) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-50 to-emerald-100"
        >
          <Smile className="h-9 w-9 text-emerald-600" />
          <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-xs">✨</span>
        </motion.div>
        <p className="text-lg font-bold text-slate-900">Hoş geldiniz!</p>
        <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
          Hızlı yanıt ve konuşma geçmişiniz için ücretsiz hesap oluşturun.
        </p>
        <div className="mt-6 w-full space-y-2.5">
          <a
            href={`/login?returnTo=${encodeURIComponent(pathname)}`}
            className="block w-full rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 hover:shadow-xl hover:shadow-emerald-600/40 transition-all"
          >
            Giriş Yap
          </a>
          <a
            href={`/register?returnTo=${encodeURIComponent(pathname)}`}
            className="block w-full rounded-xl border-2 border-emerald-200 px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
          >
            Ücretsiz Üye Ol
          </a>
        </div>
      </div>
      <div className="border-t border-slate-100 bg-white px-5 py-3">
        <a href="/contact" className="flex items-center justify-between text-xs text-slate-600 hover:text-emerald-700 transition-colors">
          <span className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> Üye olmadan iletişim formu</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}

function HomeView({
  recentTicket,
  loadingList,
  onOpenTicket,
  onSeeAll,
  onNew,
}: {
  recentTicket?: Ticket;
  loadingList: boolean;
  onOpenTicket: (t: Ticket) => void;
  onSeeAll: () => void;
  onNew: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      {/* New conversation hero card */}
      <div className="px-4 pt-4">
        <motion.button
          onClick={onNew}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.99 }}
          className="group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl bg-white p-4 shadow-sm border border-slate-200/80 hover:shadow-md transition-shadow"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-md">
            <Plus className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="font-bold text-slate-900 text-sm">Yeni konuşma başlat</p>
            <p className="text-xs text-slate-500 mt-0.5">Sorunuzu yazın, ekibimiz hemen yanıtlasın</p>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </motion.button>
      </div>

      {/* Recent conversation */}
      {loadingList ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
        </div>
      ) : recentTicket ? (
        <div className="px-4 pt-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Son Konuşmanız</p>
            <button onClick={onSeeAll} className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800">
              Tümünü gör →
            </button>
          </div>
          <TicketCard t={recentTicket} onClick={() => onOpenTicket(recentTicket)} />
        </div>
      ) : null}

      {/* Quick links */}
      <div className="px-4 pt-5">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Hızlı Erişim</p>
        <div className="space-y-1.5">
          {QUICK_LINKS.map((q) => {
            const I = q.icon;
            return (
              <a
                key={q.label}
                href={q.href}
                className="group flex items-center gap-3 rounded-xl bg-white px-3.5 py-2.5 shadow-sm border border-slate-200/70 hover:border-emerald-300 hover:shadow-md transition-all"
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${q.cls}`}>
                  <I className="h-4 w-4" strokeWidth={2.25} />
                </div>
                <span className="flex-1 text-sm font-semibold text-slate-700">{q.label}</span>
                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
              </a>
            );
          })}
        </div>
      </div>

      <div className="flex-1" />
    </div>
  );
}

function ListView({
  tickets,
  search,
  onSearch,
  loading,
  onOpen,
  onNew,
}: {
  tickets: Ticket[];
  search: string;
  onSearch: (q: string) => void;
  loading: boolean;
  onOpen: (t: Ticket) => void;
  onNew: () => void;
}) {
  return (
    <>
      {/* Search */}
      <div className="border-b border-slate-100 bg-white px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Konuşmalarda ara…"
            className="w-full rounded-xl bg-slate-100 pl-9 pr-3 py-2 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
          </div>
        ) : tickets.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-400">
            {search ? 'Eşleşen konuşma yok' : 'Henüz konuşmanız yok'}
          </p>
        ) : (
          <div className="space-y-1.5">
            {tickets.map((t) => (
              <TicketCard key={t.id} t={t} onClick={() => onOpen(t)} />
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 bg-white p-3">
        <button
          onClick={onNew}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 hover:shadow-xl transition-all"
        >
          <Plus className="h-4 w-4" />
          Yeni Konuşma
        </button>
      </div>
    </>
  );
}

function TicketCard({ t, onClick }: { t: Ticket; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.99 }}
      className="group flex w-full items-center gap-3 rounded-2xl bg-white px-3.5 py-3 shadow-sm border border-slate-200/80 hover:border-emerald-300 hover:shadow-md transition-all text-left"
    >
      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-700 font-bold text-sm shadow-inner">
        {t.subject.charAt(0).toUpperCase()}
        <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-white ${STATUS_DOT[t.status]}`} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-bold text-slate-900">{t.subject}</p>
          {t.unreadUser > 0 && (
            <span className="shrink-0 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{t.unreadUser}</span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500">
          <span>{STATUS_LABEL[t.status]}</span>
          <span className="text-slate-300">·</span>
          <span>{formatRelativeTime(t.lastMessageAt || t.createdAt)}</span>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
    </motion.button>
  );
}

function NewView({
  draft,
  onChange,
  onSubmit,
  submitting,
}: {
  draft: { subject: string; initialMessage: string };
  onChange: (d: { subject: string; initialMessage: string }) => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  return (
    <div className="flex flex-1 flex-col p-4">
      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Konu</label>
          <input
            value={draft.subject}
            onChange={(e) => onChange({ ...draft, subject: e.target.value })}
            placeholder="Örn. Depozito iadesi"
            className="mt-1.5 w-full rounded-xl border-2 border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none transition-colors"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Mesajınız</label>
          <textarea
            value={draft.initialMessage}
            onChange={(e) => onChange({ ...draft, initialMessage: e.target.value })}
            rows={7}
            placeholder="Detayları yazın…"
            className="mt-1.5 w-full resize-none rounded-xl border-2 border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none transition-colors"
          />
        </div>
      </div>
      <div className="mt-auto pt-4">
        <button
          onClick={onSubmit}
          disabled={!draft.subject.trim() || submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 hover:shadow-xl transition-all disabled:opacity-40 disabled:shadow-none"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Gönder
        </button>
      </div>
    </div>
  );
}

function ChatView({
  scrollRef,
  messages,
  activeTicket,
  body,
  onBodyChange,
  onSend,
  sending,
  pendingFile,
  onClearFile,
  onPickFile,
  fileInputRef,
  onFileSelected,
}: {
  scrollRef: React.RefObject<HTMLDivElement>;
  messages: Message[];
  activeTicket: Ticket | null;
  body: string;
  onBodyChange: (s: string) => void;
  onSend: () => void;
  sending: boolean;
  pendingFile: { url: string; name: string; type: string } | null;
  onClearFile: () => void;
  onPickFile: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileSelected: (f: File) => void;
}) {
  return (
    <>
      <div ref={scrollRef} className="flex-1 space-y-2.5 overflow-y-auto px-3 py-4">
        {messages.length === 0 ? (
          <p className="py-8 text-center text-xs text-slate-400">Henüz mesaj yok</p>
        ) : (
          messages.map((m, idx) => {
            if (m.senderRole === 'system') {
              return (
                <div key={m.id} className="flex justify-center my-2">
                  <span className="rounded-full bg-white border border-slate-200 px-3 py-1 text-[10px] font-medium text-slate-500 shadow-sm">
                    {m.body}
                  </span>
                </div>
              );
            }
            const mine = m.senderRole === 'user';
            const prev = messages[idx - 1];
            const showAvatar = !mine && (!prev || prev.senderRole !== m.senderRole);
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-end gap-1.5 ${mine ? 'justify-end' : 'justify-start'}`}
              >
                {!mine && (
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-[10px] font-bold text-white ring-[2px] ring-white shadow-md ${showAvatar ? '' : 'invisible'}`}>
                    NT
                  </div>
                )}
                <div className={`max-w-[78%] rounded-2xl px-3.5 py-2 shadow-sm ${
                  mine
                    ? 'bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-br-md'
                    : 'bg-white border border-slate-200/80 text-slate-900 rounded-bl-md'
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
                  <div className={`flex items-center justify-end gap-1 mt-0.5 text-[9px] ${mine ? 'text-emerald-100/90' : 'text-slate-400'}`}>
                    <span>{formatTime(m.createdAt)}</span>
                    {mine && (m.readAt ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />)}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {activeTicket?.status === 'closed' ? (
        <div className="border-t border-slate-200 bg-white p-3 text-center text-xs text-slate-500">
          Bu konuşma kapatıldı. Yeni bir konuşma başlatabilirsiniz.
        </div>
      ) : (
        <div className="border-t border-slate-200/80 bg-white p-3">
          {pendingFile && (
            <div className="mb-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              {pendingFile.type.startsWith('image/') ? <ImageIcon className="h-3.5 w-3.5 text-slate-500" /> : pendingFile.type.startsWith('video/') ? <VideoIcon className="h-3.5 w-3.5 text-slate-500" /> : <FileText className="h-3.5 w-3.5 text-slate-500" />}
              <span className="text-xs text-slate-600 truncate flex-1">{pendingFile.name}</span>
              <button onClick={onClearFile} className="text-slate-400 hover:text-slate-600">
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          <div className="flex items-end gap-1.5">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFileSelected(f);
                e.target.value = '';
              }}
            />
            <button
              onClick={onPickFile}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <textarea
              value={body}
              onChange={(e) => onBodyChange(e.target.value)}
              placeholder="Mesajınızı yazın…"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onSend();
                }
              }}
              className="max-h-24 flex-1 resize-none rounded-2xl bg-slate-100 px-3.5 py-2 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onSend}
              disabled={sending || (!body.trim() && !pendingFile)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-40 disabled:shadow-none"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </motion.button>
          </div>
        </div>
      )}
    </>
  );
}

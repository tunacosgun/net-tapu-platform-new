'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import apiClient from '@/lib/api-client';
import {
  Search,
  Send,
  Paperclip,
  Check,
  CheckCheck,
  AlertCircle,
  X,
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
  CircleSlash,
  Inbox,
} from 'lucide-react';

type TicketRow = {
  id: string;
  subject: string;
  status: 'open' | 'in_progress' | 'waiting_user' | 'closed';
  source: 'direct' | 'contact' | 'consultant_application' | 'parcel_inquiry';
  unreadAdmin: number;
  unreadUser: number;
  lastMessageAt: string | null;
  createdAt: string;
  userDisplayName: string;
  userEmail: string | null;
};

type Message = {
  id: string;
  ticketId: string;
  senderRole: 'user' | 'admin' | 'system' | 'consultant';
  body: string | null;
  attachmentUrl: string | null;
  attachmentType: string | null;
  attachmentName: string | null;
  readAt: string | null;
  createdAt: string;
};

type FullTicket = {
  ticket: TicketRow;
  messages: Message[];
  user: { name: string; email: string | null; phone: string | null };
};

const SOURCE_LABEL: Record<string, string> = {
  direct: 'Doğrudan',
  contact: 'İletişim Formu',
  consultant_application: 'Danışman Başvurusu',
  parcel_inquiry: 'İlan Sorgusu',
};

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  open: { label: 'Yeni', cls: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'Görüşmede', cls: 'bg-amber-100 text-amber-700' },
  waiting_user: { label: 'Cevap Bekliyor', cls: 'bg-violet-100 text-violet-700' },
  closed: { label: 'Kapalı', cls: 'bg-slate-200 text-slate-600' },
};

function formatTime(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
}

function MessageAttachment({ url, type, name }: { url: string; type: string | null; name: string | null }) {
  const isImage = (type || '').startsWith('image/');
  const isVideo = (type || '').startsWith('video/');
  if (isImage) {
    return (
      <a href={url} target="_blank" rel="noreferrer">
        <img src={url} alt={name || ''} className="max-h-48 rounded-lg border border-slate-200" />
      </a>
    );
  }
  if (isVideo) {
    return <video src={url} controls className="max-h-48 rounded-lg" />;
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      download={name || undefined}
      className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
    >
      <FileText className="h-4 w-4 text-slate-500" />
      <span className="truncate max-w-[200px]">{name || 'Dosya'}</span>
    </a>
  );
}

export default function AdminSupportPage() {
  const searchParams = useSearchParams();
  const ticketParam = searchParams.get('ticket');
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'waiting_user' | 'closed'>('all');
  const [search, setSearch] = useState('');
  const [active, setActive] = useState<FullTicket | null>(null);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [pendingFile, setPendingFile] = useState<{ url: string; name: string; type: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const loadList = useCallback(async () => {
    const { data } = await apiClient.get<TicketRow[]>('/admin/support/tickets', {
      params: { status: filter, search: search || undefined },
    });
    setTickets(Array.isArray(data) ? data : []);
  }, [filter, search]);

  useEffect(() => { loadList(); }, [loadList]);

  // Auto-open a ticket if the URL was deep-linked with ?ticket=<id>
  // (e.g. coming from the contacts page "Görüşmeyi Başlat" button).
  useEffect(() => {
    if (!ticketParam || active?.ticket.id === ticketParam) return;
    apiClient
      .get<FullTicket>(`/admin/support/tickets/${ticketParam}`)
      .then(({ data }) => {
        setActive(data);
        apiClient.post(`/admin/support/tickets/${ticketParam}/read`).catch(() => undefined);
      })
      .catch(() => undefined);
  }, [ticketParam, active]);

  // Polling: every 8s refresh the list, and if a ticket is open, refresh the
  // thread too. Simple, robust; we can replace with WS in a follow-up.
  useEffect(() => {
    const id = setInterval(() => {
      loadList();
      if (active) {
        apiClient
          .get<FullTicket>(`/admin/support/tickets/${active.ticket.id}`)
          .then(({ data }) => setActive(data))
          .catch(() => undefined);
      }
    }, 8000);
    return () => clearInterval(id);
  }, [loadList, active]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [active?.messages.length, active?.ticket.id]);

  async function openTicket(t: TicketRow) {
    const { data } = await apiClient.get<FullTicket>(`/admin/support/tickets/${t.id}`);
    setActive(data);
    setPendingFile(null);
    setBody('');
    // Mark read; refresh list to clear badge.
    await apiClient.post(`/admin/support/tickets/${t.id}/read`).catch(() => undefined);
    loadList();
  }

  async function uploadFile(file: File) {
    const fd = new FormData();
    fd.append('file', file);
    const { data } = await apiClient.post<{ url: string; filename: string; mimetype: string }>('/support/attachments', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    setPendingFile({ url: data.url, name: data.filename, type: data.mimetype });
  }

  async function sendMessage() {
    if (!active) return;
    const text = body.trim();
    if (!text && !pendingFile) return;
    setSending(true);
    try {
      await apiClient.post(`/admin/support/tickets/${active.ticket.id}/messages`, {
        body: text || undefined,
        attachmentUrl: pendingFile?.url,
        attachmentType: pendingFile?.type,
        attachmentName: pendingFile?.name,
      });
      setBody('');
      setPendingFile(null);
      const { data } = await apiClient.get<FullTicket>(`/admin/support/tickets/${active.ticket.id}`);
      setActive(data);
      loadList();
    } finally {
      setSending(false);
    }
  }

  async function setStatus(s: 'in_progress' | 'waiting_user' | 'closed' | 'open') {
    if (!active) return;
    await apiClient.patch(`/admin/support/tickets/${active.ticket.id}/status`, { status: s });
    const { data } = await apiClient.get<FullTicket>(`/admin/support/tickets/${active.ticket.id}`);
    setActive(data);
    loadList();
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: tickets.length };
    for (const t of tickets) c[t.status] = (c[t.status] || 0) + 1;
    return c;
  }, [tickets]);

  return (
    <div className="flex h-[calc(100vh-120px)] gap-4">
      {/* LEFT: Conversation list */}
      <aside className="w-80 shrink-0 flex flex-col rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-200 p-3 space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Arama: isim, e-posta, konu"
              className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div className="flex gap-1 overflow-x-auto">
            {(['all', 'open', 'in_progress', 'waiting_user', 'closed'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap ${
                  filter === s
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s === 'all' ? 'Tümü' : STATUS_LABEL[s].label}
                {counts[s] ? ` (${counts[s]})` : ''}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {tickets.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">
              <Inbox className="mx-auto h-8 w-8 text-slate-300 mb-2" />
              Talep yok
            </div>
          ) : (
            tickets.map((t) => {
              const isActive = active?.ticket.id === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => openTicket(t)}
                  className={`w-full text-left p-3 border-b border-slate-100 hover:bg-slate-50 transition-colors ${isActive ? 'bg-emerald-50' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-slate-900 truncate">{t.userDisplayName}</p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{t.subject}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[10px] text-slate-400">{formatTime(t.lastMessageAt || t.createdAt)}</span>
                      {t.unreadAdmin > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white min-w-[18px] text-center">
                          {t.unreadAdmin}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${STATUS_LABEL[t.status].cls}`}>
                      {STATUS_LABEL[t.status].label}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-500">
                      {SOURCE_LABEL[t.source] || t.source}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* RIGHT: Chat panel */}
      <section className="flex-1 flex flex-col rounded-2xl border border-slate-200 bg-white overflow-hidden">
        {!active ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <Inbox className="h-8 w-8 text-slate-400" />
            </div>
            <p className="font-semibold text-slate-900">Sohbet seçin</p>
            <p className="text-sm text-slate-500 mt-1">Sol panelden bir destek talebi seçerek mesajlaşmaya başlayın.</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 bg-slate-50/50">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900 truncate">{active.user.name}</p>
                <p className="text-xs text-slate-500 truncate">
                  {active.user.email || '—'} {active.user.phone ? `· ${active.user.phone}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_LABEL[active.ticket.status].cls}`}>
                  {STATUS_LABEL[active.ticket.status].label}
                </span>
                <select
                  value={active.ticket.status}
                  onChange={(e) => setStatus(e.target.value as 'in_progress' | 'waiting_user' | 'closed' | 'open')}
                  className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600"
                >
                  <option value="open">Yeni</option>
                  <option value="in_progress">Görüşmede</option>
                  <option value="waiting_user">Cevap Bekliyor</option>
                  <option value="closed">Kapat</option>
                </select>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
              {active.messages.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-8">Henüz mesaj yok</p>
              ) : (
                active.messages.map((m) => {
                  if (m.senderRole === 'system') {
                    return (
                      <div key={m.id} className="flex justify-center">
                        <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                          <AlertCircle className="h-3 w-3" />
                          {m.body}
                        </span>
                      </div>
                    );
                  }
                  const isAdmin = m.senderRole === 'admin' || m.senderRole === 'consultant';
                  return (
                    <div key={m.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[70%] rounded-2xl px-3.5 py-2 shadow-sm ${
                          isAdmin
                            ? 'bg-emerald-600 text-white rounded-br-sm'
                            : 'bg-white text-slate-900 border border-slate-200 rounded-bl-sm'
                        }`}
                      >
                        {m.body && <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>}
                        {m.attachmentUrl && (
                          <div className={m.body ? 'mt-2' : ''}>
                            <MessageAttachment url={m.attachmentUrl} type={m.attachmentType} name={m.attachmentName} />
                          </div>
                        )}
                        <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isAdmin ? 'text-emerald-100' : 'text-slate-400'}`}>
                          <span>{formatTime(m.createdAt)}</span>
                          {isAdmin && (m.readAt ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Reply box */}
            {active.ticket.status === 'closed' ? (
              <div className="border-t border-slate-200 p-3 bg-slate-50 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
                <CircleSlash className="h-4 w-4" />
                Bu talep kapatıldı. Yeniden açmak için yukarıdan &quot;Görüşmede&quot; seçin.
              </div>
            ) : (
              <div className="border-t border-slate-200 p-3 bg-white">
                {pendingFile && (
                  <div className="mb-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    {pendingFile.type.startsWith('image/') ? <ImageIcon className="h-4 w-4 text-slate-500" /> : pendingFile.type.startsWith('video/') ? <VideoIcon className="h-4 w-4 text-slate-500" /> : <FileText className="h-4 w-4 text-slate-500" />}
                    <span className="text-xs text-slate-600 truncate flex-1">{pendingFile.name}</span>
                    <button onClick={() => setPendingFile(null)} className="text-slate-400 hover:text-slate-600">
                      <X className="h-3.5 w-3.5" />
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
                    className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
                    title="Dosya ekle"
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
                    className="flex-1 resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 max-h-32"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sending || (!body.trim() && !pendingFile)}
                    className="rounded-lg bg-emerald-600 p-2 text-white hover:bg-emerald-700 disabled:opacity-40"
                    title="Gönder"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

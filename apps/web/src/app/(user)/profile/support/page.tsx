'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import apiClient from '@/lib/api-client';
import {
  Plus,
  Send,
  Paperclip,
  Check,
  CheckCheck,
  AlertCircle,
  X,
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
  MessageSquare,
  CircleSlash,
} from 'lucide-react';

type Ticket = {
  id: string;
  subject: string;
  status: 'open' | 'in_progress' | 'waiting_user' | 'closed';
  source: string;
  unreadUser: number;
  lastMessageAt: string | null;
  createdAt: string;
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

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  open: { label: 'Yeni', cls: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'Görüşmede', cls: 'bg-amber-100 text-amber-700' },
  waiting_user: { label: 'Sizden Cevap Bekleniyor', cls: 'bg-violet-100 text-violet-700' },
  closed: { label: 'Kapalı', cls: 'bg-slate-200 text-slate-600' },
};

function formatTime(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay
    ? d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
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
  if (isVideo) return <video src={url} controls className="max-h-48 rounded-lg" />;
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

export default function UserSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [pendingFile, setPendingFile] = useState<{ url: string; name: string; type: string } | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ subject: '', initialMessage: '' });
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const loadList = useCallback(async () => {
    const { data } = await apiClient.get<Ticket[]>('/support/tickets');
    setTickets(Array.isArray(data) ? data : []);
  }, []);

  const loadActive = useCallback(async (id: string) => {
    const { data } = await apiClient.get<{ ticket: Ticket; messages: Message[] }>(`/support/tickets/${id}`);
    setActiveTicket(data.ticket);
    setMessages(data.messages);
    await apiClient.post(`/support/tickets/${id}/read`).catch(() => undefined);
    loadList();
  }, [loadList]);

  useEffect(() => { loadList(); }, [loadList]);

  useEffect(() => {
    if (!activeId) return;
    loadActive(activeId);
    const id = setInterval(() => loadActive(activeId), 8000);
    return () => clearInterval(id);
  }, [activeId, loadActive]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length, activeId]);

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
      await loadActive(activeId);
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
    setCreating(false);
    await loadList();
    setActiveId(data.id);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 h-[calc(100vh-180px)]">
      {/* Tickets list */}
      <aside className="flex flex-col rounded-2xl border border-[var(--border)] bg-white overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 p-3">
          <h2 className="font-bold text-sm text-slate-900">Destek Taleplerim</h2>
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-1 rounded-lg bg-emerald-600 text-white px-2.5 py-1.5 text-xs font-semibold hover:bg-emerald-700"
          >
            <Plus className="h-3.5 w-3.5" />
            Yeni
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {tickets.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">
              <MessageSquare className="mx-auto h-8 w-8 text-slate-300 mb-2" />
              Henüz destek talebiniz yok
            </div>
          ) : (
            tickets.map((t) => {
              const isActive = activeId === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveId(t.id)}
                  className={`w-full text-left p-3 border-b border-slate-100 hover:bg-slate-50 ${isActive ? 'bg-emerald-50' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-sm text-slate-900 truncate flex-1">{t.subject}</p>
                    {t.unreadUser > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white">{t.unreadUser}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${STATUS_LABEL[t.status].cls}`}>
                      {STATUS_LABEL[t.status].label}
                    </span>
                    <span className="text-[10px] text-slate-400">{formatTime(t.lastMessageAt || t.createdAt)}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Chat panel */}
      <section className="flex flex-col rounded-2xl border border-[var(--border)] bg-white overflow-hidden">
        {creating ? (
          <div className="flex-1 p-6">
            <h2 className="font-bold text-lg text-slate-900 mb-1">Yeni Destek Talebi</h2>
            <p className="text-xs text-slate-500 mb-4">Sorununuzu ekibimize iletin. En kısa sürede dönüş yapacağız.</p>
            <div className="space-y-3 max-w-lg">
              <div>
                <label className="text-xs font-semibold text-slate-700">Konu</label>
                <input
                  value={draft.subject}
                  onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
                  placeholder="Örn. Depozito iadesi hakkında"
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
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={createTicket}
                  disabled={!draft.subject.trim()}
                  className="rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm font-semibold hover:bg-emerald-700 disabled:opacity-40"
                >
                  Oluştur
                </button>
                <button onClick={() => setCreating(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm">
                  İptal
                </button>
              </div>
            </div>
          </div>
        ) : !activeId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <MessageSquare className="h-8 w-8 text-slate-400" />
            </div>
            <p className="font-semibold text-slate-900">Bir talep seçin veya yeni başlatın</p>
            <p className="text-sm text-slate-500 mt-1">Soldaki listeden bir konuşma seçebilir ya da &quot;Yeni&quot; butonu ile destek talebi açabilirsiniz.</p>
          </div>
        ) : (
          <>
            <div className="border-b border-slate-200 px-4 py-3 bg-slate-50/50">
              <p className="font-semibold text-slate-900 truncate">{activeTicket?.subject}</p>
              <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_LABEL[activeTicket?.status || 'open'].cls}`}>
                {STATUS_LABEL[activeTicket?.status || 'open'].label}
              </span>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
              {messages.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-8">Henüz mesaj yok</p>
              ) : (
                messages.map((m) => {
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
                  const isMine = m.senderRole === 'user';
                  return (
                    <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-2xl px-3.5 py-2 shadow-sm ${isMine ? 'bg-emerald-600 text-white rounded-br-sm' : 'bg-white text-slate-900 border border-slate-200 rounded-bl-sm'}`}>
                        {!isMine && (
                          <p className="text-[10px] font-bold text-emerald-700 mb-0.5">Destek Ekibi</p>
                        )}
                        {m.body && <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>}
                        {m.attachmentUrl && (
                          <div className={m.body ? 'mt-2' : ''}>
                            <MessageAttachment url={m.attachmentUrl} type={m.attachmentType} name={m.attachmentName} />
                          </div>
                        )}
                        <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isMine ? 'text-emerald-100' : 'text-slate-400'}`}>
                          <span>{formatTime(m.createdAt)}</span>
                          {isMine && (m.readAt ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {activeTicket?.status === 'closed' ? (
              <div className="border-t border-slate-200 p-3 bg-slate-50 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
                <CircleSlash className="h-4 w-4" />
                Bu talep kapatıldı. Yeni bir talep oluşturabilirsiniz.
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
                  <button onClick={() => fileInputRef.current?.click()} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50">
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

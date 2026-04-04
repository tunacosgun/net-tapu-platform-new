'use client';

import { useEffect, useState, useRef } from 'react';
import apiClient from '@/lib/api-client';
import { formatDate } from '@/lib/format';
import { Bell, Trophy, TrendingUp, TrendingDown, CheckCircle, Clock, User, CreditCard, RotateCcw, Package } from 'lucide-react';

interface AdminNotification {
  id: string;
  title: string;
  body: string;
  type?: string;
  template?: string;
  channel?: string;
  readAt?: string | null;
  isRead?: boolean;
  createdAt: string;
}

function notifIcon(template?: string, type?: string) {
  const t = template || type || '';
  if (t.includes('won'))       return { icon: Trophy,       bg: 'bg-amber-100',   color: 'text-amber-600' };
  if (t.includes('bid'))       return { icon: TrendingUp,   bg: 'bg-brand-50',    color: 'text-brand-600' };
  if (t.includes('outbid'))    return { icon: TrendingDown,  bg: 'bg-rose-100',    color: 'text-rose-600' };
  if (t.includes('deposit'))   return { icon: Package,       bg: 'bg-blue-100',    color: 'text-blue-600' };
  if (t.includes('payment'))   return { icon: CreditCard,    bg: 'bg-brand-50',    color: 'text-brand-600' };
  if (t.includes('refund'))    return { icon: RotateCcw,     bg: 'bg-slate-100',   color: 'text-slate-600' };
  if (t.includes('register'))  return { icon: User,          bg: 'bg-purple-100',  color: 'text-purple-600' };
  if (t.includes('starting'))  return { icon: Clock,         bg: 'bg-amber-100',   color: 'text-amber-600' };
  if (t.includes('auction'))   return { icon: CheckCircle,   bg: 'bg-brand-50',    color: 'text-brand-600' };
  return                               { icon: Bell,          bg: 'bg-slate-100',   color: 'text-slate-500' };
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  async function fetchNotifications() {
    try {
      const { data } = await apiClient.get('/notifications', { params: { limit: 20 } });
      const items: AdminNotification[] = data.data || data || [];
      setNotifications(items);
      setUnreadCount(items.filter((n) => !n.isRead && !n.readAt).length);
    } catch {
      // silently fail
    }
  }

  useEffect(() => {
    fetchNotifications();
    const iv = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
    setUnreadCount(0);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative flex items-center justify-center w-8 h-8 rounded-full hover:bg-[var(--muted)] transition-colors"
        title="Bildirimler"
      >
        <Bell className="h-4 w-4 text-[var(--foreground)]" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-[380px] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-slate-900">Bildirimler</h3>
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center h-5 min-w-[20px] rounded-full bg-brand-500 px-1.5 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-brand-600 hover:text-brand-700 font-medium hover:underline">
                Tümünü okundu işaretle
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-50">
            {notifications.length === 0 ? (
              <div className="py-14 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                  <Bell className="h-5 w-5 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-600">Henüz bildirim yok</p>
                <p className="mt-1 text-xs text-slate-400">Yeni bildirimler burada görünecek</p>
              </div>
            ) : (
              notifications.map((n) => {
                const { icon: Icon, bg, color } = notifIcon(n.template, n.type);
                const isUnread = !n.isRead && !n.readAt;
                return (
                  <div
                    key={n.id}
                    className={`flex gap-3 px-4 py-3.5 transition-colors hover:bg-slate-50 ${isUnread ? 'bg-brand-50/30' : ''}`}
                  >
                    {/* Icon */}
                    <div className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${bg}`}>
                      <Icon className={`h-4 w-4 ${color}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm leading-snug ${isUnread ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                          {n.title || 'Bildirim'}
                        </p>
                        {isUnread && (
                          <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-brand-500" />
                        )}
                      </div>
                      {n.body && (
                        <p className="mt-0.5 text-xs text-slate-500 leading-relaxed line-clamp-2">{n.body}</p>
                      )}
                      <p className="mt-1.5 text-[10px] font-medium text-slate-400">
                        {formatDate(n.createdAt, 'datetime')}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-slate-100 bg-slate-50 px-4 py-2.5 text-center">
              <a href="/admin/notifications" className="text-xs font-medium text-brand-600 hover:text-brand-700 hover:underline">
                Tüm bildirimleri gör →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

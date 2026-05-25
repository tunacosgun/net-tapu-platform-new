'use client';

import { useConnectionStore, type ConnectionStatus } from '@/stores/connection-store';
import { connectToAuction, disconnectFromAuction } from '@/lib/ws-client';
import { useAuctionStore } from '@/stores/auction-store';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';

const labels: Record<ConnectionStatus, string> = {
  connected: 'Bağlı',
  connecting: 'Bağlanıyor...',
  reconnecting: 'Yeniden bağlanıyor...',
  disconnected: 'Bağlantı kesildi',
};

const colors: Record<ConnectionStatus, string> = {
  connected: 'bg-green-500',
  connecting: 'bg-yellow-500',
  reconnecting: 'bg-yellow-500',
  disconnected: 'bg-red-500',
};

type Props = {
  /** Optional: when provided, shows a manual reconnect button if WS is not connected */
  auctionId?: string;
};

export function ConnectionStatus({ auctionId }: Props) {
  const status = useConnectionStore((s) => s.status);
  const setStatus = useConnectionStore((s) => s.setStatus);
  const [retrying, setRetrying] = useState(false);

  const canRetry = auctionId && status !== 'connected' && status !== 'connecting';

  async function handleRetry() {
    if (!auctionId) return;
    setRetrying(true);
    try {
      disconnectFromAuction();
      // Small delay to let socket cleanup fully
      await new Promise((r) => setTimeout(r, 400));
      // Reset auction store state so we get a fresh initial AUCTION_STATE
      useAuctionStore.getState().reset?.();
      connectToAuction(auctionId);
    } catch {
      setStatus('disconnected');
    } finally {
      setTimeout(() => setRetrying(false), 600);
    }
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={`inline-block h-2 w-2 rounded-full ${colors[status]} ${status === 'connecting' || status === 'reconnecting' ? 'animate-pulse' : ''}`} />
      <span className="text-[var(--muted-foreground)]">{labels[status]}</span>
      {canRetry && (
        <button
          onClick={handleRetry}
          disabled={retrying}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold text-brand-700 hover:bg-brand-50 disabled:opacity-50"
          title="Yeniden bağlan"
        >
          <RefreshCw className={`h-3 w-3 ${retrying ? 'animate-spin' : ''}`} />
          Tekrar Dene
        </button>
      )}
    </div>
  );
}

interface LoadingStateProps {
  message?: string;
  centered?: boolean;
}

export function LoadingState({ message = 'Yükleniyor...', centered = true }: LoadingStateProps) {
  return (
    <div className={`flex flex-col items-center gap-3 ${centered ? 'justify-center py-20' : 'py-8'}`}>
      <div className="relative h-8 w-8">
        <div className="absolute inset-0 rounded-full border-2 border-[var(--border)]" />
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[var(--brand)]" />
      </div>
      <p className="text-sm text-[var(--muted-foreground)]">{message}</p>
    </div>
  );
}

import type { CSSProperties } from 'react';

function Bone({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return <div className={`skeleton ${className}`} style={style} />;
}

export function TableSkeleton({ rows = 6, cols: _cols }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Bone className="h-5 w-40" />
          <Bone className="h-3.5 w-64" />
        </div>
        <Bone className="h-8 w-24 rounded-md" />
      </div>
      <div className="table-container">
        <div className="border-b border-[var(--border)] bg-[var(--background-subtle)] px-4 py-3 flex gap-6">
          {[100, 140, 80, 100, 70].map((w, i) => (
            <Bone key={i} className={`h-3`} style={{ width: w }} />
          ))}
        </div>
        <div className="divide-y divide-[var(--border-subtle)]">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-6 px-4 py-3.5">
              <Bone className="h-4 w-24" />
              <Bone className="h-4 w-36" />
              <Bone className="h-4 w-20" />
              <Bone className="h-4 w-24" />
              <Bone className="h-5 w-14 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Skeleton for detail pages (parcel/auction) */
export function DetailPageSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 animate-pulse">
      <div className="flex gap-1.5 mb-6 items-center">
        <Bone className="h-3 w-14" />
        <span className="text-slate-300 text-xs">/</span>
        <Bone className="h-3 w-18" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-3">
          <Bone className="h-[360px] w-full rounded-2xl" />
          <div className="flex gap-2">
            {[1,2,3,4].map(i => <Bone key={i} className="h-16 w-16 rounded-lg" />)}
          </div>
        </div>
        <div className="space-y-4">
          <Bone className="h-6 w-3/4" />
          <Bone className="h-4 w-1/2" />
          <Bone className="h-11 w-full rounded-xl mt-4" />
          <div className="space-y-3 mt-4">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="flex justify-between">
                <Bone className="h-3.5 w-24" />
                <Bone className="h-3.5 w-28" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

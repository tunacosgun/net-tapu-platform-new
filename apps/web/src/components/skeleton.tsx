import type { CSSProperties } from 'react';

function Bone({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return <div className={`skeleton ${className}`} style={style} />;
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <Bone className={className} />;
}

export function CardSkeleton() {
  return (
    <div className="card p-4 space-y-3">
      <Bone className="h-4 w-3/4" />
      <Bone className="h-3 w-1/2" />
      <div className="flex justify-between pt-2">
        <Bone className="h-6 w-24" />
        <Bone className="h-3.5 w-16" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-5">
      {/* Header area */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Bone className="h-5 w-40" />
          <Bone className="h-3.5 w-56" />
        </div>
        <Bone className="h-8 w-24 rounded-md" />
      </div>

      {/* Table */}
      <div className="table-container">
        <div className="border-b border-[var(--border)] bg-[var(--background-subtle)] px-4 py-3 flex gap-6">
          {[90, 130, 80, 100, 64].map((w, i) => (
            <Bone key={i} className="h-3" style={{ width: w }} />
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

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Bone className="h-6 w-44" />
        <Bone className="h-3.5 w-72" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-4 space-y-2">
            <Bone className="h-3 w-20" />
            <Bone className="h-7 w-16" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

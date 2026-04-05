interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | '…')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('…');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('…');
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-center gap-1 py-4">
      <button
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="btn btn-secondary btn-sm disabled:opacity-40"
      >
        ←
      </button>

      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`el-${i}`} className="w-8 text-center text-xs text-[var(--muted-foreground)]">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p as number)}
            className={[
              'h-7 w-7 rounded-md text-xs font-medium transition-colors',
              p === page
                ? 'bg-[var(--brand)] text-white'
                : 'hover:bg-[var(--muted)] text-[var(--muted-foreground)]',
            ].join(' ')}
          >
            {p}
          </button>
        )
      )}

      <button
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="btn btn-secondary btn-sm disabled:opacity-40"
      >
        →
      </button>
    </div>
  );
}

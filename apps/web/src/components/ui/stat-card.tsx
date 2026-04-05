import { type ReactNode } from 'react';

const variantMap = {
  default: { value: 'text-[var(--foreground)]',  icon: 'bg-[var(--muted)] text-[var(--muted-foreground)]' },
  success: { value: 'text-green-700',             icon: 'bg-green-50 text-green-600' },
  info:    { value: 'text-blue-700',              icon: 'bg-blue-50 text-blue-600' },
  warning: { value: 'text-amber-700',             icon: 'bg-amber-50 text-amber-600' },
  danger:  { value: 'text-red-700',               icon: 'bg-red-50 text-red-600' },
  brand:   { value: 'text-[var(--brand)]',        icon: 'bg-[var(--brand-light)] text-[var(--brand)]' },
} as const;

interface StatCardProps {
  label: string;
  value: string | number;
  variant?: keyof typeof variantMap;
  icon?: ReactNode;
  trend?: { value: string; up?: boolean };
  className?: string;
}

export function StatCard({ label, value, variant = 'default', icon, trend, className = '' }: StatCardProps) {
  const colors = variantMap[variant];
  return (
    <div className={`card p-4 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-[var(--muted-foreground)] truncate">{label}</p>
          <p className={`mt-1.5 text-2xl font-bold tracking-tight ${colors.value}`}>{value}</p>
          {trend && (
            <p className={`mt-1 flex items-center gap-1 text-xs font-medium ${trend.up !== false ? 'text-green-600' : 'text-red-600'}`}>
              <span>{trend.up !== false ? '↑' : '↓'}</span>
              {trend.value}
            </p>
          )}
        </div>
        {icon && (
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${colors.icon}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

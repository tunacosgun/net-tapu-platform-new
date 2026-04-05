import { type ReactNode } from 'react';

const variantClasses = {
  default:       'badge-default',
  success:       'badge-success',
  warning:       'badge-warning',
  danger:        'badge-danger',
  info:          'badge-info',
  brand:         'badge-brand',
  // Parcel status aliases
  active:        'badge-success',
  sold:          'badge-danger',
  deposit_taken: 'badge-warning',
  draft:         'badge-default',
  withdrawn:     'badge-default',
  reserved:      'badge badge-default !bg-purple-50 !text-purple-700 !border-purple-200',
} as const;

interface BadgeProps {
  variant?: keyof typeof variantClasses;
  dot?: boolean;
  className?: string;
  children: ReactNode;
}

export function Badge({ variant = 'default', dot = false, className, children }: BadgeProps) {
  const hasCustomBg = className?.includes('bg-');
  const base = hasCustomBg ? '' : (variantClasses[variant] ?? variantClasses.default);
  return (
    <span className={`badge ${base} ${dot ? 'badge-dot' : ''} ${className ?? ''}`}>
      {children}
    </span>
  );
}

export function parcelStatusConfig(status: string): { variant: keyof typeof variantClasses; label: string } {
  switch (status) {
    case 'active':        return { variant: 'active',        label: 'Satışta' };
    case 'sold':          return { variant: 'sold',          label: 'Satıldı' };
    case 'deposit_taken': return { variant: 'deposit_taken', label: 'Kaparo Alındı' };
    case 'draft':         return { variant: 'draft',         label: 'Taslak' };
    case 'withdrawn':     return { variant: 'withdrawn',     label: 'Geri Çekildi' };
    case 'reserved':      return { variant: 'reserved',      label: 'Ayırtıldı' };
    default:              return { variant: 'default',       label: status };
  }
}

export function parcelStatusColor(status: string): string {
  switch (status) {
    case 'active':        return '#16a34a';
    case 'sold':          return '#dc2626';
    case 'deposit_taken': return '#d97706';
    case 'reserved':      return '#9333ea';
    default:              return '#9ca3af';
  }
}

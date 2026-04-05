import { type ReactNode } from 'react';

const variantClasses = {
  error:   'bg-[var(--danger-light)]  border-[#fecaca] text-[#991b1b]',
  warning: 'bg-[var(--warning-light)] border-[#fde68a] text-[#92400e]',
  info:    'bg-[var(--info-light)]    border-[#bfdbfe] text-[#1e40af]',
  success: 'bg-[var(--success-light)] border-[#bbf7d0] text-[#14532d]',
} as const;

const icons = {
  error:   '✕',
  warning: '⚠',
  info:    'ℹ',
  success: '✓',
} as const;

interface AlertProps {
  variant?: keyof typeof variantClasses;
  title?: string;
  icon?: boolean;
  className?: string;
  children: ReactNode;
}

export function Alert({ variant = 'error', title, icon = false, className = '', children }: AlertProps) {
  return (
    <div className={`flex gap-3 rounded-lg border px-4 py-3 text-sm ${variantClasses[variant]} ${className}`}>
      {icon && (
        <span className="shrink-0 font-bold mt-0.5 text-xs leading-none opacity-70">
          {icons[variant]}
        </span>
      )}
      <div className="min-w-0">
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        <div className="opacity-90">{children}</div>
      </div>
    </div>
  );
}

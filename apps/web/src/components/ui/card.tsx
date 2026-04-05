import { type ReactNode } from 'react';

interface CardProps {
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  children: ReactNode;
}

const paddingClasses = {
  none: '',
  sm:   'p-3',
  md:   'p-4',
  lg:   'p-6',
};

export function Card({ interactive, padding, className = '', children }: CardProps) {
  return (
    <div
      className={[
        'card',
        interactive ? 'card-hover cursor-pointer' : '',
        padding ? paddingClasses[padding] : '',
        className,
      ].filter(Boolean).join(' ')}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <div className={`flex items-center justify-between border-b border-[var(--border)] px-5 py-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardBody({ className = '', children }: { className?: string; children: ReactNode }) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}

export function CardFooter({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <div className={`border-t border-[var(--border)] bg-[var(--background-subtle)] px-5 py-3 ${className}`}>
      {children}
    </div>
  );
}

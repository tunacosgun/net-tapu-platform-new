'use client';

import { forwardRef, useEffect, useState } from 'react';

type Props = {
  label?: string;
  error?: string;
  value?: string;
  onChange?: (rawValue: string) => void;
  placeholder?: string;
  suffix?: string;
  disabled?: boolean;
  testId?: string;
  className?: string;
};

const labelCls =
  'mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300';
const inputCls =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white';

function formatTr(raw: string): string {
  if (!raw) return '';
  const digits = raw.replace(/[^\d]/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('tr-TR');
}

function stripFormat(formatted: string): string {
  return formatted.replace(/[^\d]/g, '');
}

/**
 * Numeric input with Turkish thousands-separator formatting (500.000).
 * Stores raw digits in form state; displays grouped.
 */
export const FormattedPriceInput = forwardRef<HTMLInputElement, Props>(
  function FormattedPriceInput(
    { label, error, value = '', onChange, placeholder, suffix = '₺', disabled, testId, className },
    ref,
  ) {
    const [display, setDisplay] = useState(formatTr(value));

    useEffect(() => {
      setDisplay(formatTr(value));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = stripFormat(e.target.value);
      setDisplay(formatTr(raw));
      onChange?.(raw);
    };

    return (
      <div className={className}>
        {label && <label className={labelCls}>{label}</label>}
        <div className="relative">
          <input
            ref={ref}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={display}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            data-testid={testId}
            className={`${inputCls} ${suffix ? 'pr-10' : ''}`}
          />
          {suffix && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500 pointer-events-none">
              {suffix}
            </span>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    );
  },
);

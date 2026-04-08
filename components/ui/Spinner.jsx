'use client';

/**
 * Small inline spinner for buttons and compact UI.
 * @param {{ size?: 'sm' | 'md'; variant?: 'onAccent' | 'accent' | 'muted'; className?: string }} props
 */
export default function Spinner({ size = 'sm', variant = 'onAccent', className = '' }) {
  const sizeCls = size === 'md' ? 'h-5 w-5 border-2' : 'h-4 w-4 border-2';
  const variantCls =
    variant === 'onAccent'
      ? 'border-[var(--brand-on-accent)]/25 border-t-[var(--brand-on-accent)]'
      : variant === 'accent'
        ? 'border-brand-accent/25 border-t-brand-accent'
        : 'border-white/15 border-t-white/75';

  return (
    <span
      className={`inline-block shrink-0 animate-spin rounded-full ${sizeCls} ${variantCls} ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

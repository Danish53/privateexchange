'use client';

/**
 * @param {{ title: string; description?: string; children?: import('react').ReactNode }} props
 */
export default function SuperAdminPageFrame({ title, description, children }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-brand-heading sm:text-2xl">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-brand-muted">{description}</p>
        ) : null}
      </div>
      <div className="rounded-2xl border border-brand-border-muted bg-[var(--brand-surface)]/40 p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] backdrop-blur-sm">
        {children ?? (
          <p className="text-sm text-brand-muted">Module content will be wired here.</p>
        )}
      </div>
    </div>
  );
}

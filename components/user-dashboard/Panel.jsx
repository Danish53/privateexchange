export default function Panel({ title, subtitle, children, className = '' }) {
  return (
    <section
      className={`rounded-xl border border-brand-border-muted bg-black/25 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] backdrop-blur-sm transition-shadow duration-300 hover:shadow-[0_20px_50px_-28px_rgba(0,0,0,0.55)] ${className}`}
    >
      {(title || subtitle) && (
        <div className="border-b border-brand-border-muted px-5 py-4 sm:px-6">
          {title && (
            <h2 className="text-base font-semibold tracking-tight text-brand-heading">{title}</h2>
          )}
          {subtitle && <p className="mt-1 text-sm text-brand-muted">{subtitle}</p>}
        </div>
      )}
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

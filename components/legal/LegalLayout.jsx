import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';

export default function LegalLayout({ title, updated, children }) {
  return (
    <div className="relative min-h-screen bg-brand-page text-brand-foreground">
      <div className="pointer-events-none fixed inset-0 bg-brand-hero-radial opacity-90" aria-hidden />
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_55%_40%_at_100%_0%,rgba(51,65,85,0.22),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 bg-gradient-to-b from-transparent to-brand-page"
        aria-hidden
      />

      <header className="sticky top-0 z-40 border-b border-brand-border-muted bg-[var(--brand-page)]/95 shadow-[inset_0_-1px_0_0_rgba(255,255,255,0.04)] backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-6">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-sm font-medium text-brand-muted transition hover:text-brand-heading"
          >
            <ArrowLeft
              className="h-4 w-4 transition group-hover:-translate-x-0.5"
              strokeWidth={2}
              aria-hidden
            />
            Back to home
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-brand-border-muted bg-black/30 px-4 py-2 text-sm font-semibold text-brand-heading shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] transition hover:border-brand-accent/30 hover:bg-[var(--brand-surface-hover)]"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-brand-accent/25 bg-[var(--brand-accent-soft)]/40 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-brand-accent">
          <Shield className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          Legal
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-brand-heading sm:text-[2rem]">
          {title}
        </h1>
        <p className="mt-2 text-sm text-brand-subtle">{updated}</p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-brand-muted [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-brand-heading [&_h2]:tracking-tight [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-brand-heading [&_li]:mt-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
          {children}
        </div>
      </main>

      <footer className="relative z-10 border-t border-brand-border-muted py-10">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-3 px-4 text-center sm:flex-row sm:gap-6">
          <Link href="/" className="text-xs font-medium text-brand-subtle transition hover:text-brand-accent">
            Home
          </Link>
          <span className="hidden text-brand-border sm:inline" aria-hidden>
            ·
          </span>
          <Link href="/privacy" className="text-xs font-medium text-brand-subtle transition hover:text-brand-accent">
            Privacy
          </Link>
          <span className="hidden text-brand-border sm:inline" aria-hidden>
            ·
          </span>
          <Link href="/terms" className="text-xs font-medium text-brand-subtle transition hover:text-brand-accent">
            Terms
          </Link>
        </div>
        <p className="mt-6 text-center text-[0.65rem] text-brand-subtle">
          759 Private Exchange · Demo legal copy — replace with counsel-approved text before production.
        </p>
      </footer>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
  backHref = '/',
  backLabel = 'Back to home',
  badge,
  /** Outer column max width for all auth pages (matches register). */
  contentMaxWidth = 'max-w-xl sm:max-w-2xl',
  /** Subtitle line length under the title (matches register). */
  subtitleMaxWidthClass = 'max-w-md sm:max-w-xl',
}) {
  return (
    <div className="relative min-h-screen bg-brand-page font-sans text-brand-foreground">
      <div
        className="animate-hero-glow bg-brand-hero-radial pointer-events-none fixed inset-0"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_55%_45%_at_100%_0%,rgba(51,65,85,0.35),transparent_60%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.18]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(148, 163, 184, 0.055) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148, 163, 184, 0.055) 1px, transparent 1px)
          `,
          backgroundSize: '56px 56px',
          maskImage:
            'radial-gradient(ellipse 85% 75% at 50% 0%, black 15%, transparent 72%)',
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 bg-gradient-to-b from-transparent via-transparent to-brand-page"
        aria-hidden
      />

      <div
        className={`relative z-10 mx-auto flex min-h-screen w-full flex-col justify-center px-4 py-12 sm:px-6 ${contentMaxWidth}`}
      >
        <Link
          href={backHref}
          className="auth-link group mb-8 inline-flex flex-shrink-0 items-center gap-2 text-sm"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
          {backLabel}
        </Link>

        <div className="auth-card">
          {badge ? (
            <div className="mb-6 flex justify-center">
              <span className="text-[0.625rem] font-semibold uppercase tracking-[0.2em] text-brand-subtle">
                {badge}
              </span>
            </div>
          ) : null}

          <div className="mb-8 flex justify-center">
            <Link
              href="/"
              className="group/logo relative flex h-14 w-14 items-center justify-center rounded-xl border border-white/[0.1] bg-gradient-to-b from-white/[0.08] to-white/[0.02] shadow-[0_1px_0_0_rgba(255,255,255,0.07)_inset] transition duration-200 hover:border-white/[0.14] hover:shadow-[0_0_0_1px_rgba(201,162,39,0.2)]"
            >
              <span className="absolute inset-x-2.5 top-2 h-px rounded-full bg-gradient-to-r from-transparent via-brand-accent/45 to-transparent" />
              <span className="font-bold tabular-nums text-lg tracking-tight text-brand-accent">
                759
              </span>
            </Link>
          </div>

          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-[-0.03em] text-brand-heading sm:text-[1.65rem]">
              {title}
            </h1>
            {subtitle ? (
              <p
                className={`prose-landing mx-auto mt-2 text-sm leading-relaxed text-brand-muted ${subtitleMaxWidthClass}`}
              >
                {subtitle}
              </p>
            ) : null}
          </div>

          <div className="mt-8">{children}</div>
        </div>

        {footer ? <div className="mt-8 text-center text-sm">{footer}</div> : null}

        <p className="mt-4 text-center text-[0.6875rem] leading-relaxed text-brand-subtle">
          Utility platform · Not investment advice · For eligible users only
        </p>
      </div>
    </div>
  );
}

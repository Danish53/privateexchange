'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Wallet,
  Shield,
  Zap,
  Users,
  Gift,
  TrendingUp,
  ArrowRight,
  DollarSign,
  CreditCard,
  Bitcoin,
  Menu,
  X,
  ChevronRight,
  Lock,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '@/components/auth-context';

/** Bypass next/image optimizer for Unsplash — direct URLs work; optimizer can fail with Turbopack/dev. */
const UNSPLASH_IMG = { unoptimized: true };

const navLinks = [
  { href: '#overview', label: 'Overview' },
  { href: '#tokens', label: 'Tokens' },
  { href: '#features', label: 'Features' },
  { href: '#payments', label: 'Payments' },
];

/** Editorial photography — finance & operations (professional, non-generic). */
const LANDING_IMAGES = {
  hero: {
    src: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1400&q=80',
    alt: 'Analytics dashboard on a monitor in a dim office',
  },
  operations: {
    src: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1400&q=80',
    alt: 'Secure workspace with laptop and documents',
  },
  tokens: {
    src: 'https://images.unsplash.com/photo-1621761191319-6bfe7cc0e5a4?auto=format&fit=crop&w=1600&q=80',
    alt: 'Stacked precious metal coins in soft light',
  },
  payments: {
    src: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1400&q=80',
    alt: 'Contactless payment at a retail terminal',
  },
  modules: {
    src: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1600&q=80',
    alt: 'Colleagues reviewing documents at a meeting table',
  },
  cta: {
    src: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45d?auto=format&fit=crop&w=1400&q=80',
    alt: 'Desk with notebook, pen, and coffee in warm light',
  },
};

function Reveal({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function LandingPage() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const closeMobile = () => setMobileOpen(false);

  const features = [
    {
      icon: Wallet,
      title: 'Multi-Token Wallet',
      description:
        'One ledger-backed wallet for every supported token, with a clear history of movement.',
    },
    {
      icon: Shield,
      title: 'Secure Platform',
      description:
        'Role-based access, audited adjustments, and transaction validation built into the core.',
    },
    {
      icon: Zap,
      title: 'Instant Transfers',
      description:
        'Peer-to-peer token sends with transparent fees and VIP benefits when applicable.',
    },
    {
      icon: Users,
      title: 'Community Tiers',
      description:
        'Member and VIP tiers with fee rules and privileges you can see upfront.',
    },
    {
      icon: Gift,
      title: 'Drawing System',
      description:
        'Enter drawings with tokens, track participation, and review past results.',
    },
    {
      icon: TrendingUp,
      title: 'Admin dashboards',
      description:
        'Operational views for volume, engagement, and platform health—role-gated.',
    },
  ];

  const tokens = [
    { name: '759', accent: 'bg-amber-500', description: 'Primary' },
    { name: 'Cristalino', accent: 'bg-sky-400', description: 'Premium' },
    { name: 'Añejo', accent: 'bg-orange-500', description: 'Reserve' },
    { name: 'Raffle', accent: 'bg-violet-500', description: 'Entries' },
    { name: 'Susu', accent: 'bg-emerald-500', description: 'Community' },
  ];

  return (
    <div className="relative min-h-screen bg-brand-page text-brand-foreground">
      <div
        className="animate-hero-glow bg-brand-hero-radial pointer-events-none fixed inset-0"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_55%_45%_at_100%_0%,rgba(51,65,85,0.35),transparent_60%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.22]"
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

      <header className="sticky top-0 z-50 border-b border-brand-border-muted bg-brand-page/80 shadow-[inset_0_-1px_0_0_rgba(255,255,255,0.04)] backdrop-blur-2xl backdrop-saturate-150">
        <div className="mx-auto flex min-h-[4.25rem] max-w-6xl items-center justify-between gap-3 px-4 sm:min-h-[4.5rem] sm:gap-5 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="group flex min-w-0 shrink-0 items-center gap-3 rounded-lg outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-brand"
            onClick={closeMobile}
          >
            <span
              className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.1] bg-gradient-to-b from-white/[0.08] to-white/[0.02] shadow-[0_1px_0_0_rgba(255,255,255,0.07)_inset] transition duration-200 group-hover:border-white/[0.14] group-hover:shadow-[0_0_0_1px_rgba(201,162,39,0.15)]"
              aria-hidden
            >
              <span className="absolute inset-x-2.5 top-1.5 h-px rounded-full bg-gradient-to-r from-transparent via-brand-accent/45 to-transparent" />
              <span className="font-bold tabular-nums text-[1rem] tracking-tight text-brand-accent">
                759
              </span>
            </span>
            <span className="min-w-0 text-left">
              <span className="block truncate text-[0.875rem] font-semibold leading-tight tracking-tight text-brand-heading sm:text-[0.9375rem]">
                Private Exchange
              </span>
              <span className="mt-0.5 block text-[0.625rem] font-semibold uppercase leading-none tracking-[0.2em] text-brand-subtle">
                759 Ecosystem
              </span>
            </span>
          </Link>

          <nav
            className="hidden md:flex md:flex-1 md:justify-center md:px-4 lg:px-8"
            aria-label="Primary"
          >
            <div className="inline-flex h-11 max-w-full items-center rounded-full border border-brand-border bg-black/35 p-1.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
              {navLinks.map(({ href, label }) => (
                <a key={href} href={href} className="nav-pill-link shrink-0">
                  {label}
                </a>
              ))}
            </div>
          </nav>

          <div className="hidden items-center sm:flex">
            {user ? (
              <div className="flex h-11 items-stretch gap-2 rounded-2xl border border-white/[0.08] bg-black/40 p-1 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
                <Link href="/dashboard" className="btn-nav-ghost rounded-xl px-4">
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    closeMobile();
                  }}
                  className="btn-nav-ghost rounded-xl px-4"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="group inline-flex h-11 items-center gap-2 rounded-xl border border-white/[0.1] bg-black/35 px-4 text-sm font-semibold text-brand-muted shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] transition duration-200 hover:border-white/[0.14] hover:bg-[var(--brand-surface-hover)] hover:text-brand-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-page"
                >
                  <LogIn className="h-4 w-4 shrink-0 text-brand-accent/90" strokeWidth={2} aria-hidden />
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="btn-primary-sm group inline-flex !h-11 min-h-11 items-center gap-2 rounded-xl !px-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-page"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/20 text-brand-on-accent shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)]">
                    <UserPlus className="h-4 w-4" strokeWidth={2.25} aria-hidden />
                  </span>
                  Register
                  <ArrowRight
                    className="h-3.5 w-3.5 opacity-90 transition-transform duration-200 group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
              </div>
            )}
          </div>

          <button
            type="button"
            className="btn-icon-header sm:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" strokeWidth={1.5} />
            ) : (
              <Menu className="h-5 w-5" strokeWidth={1.5} />
            )}
          </button>
        </div>

        {mobileOpen && (
          <>
            <div
              className="fixed inset-0 top-16 z-40 bg-[#030406]/75 backdrop-blur-sm md:hidden"
              aria-hidden
              onClick={closeMobile}
            />
            <div
              id="mobile-nav"
              className="absolute left-0 right-0 top-full z-50 border-b border-white/[0.07] bg-[#0a0b0f]/95 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.65)] backdrop-blur-2xl md:hidden"
            >
              <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
                <p className="mb-3 text-[0.625rem] font-semibold uppercase tracking-[0.2em] text-brand-subtle">
                  Navigate
                </p>
                <div className="space-y-0.5">
                  {navLinks.map(({ href, label }) => (
                    <a
                      key={href}
                      href={href}
                      onClick={closeMobile}
                      className="flex items-center justify-between rounded-lg border border-transparent px-3 py-3 text-[15px] font-medium text-brand-muted transition duration-200 hover:border-brand-border-muted hover:bg-[var(--brand-surface-hover)] hover:text-brand-heading"
                    >
                      {label}
                      <ChevronRight className="h-4 w-4 text-brand-subtle" />
                    </a>
                  ))}
                </div>
                <div className="my-4 h-px bg-gradient-to-r from-transparent via-brand-border to-transparent" />
                <p className="mb-3 text-[0.625rem] font-semibold uppercase tracking-[0.2em] text-brand-subtle">
                  Account
                </p>
                {user ? (
                  <div className="flex flex-col gap-2">
                    <Link
                      href="/dashboard"
                      onClick={closeMobile}
                      className="btn-mobile-primary"
                    >
                      Dashboard
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        closeMobile();
                      }}
                      className="btn-mobile-secondary"
                    >
                      Sign out
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link
                      href="/login"
                      onClick={closeMobile}
                      className="btn-mobile-secondary inline-flex items-center justify-center gap-2"
                    >
                      <LogIn className="h-4 w-4 text-brand-accent" strokeWidth={2} aria-hidden />
                      Sign in
                    </Link>
                    <Link
                      href="/register"
                      onClick={closeMobile}
                      className="btn-mobile-primary inline-flex items-center justify-center gap-2"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/25 text-brand-on-accent shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                        <UserPlus className="h-4 w-4" strokeWidth={2.25} aria-hidden />
                      </span>
                      Create account
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </header>

      <main className="relative">
        <section
          id="overview"
          className="border-b border-brand-border-muted px-4 pb-20 pt-16 sm:px-6 sm:pb-24 sm:pt-20 lg:px-8"
        >
          <div className="mx-auto max-w-6xl">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-14">
              <Reveal>
                <div className="max-w-xl lg:max-w-none">
                  <p className="prose-landing-tight mb-5 inline-flex items-center gap-2 text-[0.8125rem] font-medium">
                    <span className="h-px w-8 bg-brand-subtle" aria-hidden />
                    Multi-token wallet · Fiat & crypto rails
                  </p>
                  <h1 className="text-balance text-4xl font-semibold tracking-[-0.03em] text-brand-heading sm:text-5xl lg:text-[3.1rem] lg:leading-[1.08]">
                    Balances, transfers, and drawings—one private exchange workspace.
                  </h1>
                  <p className="prose-landing mt-6 text-pretty text-base leading-[1.65] sm:text-lg">
                    Built for the 759 ecosystem: five tokens, member tiers, ledger-backed
                    movements, and admin controls you can trace end to end.
                  </p>
                  <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Link
                      href="/login"
                      className="btn-primary group focus-visible:outline-none"
                    >
                      Open dashboard
                      <ArrowRight
                        className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                        aria-hidden
                      />
                    </Link>
                    <a href="#features" className="btn-secondary">
                      Explore capabilities
                    </a>
                  </div>
                </div>
              </Reveal>
              <Reveal delay={120} className="relative">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/[0.08] bg-black/40 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.85),inset_0_1px_0_0_rgba(255,255,255,0.06)]">
                  <Image
                    {...UNSPLASH_IMG}
                    src={LANDING_IMAGES.hero.src}
                    alt={LANDING_IMAGES.hero.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-brand-page via-brand-page/40 to-transparent"
                    aria-hidden
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-brand-page/90 via-transparent to-transparent sm:from-brand-page/70"
                    aria-hidden
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-subtle">
                      Operations snapshot
                    </p>
                    <p className="mt-1 text-sm font-medium text-brand-heading">
                      Volume, transfers, and tier rules in one place
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>

            <dl className="mt-16 grid grid-cols-2 gap-3 sm:mt-20 lg:grid-cols-4 lg:gap-4">
              {[
                { label: 'Tokens live', value: '5' },
                { label: 'Designed uptime target', value: '99.9%' },
                { label: 'Transfer fee (standard)', value: '$0.50' },
                { label: 'VIP fee waiver', value: 'Yes' },
              ].map((row, i) => (
                <Reveal key={row.label} delay={i * 75}>
                  <div className="rounded-lg border border-brand-border-muted bg-[var(--brand-surface)] px-4 py-4 transition duration-200 hover:border-brand-border hover:bg-[var(--brand-surface-hover)]">
                    <dt className="text-xs font-medium uppercase tracking-wider text-brand-subtle">
                      {row.label}
                    </dt>
                    <dd className="mt-1.5 text-xl font-semibold tabular-nums tracking-tight text-brand-heading sm:text-2xl">
                      {row.value}
                    </dd>
                  </div>
                </Reveal>
              ))}
            </dl>
          </div>
        </section>

        <section className="border-b border-brand-border-muted px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
              <Reveal className="order-2 lg:order-1">
                <div className="relative aspect-[16/11] overflow-hidden rounded-2xl border border-white/[0.08] bg-black/30 shadow-[0_32px_64px_-48px_rgba(0,0,0,0.9)]">
                  <Image
                    {...UNSPLASH_IMG}
                    src={LANDING_IMAGES.operations.src}
                    alt={LANDING_IMAGES.operations.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-brand-page/85 via-brand-page/25 to-transparent"
                    aria-hidden
                  />
                  <div className="absolute bottom-4 left-4 right-4 rounded-lg border border-white/[0.08] bg-black/50 px-4 py-3 backdrop-blur-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-subtle">
                      Ledger & controls
                    </p>
                    <p className="mt-1 text-sm text-brand-heading">
                      Every movement traceable in the workspace
                    </p>
                  </div>
                </div>
              </Reveal>
              <Reveal delay={80} className="order-1 lg:order-2">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-brand-subtle">
                  Why it exists
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-brand-heading sm:text-3xl">
                  Built for members who want clarity—not noise
                </h2>
                <p className="prose-landing mt-4 leading-[1.65]">
                  Private Exchange ties balances, transfers, drawings, and tiers into one audited
                  flow. You see fees, status, and history in plain language—no buzzwords, no mystery
                  mechanics.
                </p>
                <ul className="mt-8 space-y-4">
                  {[
                    'Role-based dashboards for users and admins',
                    'Transparent fee rules and VIP benefits',
                    'Funding rails phased in with verification',
                  ].map((line) => (
                    <li key={line} className="flex gap-3 text-sm text-brand-muted">
                      <span
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-accent"
                        aria-hidden
                      />
                      {line}
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </div>
        </section>

        <section
          id="tokens"
          className="border-b border-brand-border-muted px-4 py-20 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 grid gap-10 lg:grid-cols-12 lg:items-end">
              <Reveal className="lg:col-span-5">
                <h2 className="text-2xl font-semibold tracking-tight text-brand-heading sm:text-3xl">
                  Supported tokens
                </h2>
                <p className="prose-landing mt-3 leading-[1.65]">
                  Five ecosystem assets on the ledger—each with its own rules and display metadata as
                  the platform grows.
                </p>
              </Reveal>
              <Reveal delay={60} className="relative lg:col-span-7">
                <div className="relative aspect-[21/9] max-h-[220px] overflow-hidden rounded-2xl border border-white/[0.07] bg-black/40">
                  <Image
                    {...UNSPLASH_IMG}
                    src={LANDING_IMAGES.tokens.src}
                    alt={LANDING_IMAGES.tokens.alt}
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 1024px) 100vw, 58vw"
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-brand-page via-brand-page/30 to-transparent"
                    aria-hidden
                  />
                  <p className="absolute bottom-4 left-5 text-xs font-medium text-brand-subtle sm:left-6">
                    Ecosystem assets · illustrative
                  </p>
                </div>
              </Reveal>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:gap-4">
              {tokens.map((token, i) => (
                <Reveal key={token.name} delay={i * 55}>
                  <article className="group relative overflow-hidden rounded-xl border border-brand-border-muted bg-[var(--brand-surface)] pl-4 transition duration-300 hover:-translate-y-0.5 hover:border-brand-border hover:bg-[var(--brand-surface-hover)] hover:shadow-[0_12px_40px_-16px_rgba(0,0,0,0.5)]">
                    <div
                      className={`absolute left-0 top-0 h-full w-1 ${token.accent} opacity-90 transition group-hover:opacity-100`}
                      aria-hidden
                    />
                    <div className="py-5 pr-4 pl-3">
                      <h3 className="text-base font-semibold text-brand-heading">{token.name}</h3>
                      <p className="prose-landing-tight mt-1 text-sm">{token.description}</p>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section
          id="features"
          className="border-b border-brand-border-muted px-4 py-20 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <div className="mb-10 max-w-2xl">
                <h2 className="text-2xl font-semibold tracking-tight text-brand-heading sm:text-3xl">
                  Platform modules
                </h2>
                <p className="prose-landing mt-3 leading-[1.65]">
                  Wallet ledger, transaction engine, payments, drawings, and membership—wired for
                  operations and admin oversight.
                </p>
              </div>
            </Reveal>
            <Reveal delay={40}>
              <div className="relative mb-12 overflow-hidden rounded-2xl border border-white/[0.06]">
                <div className="relative aspect-[21/8] min-h-[140px] sm:aspect-[21/7]">
                  <Image
                    {...UNSPLASH_IMG}
                    src={LANDING_IMAGES.modules.src}
                    alt=""
                    fill
                    className="object-cover object-[center_40%]"
                    sizes="100vw"
                    aria-hidden
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-brand-page via-brand-page/70 to-brand-page/30"
                    aria-hidden
                  />
                  <div className="absolute inset-0 flex flex-col justify-center px-6 py-6 sm:px-10">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-subtle">
                      One workspace
                    </p>
                    <p className="mt-2 max-w-lg text-lg font-semibold text-brand-heading sm:text-xl">
                      From deposits to drawings—modules stay connected to the same ledger
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, i) => (
                <Reveal key={feature.title} delay={i * 60}>
                  <li className="group h-full rounded-lg border border-brand-border-muted bg-[var(--brand-surface)] p-5 transition duration-300 hover:-translate-y-0.5 hover:border-brand-accent/25 hover:bg-[var(--brand-surface-hover)] hover:shadow-[0_16px_48px_-20px_var(--brand-accent-soft)]">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md border border-brand-border bg-[var(--brand-surface-hover)] transition duration-200 group-hover:border-brand-accent/35 group-hover:bg-[var(--brand-accent-soft)]">
                      <feature.icon
                        className="h-5 w-5 text-brand-accent transition group-hover:scale-105"
                        strokeWidth={1.5}
                      />
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-brand-heading">
                      {feature.title}
                    </h3>
                    <p className="prose-landing mt-2 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </li>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        <section
          id="payments"
          className="border-b border-brand-border-muted px-4 py-20 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-6xl">
            <div className="grid items-stretch gap-10 lg:grid-cols-2 lg:gap-14">
              <Reveal className="relative min-h-[280px] overflow-hidden rounded-2xl border border-white/[0.08] bg-black/40 lg:min-h-[360px]">
                <Image
                  {...UNSPLASH_IMG}
                  src={LANDING_IMAGES.payments.src}
                  alt={LANDING_IMAGES.payments.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-brand-page via-brand-page/50 to-transparent"
                  aria-hidden
                />
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-subtle">
                    In person & online
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-brand-muted">
                    Card, wallet, and on-chain rails are rolled out in phases—with verification
                    before funds move.
                  </p>
                </div>
              </Reveal>
              <div>
                <Reveal>
                  <div className="mb-10 max-w-xl">
                    <h2 className="text-2xl font-semibold tracking-tight text-brand-heading sm:text-3xl">
                      Funding rails
                    </h2>
                    <p className="prose-landing mt-3 leading-[1.65]">
                      Deposit paths are phased: live where available, with admin checks behind the
                      scenes. Statuses are shown upfront.
                    </p>
                  </div>
                </Reveal>
                <div className="max-w-md space-y-3">
                  {[
                    { icon: DollarSign, name: 'PayPal', status: 'Available' },
                    { icon: CreditCard, name: 'Stripe', status: 'Roadmap' },
                    { icon: Bitcoin, name: 'Crypto', status: 'Available' },
                  ].map((method, i) => (
                    <Reveal key={method.name} delay={i * 70}>
                      <div className="flex items-center gap-4 rounded-xl border border-brand-border-muted bg-[var(--brand-surface)] p-5 transition duration-300 hover:border-brand-border hover:bg-[var(--brand-surface-hover)]">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-brand-border bg-brand-page shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
                          <method.icon className="h-6 w-6 text-brand-accent" strokeWidth={1.5} />
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-brand-heading">{method.name}</p>
                          <p
                            className={`mt-0.5 text-sm font-medium ${
                              method.status === 'Available'
                                ? 'text-emerald-400/90'
                                : 'text-brand-subtle'
                            }`}
                          >
                            {method.status}
                          </p>
                        </div>
                      </div>
                    </Reveal>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <div className="relative min-h-[320px] overflow-hidden rounded-2xl border border-white/[0.1] shadow-[0_32px_80px_-40px_rgba(0,0,0,0.75)] sm:min-h-[340px]">
                <Image
                  {...UNSPLASH_IMG}
                  src={LANDING_IMAGES.cta.src}
                  alt=""
                  fill
                  className="object-cover object-center"
                  sizes="100vw"
                  aria-hidden
                />
                <div
                  className="absolute inset-0 bg-gradient-to-r from-brand-page via-brand-page/92 to-brand-page/55"
                  aria-hidden
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-page/95 via-transparent to-brand-page/40" aria-hidden />
                <div className="relative flex h-full min-h-[320px] flex-col justify-end px-8 py-10 sm:min-h-[340px] sm:px-12 sm:py-12 lg:max-w-[65%]">
                  <h2 className="text-2xl font-semibold tracking-tight text-brand-heading sm:text-3xl">
                    Sign in to the workspace
                  </h2>
                  <p className="prose-landing mt-4 leading-[1.65] text-brand-muted">
                    Use demo credentials on the login screen to preview user and admin dashboards
                    while services are connected.
                  </p>
                  <Link
                    href="/login"
                    className="btn-primary group mt-8 w-fit focus-visible:outline-none"
                  >
                    Continue to login
                    <ArrowRight
                      className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="relative overflow-hidden border-t border-brand-border-muted bg-gradient-to-b from-brand-footer-top via-[#06070a] to-brand-footer-bottom">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-accent/35 to-transparent"
          aria-hidden
        />
        <div
          className="animate-footer-shimmer pointer-events-none absolute inset-x-[12%] top-0 h-px bg-gradient-to-r from-brand-accent/0 via-brand-accent-hover/55 to-brand-accent/0 opacity-90"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-24 left-1/2 h-48 w-[min(100%,48rem)] -translate-x-1/2 rounded-full bg-brand-accent/[0.04] blur-3xl"
          aria-hidden
        />

        <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-14 sm:px-6 sm:pb-12 sm:pt-16 lg:px-8">
          <div className="grid gap-12 sm:gap-14 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-5">
              <Link
                href="/"
                className="group inline-flex items-start gap-3.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/45 focus-visible:ring-offset-2 focus-visible:ring-offset-brand"
              >
                <span
                  className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.1] bg-gradient-to-b from-white/[0.08] to-white/[0.02] shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset] transition group-hover:border-white/[0.14]"
                  aria-hidden
                >
                  <span className="absolute inset-x-2 top-1.5 h-px rounded-full bg-gradient-to-r from-transparent via-brand-accent/40 to-transparent" />
                  <span className="font-semibold tabular-nums text-[0.9375rem] tracking-tight text-brand-accent">
                    759
                  </span>
                </span>
                <span className="min-w-0 pt-0.5 text-left">
                  <span className="block text-sm font-semibold tracking-tight text-brand-heading">
                    Private Exchange
                  </span>
                  <span className="mt-1 block text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-brand-subtle">
                    759 Ecosystem
                  </span>
                </span>
              </Link>
              <p className="prose-landing mt-5 max-w-sm text-sm leading-relaxed">
                One workspace for balances, transfers, drawings, and tiers—built for clarity and
                auditability.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-brand-border-muted bg-[var(--brand-surface)] px-3 py-1.5 text-[0.6875rem] font-medium text-brand-subtle">
                <Lock className="h-3.5 w-3.5 shrink-0 text-brand-accent/80" aria-hidden />
                Session-protected access
              </div>
            </div>

            <div className="grid gap-10 sm:grid-cols-2 lg:col-span-7 lg:grid-cols-3 lg:gap-10">
              <div>
                <p className="text-[0.625rem] font-semibold uppercase tracking-[0.2em] text-brand-subtle">
                  On this page
                </p>
                <ul className="mt-4 space-y-2.5">
                  {navLinks.map(({ href, label }) => (
                    <li key={href}>
                      <a href={href} className="link-footer">
                        <span className="link-footer-mark" aria-hidden />
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-[0.625rem] font-semibold uppercase tracking-[0.2em] text-brand-subtle">
                  Workspace
                </p>
                <ul className="mt-4 space-y-2.5">
                  <li>
                    <Link href="/login" className="link-footer">
                      <span className="link-footer-mark" aria-hidden />
                      Sign in
                    </Link>
                  </li>
                  {user ? (
                    <li>
                      <Link href="/dashboard" className="link-footer">
                        <span className="link-footer-mark" aria-hidden />
                        Dashboard
                      </Link>
                    </li>
                  ) : (
                    <li>
                      <Link href="/register" className="link-footer">
                        <span className="link-footer-mark" aria-hidden />
                        Register
                      </Link>
                    </li>
                  )}
                </ul>
              </div>

              <div className="sm:col-span-2 lg:col-span-1">
                <p className="text-[0.625rem] font-semibold uppercase tracking-[0.2em] text-brand-subtle">
                  Legal
                </p>
                <ul className="mt-4 space-y-2.5">
                  <li>
                    <Link href="/privacy" className="link-footer">
                      <span className="link-footer-mark" aria-hidden />
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms" className="link-footer">
                      <span className="link-footer-mark" aria-hidden />
                      Terms of Service
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-14 flex flex-col gap-4 border-t border-brand-border-muted pt-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-brand-subtle">
              © {new Date().getFullYear()} 759 Private Exchange. All rights reserved.
            </p>
            <p className="text-xs text-brand-subtle sm:max-w-[22rem] sm:text-right">
              Utility platform · Not investment advice · For eligible members only
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

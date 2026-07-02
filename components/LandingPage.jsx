'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
  Trophy,
  Calendar,
  Award,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/components/auth-context';
import LanguageSwitcher from '@/components/i18n/LanguageSwitcher';
import { useWebsiteT } from '@/components/i18n/WebsiteLocaleProvider';

/** Bypass next/image optimizer for Unsplash — direct URLs work; optimizer can fail with Turbopack/dev. */
const UNSPLASH_IMG = { unoptimized: true };

const LANDING_IMAGE_SRC = {
  hero: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1400&q=80',
  operations: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1400&q=80',
  tokens: 'https://images.unsplash.com/photo-1621761191319-6bfe7cc0e5a4?auto=format&fit=crop&w=1600&q=80',
  payments: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1400&q=80',
  modules: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1600&q=80',
  cta: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45d?auto=format&fit=crop&w=1400&q=80',
};

function getNavLinks(t) {
  return [
    { href: '#overview', label: t('nav.overview') },
    { href: '#tokens', label: t('nav.tokens') },
    { href: '#features', label: t('nav.features') },
    { href: '#winners', label: t('nav.winners') },
    { href: '#payments', label: t('nav.payments') },
  ];
}

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

function winnerInitials(name) {
  const n = String(name || '').trim();
  if (!n) return 'M';
  const parts = n.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0][0] || '';
    const b = parts[1][0] || '';
    const pair = `${a}${b}`.toUpperCase();
    if (pair) return pair.slice(0, 2);
  }
  return n.slice(0, 2).toUpperCase() || 'M';
}

function winnerPrizeLine(row, t) {
  const type = String(row.reward_type || '').toLowerCase();
  if (type === 'token' && row.reward_token_symbol) {
    return `${row.reward_token_amount || '0'} ${row.reward_token_symbol}`.trim();
  }
  if (row.prize_title) return row.prize_title;
  if (type === 'event_access') return t('winners.eventAccess');
  if (type === 'physical') return t('winners.physicalPrize');
  return t('winners.prizeFallback');
}

export default function LandingPage() {
  const { user, logout } = useAuth();
  const { t, locale, translateWinnerRows } = useWebsiteT();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [rawWinnerRows, setRawWinnerRows] = useState([]);
  const [winnerRows, setWinnerRows] = useState([]);
  const [winnersLoading, setWinnersLoading] = useState(true);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  useEffect(() => {
    const loadWinners = async () => {
      setWinnersLoading(true);
      try {
        const res = await fetch('/api/drawings/winners', { cache: 'no-store' });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.ok) return;
        setRawWinnerRows(Array.isArray(json.winners) ? json.winners : []);
      } catch {
        // Keep landing stable if request fails.
      } finally {
        setWinnersLoading(false);
      }
    };
    void loadWinners();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const rows = await translateWinnerRows(rawWinnerRows);
      if (!cancelled) setWinnerRows(rows);
    })();
    return () => {
      cancelled = true;
    };
  }, [rawWinnerRows, locale, translateWinnerRows]);

  const closeMobile = () => setMobileOpen(false);

  const navLinks = useMemo(() => getNavLinks(t), [t]);

  const landingImages = {
    hero: { src: LANDING_IMAGE_SRC.hero, alt: t('images.hero') },
    operations: { src: LANDING_IMAGE_SRC.operations, alt: t('images.operations') },
    tokens: { src: LANDING_IMAGE_SRC.tokens, alt: t('images.tokens') },
    payments: { src: LANDING_IMAGE_SRC.payments, alt: t('images.payments') },
    modules: { src: LANDING_IMAGE_SRC.modules, alt: t('images.modules') },
    cta: { src: LANDING_IMAGE_SRC.cta, alt: t('images.cta') },
  };

  const features = [
    { icon: Wallet, title: t('features.walletTitle'), description: t('features.walletDesc') },
    { icon: Shield, title: t('features.secureTitle'), description: t('features.secureDesc') },
    { icon: Zap, title: t('features.transferTitle'), description: t('features.transferDesc') },
    { icon: Users, title: t('features.tiersTitle'), description: t('features.tiersDesc') },
    { icon: Gift, title: t('features.drawingTitle'), description: t('features.drawingDesc') },
    { icon: TrendingUp, title: t('features.adminTitle'), description: t('features.adminDesc') },
  ];

  const tokens = [
    { name: '759', accent: 'bg-amber-500', description: t('tokensSection.primary') },
    { name: 'Cristalino', accent: 'bg-sky-400', description: t('tokensSection.premium') },
    { name: 'Añejo', accent: 'bg-orange-500', description: t('tokensSection.reserve') },
    { name: 'Raffle', accent: 'bg-violet-500', description: t('tokensSection.entries') },
    { name: 'Susu', accent: 'bg-emerald-500', description: t('tokensSection.community') },
  ];

  const stats = [
    { label: t('stats.tokensLive'), value: '5' },
    { label: t('stats.uptime'), value: '99.9%' },
    { label: t('stats.transferFee'), value: '$0.50' },
    { label: t('stats.vipFee'), value: t('stats.yes') },
  ];

  const whyBullets = [t('why.bullet1'), t('why.bullet2'), t('why.bullet3')];

  const paymentMethods = [
    { icon: DollarSign, name: 'PayPal', statusKey: 'available' },
    { icon: CreditCard, name: 'Stripe', statusKey: 'roadmap' },
    { icon: Bitcoin, name: 'Crypto', statusKey: 'available' },
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
        <div className="mx-auto flex min-h-[4rem] max-w-6xl items-center justify-between gap-2 px-3 sm:min-h-[4.25rem] sm:gap-3 sm:px-4 lg:px-5">
          <Link
            href="/"
            className="group flex min-w-0 max-w-[42%] shrink items-center gap-2 rounded-lg outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-brand sm:max-w-none sm:gap-2.5 sm:shrink-0"
            onClick={closeMobile}
          >
            <span
              className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.1] bg-gradient-to-b from-white/[0.08] to-white/[0.02] shadow-[0_1px_0_0_rgba(255,255,255,0.07)_inset] transition duration-200 group-hover:border-white/[0.14] group-hover:shadow-[0_0_0_1px_rgba(201,162,39,0.15)] sm:h-11 sm:w-11"
              aria-hidden
            >
              <span className="absolute inset-x-2.5 top-1.5 h-px rounded-full bg-gradient-to-r from-transparent via-brand-accent/45 to-transparent" />
              <span className="font-bold tabular-nums text-[1rem] tracking-tight text-brand-accent">
                759
              </span>
            </span>
            <span className="min-w-0 text-left">
              <span className="block truncate text-[0.875rem] font-semibold leading-tight tracking-tight text-brand-heading sm:text-[0.9375rem]">
                {t('brand.name')}
              </span>
              <span className="mt-0.5 block text-[0.625rem] font-semibold uppercase leading-none tracking-[0.2em] text-brand-subtle">
                {t('brand.tagline')}
              </span>
            </span>
          </Link>

          <nav
            className="hidden min-w-0 md:flex md:flex-1 md:justify-center md:px-1 lg:px-2"
            aria-label="Primary"
          >
            <div className="inline-flex h-10 max-w-full items-center rounded-full border border-brand-border bg-black/35 p-1 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
              {navLinks.map(({ href, label }) => (
                <a key={href} href={href} className="nav-pill-link shrink-0 !px-2.5 !text-[0.8125rem] lg:!px-3.5 lg:!text-sm">
                  {label}
                </a>
              ))}
            </div>
          </nav>

          <div className="hidden min-w-0 shrink-0 items-center gap-1.5 sm:flex lg:gap-2">
            <LanguageSwitcher compact />
            {user ? (
              <div className="flex h-10 items-stretch gap-1 rounded-2xl border border-white/[0.08] bg-black/40 p-1 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
                <Link href="/dashboard" className="btn-nav-ghost rounded-xl px-3 text-[0.8125rem] lg:px-4 lg:text-sm">
                  {t('nav.dashboard')}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    closeMobile();
                  }}
                  className="btn-nav-ghost rounded-xl px-3 text-[0.8125rem] lg:px-4 lg:text-sm"
                >
                  {t('nav.signOut')}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 lg:gap-2">
                <Link
                  href="/login"
                  className="group inline-flex h-10 items-center gap-1.5 rounded-xl border border-white/[0.1] bg-black/35 px-3 text-[0.8125rem] font-semibold text-brand-muted shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] transition duration-200 hover:border-white/[0.14] hover:bg-[var(--brand-surface-hover)] hover:text-brand-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-page lg:gap-2 lg:px-4 lg:text-sm"
                >
                  <LogIn className="h-3.5 w-3.5 shrink-0 text-brand-accent/90 lg:h-4 lg:w-4" strokeWidth={2} aria-hidden />
                  {t('nav.signIn')}
                </Link>
                <Link
                  href="/register"
                  className="btn-primary-sm group inline-flex !h-10 min-h-10 items-center gap-1.5 rounded-xl !px-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-page lg:!h-11 lg:min-h-11 lg:gap-2 lg:!px-5"
                >
                  <span className="hidden h-7 w-7 items-center justify-center rounded-lg bg-black/20 text-brand-on-accent shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] min-[1280px]:flex">
                    <UserPlus className="h-4 w-4" strokeWidth={2.25} aria-hidden />
                  </span>
                  <span className="text-[0.8125rem] lg:text-sm">{t('nav.register')}</span>
                  <ArrowRight
                    className="h-3.5 w-3.5 opacity-90 transition-transform duration-200 group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:hidden">
            <LanguageSwitcher compact />
            <button
              type="button"
              className="btn-icon-header"
              onClick={() => setMobileOpen((o) => !o)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
              aria-label={mobileOpen ? t('nav.closeMenu') : t('nav.openMenu')}
            >
            {mobileOpen ? (
              <X className="h-5 w-5" strokeWidth={1.5} />
            ) : (
              <Menu className="h-5 w-5" strokeWidth={1.5} />
            )}
          </button>
          </div>
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
              <div className="mx-auto max-w-6xl px-3 py-5 sm:px-4">
                <p className="mb-3 text-[0.625rem] font-semibold uppercase tracking-[0.2em] text-brand-subtle">
                  {t('nav.navigate')}
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
                  {t('nav.account')}
                </p>
                {user ? (
                  <div className="flex flex-col gap-2">
                    <Link
                      href="/dashboard"
                      onClick={closeMobile}
                      className="btn-mobile-primary"
                    >
                      {t('nav.dashboard')}
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        closeMobile();
                      }}
                      className="btn-mobile-secondary"
                    >
                      {t('nav.signOut')}
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
                      {t('nav.signIn')}
                    </Link>
                    <Link
                      href="/register"
                      onClick={closeMobile}
                      className="btn-mobile-primary inline-flex items-center justify-center gap-2"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/25 text-brand-on-accent shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                        <UserPlus className="h-4 w-4" strokeWidth={2.25} aria-hidden />
                      </span>
                      {t('nav.createAccount')}
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
          className="border-b border-brand-border-muted px-3 pb-20 pt-16 sm:px-4 sm:pb-24 sm:pt-20 lg:px-5"
        >
          <div className="mx-auto max-w-6xl">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-14">
              <Reveal>
                <div className="max-w-xl lg:max-w-none">
                  <p className="prose-landing-tight mb-5 inline-flex items-center gap-2 text-[0.8125rem] font-medium">
                    <span className="h-px w-8 bg-brand-subtle" aria-hidden />
                    {t('hero.eyebrow')}
                  </p>
                  <h1 className="text-balance text-4xl font-semibold tracking-[-0.03em] text-brand-heading sm:text-5xl lg:text-[3.1rem] lg:leading-[1.08]">
                    {t('hero.title')}
                  </h1>
                  <p className="prose-landing mt-6 text-pretty text-base leading-[1.65] sm:text-lg">
                    {t('hero.subtitle')}
                  </p>
                  <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Link
                      href="/login"
                      className="btn-primary group focus-visible:outline-none"
                    >
                      {t('hero.openDashboard')}
                      <ArrowRight
                        className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                        aria-hidden
                      />
                    </Link>
                    <a href="#features" className="btn-secondary">
                      {t('hero.exploreCapabilities')}
                    </a>
                  </div>
                </div>
              </Reveal>
              <Reveal delay={120} className="relative">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/[0.08] bg-black/40 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.85),inset_0_1px_0_0_rgba(255,255,255,0.06)]">
                  <Image
                    {...UNSPLASH_IMG}
                    src={landingImages.hero.src}
                    alt={landingImages.hero.alt}
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
                      {t('hero.snapshotLabel')}
                    </p>
                    <p className="mt-1 text-sm font-medium text-brand-heading">
                      {t('hero.snapshotText')}
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>

            <dl className="mt-16 grid grid-cols-2 gap-3 sm:mt-20 lg:grid-cols-4 lg:gap-4">
              {stats.map((row, i) => (
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

        <section
          id="winners"
          className="border-b border-brand-border-muted px-3 py-16 sm:px-4 sm:py-20 lg:px-5"
        >
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <div className="mb-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
                <div className="max-w-2xl">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-brand-subtle">
                    {t('winners.eyebrow')}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-brand-heading sm:text-3xl">
                    {t('winners.title')}
                  </h2>
                  <p className="prose-landing mt-3 max-w-xl leading-[1.65]">
                    {t('winners.subtitle')}
                  </p>
                </div>
                <Link
                  href={user ? '/dashboard/user/drawings' : '/register'}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-black/30 px-5 py-2.5 text-sm font-semibold text-brand-heading shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] transition hover:border-brand-accent/35 hover:bg-[var(--brand-accent-soft)]"
                >
                  {user ? t('winners.viewDrawings') : t('winners.createAccount')}
                  <ChevronRight className="h-4 w-4 opacity-80" aria-hidden />
                </Link>
              </div>
            </Reveal>

            {winnersLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="animate-pulse rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#0d0f14] to-[#060709] p-5"
                  >
                    <div className="h-4 w-20 rounded bg-white/[0.06]" />
                    <div className="mt-4 flex gap-4">
                      <div className="h-14 w-14 shrink-0 rounded-2xl bg-white/[0.06]" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-full rounded bg-white/[0.06]" />
                        <div className="h-3 w-4/5 rounded bg-white/[0.04]" />
                      </div>
                    </div>
                    <div className="mt-4 h-16 rounded-xl bg-white/[0.04]" />
                  </div>
                ))}
              </div>
            ) : winnerRows.length === 0 ? (
              <Reveal delay={80}>
                <div className="flex flex-col items-center rounded-2xl border border-white/[0.08] bg-black/20 px-6 py-14 text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/25 bg-amber-500/10 text-amber-200/95">
                    <Trophy className="h-7 w-7" strokeWidth={1.5} aria-hidden />
                  </span>
                  <p className="mt-4 max-w-md text-sm leading-relaxed text-brand-muted">
                    {t('winners.empty')}
                  </p>
                  {!user ? (
                    <Link href="/login" className="btn-primary mt-6 inline-flex items-center gap-2">
                      {t('winners.signIn')}
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                  ) : null}
                </div>
              </Reveal>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {winnerRows.slice(0, 9).map((row, i) => {
                  const name = row.winner?.name || t('winners.member');
                  const prize = winnerPrizeLine(row, t);
                  const drawLabel = row.draw_date
                    ? new Date(row.draw_date).toLocaleString(locale === 'es' ? 'es' : 'en', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })
                    : '—';
                  const detailHref = row.slug
                    ? user
                      ? `/dashboard/user/drawings/${encodeURIComponent(row.slug)}`
                      : `/login`
                    : '/login';

                  return (
                    <Reveal key={row.id} delay={i * 55}>
                      <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.1] bg-gradient-to-br from-[#0d0f14] via-[#0a0b10] to-[#060709] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition hover:border-amber-400/25">
                        <div
                          className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-amber-500/[0.07] blur-2xl transition group-hover:bg-amber-500/[0.12]"
                          aria-hidden
                        />
                        <div className="relative">
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/25 bg-amber-500/10 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-amber-200/95">
                            <Trophy className="h-3.5 w-3.5" aria-hidden />
                            {t('winners.win')}
                          </span>
                        </div>
                        <div className="relative mt-4 flex gap-3">
                          <div
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/[0.1] bg-gradient-to-br from-amber-500/20 to-amber-600/5 text-sm font-bold text-amber-100 shadow-inner"
                            aria-hidden
                          >
                            {winnerInitials(name)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-brand-heading">{name}</p>
                            <p className="mt-0.5 text-xs leading-relaxed text-brand-muted">
                              <span className="text-brand-subtle">{t('winners.won')}</span>{' '}
                              <span className="font-medium text-brand-heading/95">
                                &ldquo;{row.title || t('winners.drawing')}&rdquo;
                              </span>
                            </p>
                          </div>
                        </div>
                        <div className="relative mt-4 flex flex-1 flex-col gap-2 rounded-xl border border-white/[0.06] bg-black/30 p-3">
                          <div className="flex items-start gap-2 text-sm">
                            <Award className="mt-0.5 h-4 w-4 shrink-0 text-amber-300/80" aria-hidden />
                            <div className="min-w-0">
                              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">
                                {t('winners.prize')}
                              </p>
                              <p className="mt-0.5 font-medium leading-snug text-brand-heading">{prize}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2 border-t border-white/[0.05] pt-2 text-sm">
                            <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-brand-subtle" aria-hidden />
                            <div className="min-w-0">
                              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">
                                {t('winners.drawDate')}
                              </p>
                              <p className="mt-0.5 text-brand-muted">{drawLabel}</p>
                            </div>
                          </div>
                        </div>
                        <Link
                          href={detailHref}
                          className="relative mt-4 inline-flex w-full items-center justify-center gap-1 rounded-xl border border-white/[0.1] bg-white/[0.04] py-2.5 text-sm font-semibold text-brand-heading transition hover:border-amber-400/30 hover:bg-amber-500/10 hover:text-amber-50"
                        >
                          <Sparkles className="h-4 w-4 text-amber-300/90" aria-hidden />
                          {user ? t('winners.viewDrawing') : t('winners.signInToExplore')}
                          <ChevronRight className="h-4 w-4 opacity-70" aria-hidden />
                        </Link>
                      </article>
                    </Reveal>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="border-b border-brand-border-muted px-3 py-16 sm:px-4 lg:px-5">
          <div className="mx-auto max-w-6xl">
            <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
              <Reveal className="order-2 lg:order-1">
                <div className="relative aspect-[16/11] overflow-hidden rounded-2xl border border-white/[0.08] bg-black/30 shadow-[0_32px_64px_-48px_rgba(0,0,0,0.9)]">
                  <Image
                    {...UNSPLASH_IMG}
                    src={landingImages.operations.src}
                    alt={landingImages.operations.alt}
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
                      {t('why.ledgerLabel')}
                    </p>
                    <p className="mt-1 text-sm text-brand-heading">
                      {t('why.ledgerText')}
                    </p>
                  </div>
                </div>
              </Reveal>
              <Reveal delay={80} className="order-1 lg:order-2">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-brand-subtle">
                  {t('why.eyebrow')}
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-brand-heading sm:text-3xl">
                  {t('why.title')}
                </h2>
                <p className="prose-landing mt-4 leading-[1.65]">
                  {t('why.subtitle')}
                </p>
                <ul className="mt-8 space-y-4">
                  {whyBullets.map((line) => (
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
          className="border-b border-brand-border-muted px-3 py-20 sm:px-4 lg:px-5"
        >
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 grid gap-10 lg:grid-cols-12 lg:items-end">
              <Reveal className="lg:col-span-5">
                <h2 className="text-2xl font-semibold tracking-tight text-brand-heading sm:text-3xl">
                  {t('tokensSection.title')}
                </h2>
                <p className="prose-landing mt-3 leading-[1.65]">
                  {t('tokensSection.subtitle')}
                </p>
              </Reveal>
              <Reveal delay={60} className="relative lg:col-span-7">
                <div className="relative aspect-[21/9] max-h-[220px] overflow-hidden rounded-2xl border border-white/[0.07] bg-black/40">
                  <Image
                    {...UNSPLASH_IMG}
                    src={landingImages.tokens.src}
                    alt={landingImages.tokens.alt}
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 1024px) 100vw, 58vw"
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-brand-page via-brand-page/30 to-transparent"
                    aria-hidden
                  />
                  <p className="absolute bottom-4 left-5 text-xs font-medium text-brand-subtle sm:left-6">
                    {t('tokensSection.caption')}
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
          className="border-b border-brand-border-muted px-3 py-20 sm:px-4 lg:px-5"
        >
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <div className="mb-10 max-w-2xl">
                <h2 className="text-2xl font-semibold tracking-tight text-brand-heading sm:text-3xl">
                  {t('features.title')}
                </h2>
                <p className="prose-landing mt-3 leading-[1.65]">
                  {t('features.subtitle')}
                </p>
              </div>
            </Reveal>
            <Reveal delay={40}>
              <div className="relative mb-12 overflow-hidden rounded-2xl border border-white/[0.06]">
                <div className="relative aspect-[21/8] min-h-[140px] sm:aspect-[21/7]">
                  <Image
                    {...UNSPLASH_IMG}
                    src={landingImages.modules.src}
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
                      {t('features.bannerEyebrow')}
                    </p>
                    <p className="mt-2 max-w-lg text-lg font-semibold text-brand-heading sm:text-xl">
                      {t('features.bannerTitle')}
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
          className="border-b border-brand-border-muted px-3 py-20 sm:px-4 lg:px-5"
        >
          <div className="mx-auto max-w-6xl">
            <div className="grid items-stretch gap-10 lg:grid-cols-2 lg:gap-14">
              <Reveal className="relative min-h-[280px] overflow-hidden rounded-2xl border border-white/[0.08] bg-black/40 lg:min-h-[360px]">
                <Image
                  {...UNSPLASH_IMG}
                  src={landingImages.payments.src}
                  alt={landingImages.payments.alt}
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
                    {t('payments.imageEyebrow')}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-brand-muted">
                    {t('payments.imageText')}
                  </p>
                </div>
              </Reveal>
              <div>
                <Reveal>
                  <div className="mb-10 max-w-xl">
                    <h2 className="text-2xl font-semibold tracking-tight text-brand-heading sm:text-3xl">
                      {t('payments.title')}
                    </h2>
                    <p className="prose-landing mt-3 leading-[1.65]">
                      {t('payments.subtitle')}
                    </p>
                  </div>
                </Reveal>
                <div className="max-w-md space-y-3">
                  {paymentMethods.map((method, i) => (
                    <Reveal key={method.name} delay={i * 70}>
                      <div className="flex items-center gap-4 rounded-xl border border-brand-border-muted bg-[var(--brand-surface)] p-5 transition duration-300 hover:border-brand-border hover:bg-[var(--brand-surface-hover)]">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-brand-border bg-brand-page shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
                          <method.icon className="h-6 w-6 text-brand-accent" strokeWidth={1.5} />
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-brand-heading">{method.name}</p>
                          <p
                            className={`mt-0.5 text-sm font-medium ${
                              method.statusKey === 'available'
                                ? 'text-emerald-400/90'
                                : 'text-brand-subtle'
                            }`}
                          >
                            {t(`payments.${method.statusKey}`)}
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

        <section className="px-3 py-20 sm:px-4 lg:px-5">
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <div className="relative min-h-[320px] overflow-hidden rounded-2xl border border-white/[0.1] shadow-[0_32px_80px_-40px_rgba(0,0,0,0.75)] sm:min-h-[340px]">
                <Image
                  {...UNSPLASH_IMG}
                  src={landingImages.cta.src}
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
                    {t('cta.title')}
                  </h2>
                  <p className="prose-landing mt-4 leading-[1.65] text-brand-muted">
                    {t('cta.subtitle')}
                  </p>
                  <Link
                    href="/login"
                    className="btn-primary group mt-8 w-fit focus-visible:outline-none"
                  >
                    {t('cta.button')}
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

        <div className="relative mx-auto max-w-6xl px-3 pb-10 pt-14 sm:px-4 sm:pb-12 sm:pt-16 lg:px-5">
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
                    {t('brand.name')}
                  </span>
                  <span className="mt-1 block text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-brand-subtle">
                    {t('brand.tagline')}
                  </span>
                </span>
              </Link>
              <p className="prose-landing mt-5 max-w-sm text-sm leading-relaxed">
                {t('footer.blurb')}
              </p>
              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-brand-border-muted bg-[var(--brand-surface)] px-3 py-1.5 text-[0.6875rem] font-medium text-brand-subtle">
                <Lock className="h-3.5 w-3.5 shrink-0 text-brand-accent/80" aria-hidden />
                {t('footer.sessionProtected')}
              </div>
            </div>

            <div className="grid gap-10 sm:grid-cols-2 lg:col-span-7 lg:grid-cols-3 lg:gap-10">
              <div>
                <p className="text-[0.625rem] font-semibold uppercase tracking-[0.2em] text-brand-subtle">
                  {t('footer.onThisPage')}
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
                  {t('footer.workspace')}
                </p>
                <ul className="mt-4 space-y-2.5">
                  <li>
                    <Link href="/login" className="link-footer">
                      <span className="link-footer-mark" aria-hidden />
                      {t('nav.signIn')}
                    </Link>
                  </li>
                  {user ? (
                    <li>
                      <Link href="/dashboard" className="link-footer">
                        <span className="link-footer-mark" aria-hidden />
                        {t('nav.dashboard')}
                      </Link>
                    </li>
                  ) : (
                    <li>
                      <Link href="/register" className="link-footer">
                        <span className="link-footer-mark" aria-hidden />
                        {t('nav.register')}
                      </Link>
                    </li>
                  )}
                </ul>
              </div>

              <div className="sm:col-span-2 lg:col-span-1">
                <p className="text-[0.625rem] font-semibold uppercase tracking-[0.2em] text-brand-subtle">
                  {t('footer.legal')}
                </p>
                <ul className="mt-4 space-y-2.5">
                  <li>
                    <Link href="/privacy" className="link-footer">
                      <span className="link-footer-mark" aria-hidden />
                      {t('footer.privacy')}
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms" className="link-footer">
                      <span className="link-footer-mark" aria-hidden />
                      {t('footer.terms')}
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-14 flex flex-col gap-4 border-t border-brand-border-muted pt-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-brand-subtle">
              {t('footer.copyright', { year: new Date().getFullYear() })}
            </p>
            <p className="text-xs text-brand-subtle sm:max-w-[22rem] sm:text-right">
              {t('footer.disclaimer')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

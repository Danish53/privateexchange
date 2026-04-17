'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Menu, X, ChevronDown, LayoutDashboard, User } from 'lucide-react';
import { getSuperadminNavSections } from '@/components/superadmin-dashboard/nav-config';
import { emailInitials } from '@/components/user-dashboard/utils';
import { avatarSrc } from '@/lib/avatarUrl';
import { isSuperAdminNavActive } from '@/components/superadmin-dashboard/utils';

const PROFILE_HREF = '/dashboard/superadmin/profile';

export default function SuperAdminDashboardShell({ user, onLogout, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { main: navMain, account: navAccount } = getSuperadminNavSections(user);
  const [mobileNav, setMobileNav] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  const initials = emailInitials(user?.email);
  const profileActive = isSuperAdminNavActive(pathname, PROFILE_HREF);

  useEffect(() => {
    function handleClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const openProfile = () => {
    router.push(PROFILE_HREF);
    setUserMenuOpen(false);
    setMobileNav(false);
  };

  function NavRow({ item, onNavigate }) {
    if (!item) return null;
    const active = !item.disabled && isSuperAdminNavActive(pathname, item.href);
    const Icon = item.icon;
    const disabled = Boolean(item.disabled);

    const rowClass = `group flex items-start gap-3 rounded-lg border-l-[3px] py-2.5 pl-3 pr-2 text-left transition-[border-color,background-color,color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--brand-page)] ${
      disabled
        ? 'cursor-not-allowed border-l-transparent opacity-[0.42] text-brand-muted'
        : active
          ? 'border-l-brand-accent bg-[var(--brand-accent-soft)]/85 text-brand-heading shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]'
          : 'border-l-transparent text-brand-muted hover:bg-white/[0.045] hover:text-brand-heading'
    }`;

    const iconWrapClass = `mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors duration-200 ${
      disabled
        ? 'border-white/[0.04] bg-white/[0.02] text-brand-subtle/50'
        : active
          ? 'border-brand-accent/25 bg-black/40 text-brand-accent'
          : 'border-white/[0.06] bg-white/[0.04] text-brand-subtle group-hover:border-white/[0.1] group-hover:bg-white/[0.07] group-hover:text-brand-heading'
    }`;

    const descClass = disabled
      ? 'mt-0.5 block truncate text-[0.65rem] font-normal leading-snug text-brand-subtle/50'
      : 'mt-0.5 block truncate text-[0.65rem] font-normal leading-snug text-brand-subtle/85 group-hover:text-brand-muted';

    const inner = (
      <>
        <span className={iconWrapClass}>
          <Icon className="h-[1.125rem] w-[1.125rem]" strokeWidth={2} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[0.8125rem] font-medium leading-tight tracking-tight">{item.label}</span>
          {item.description ? <span className={descClass}>{item.description}</span> : null}
        </span>
      </>
    );

    if (disabled) {
      return (
        <span
          className={rowClass}
          aria-disabled="true"
          title="Your administrator has not granted access to this section."
        >
          {inner}
        </span>
      );
    }

    return (
      <Link
        href={item.href}
        onClick={() => onNavigate?.()}
        aria-current={active ? 'page' : undefined}
        className={rowClass}
      >
        {inner}
      </Link>
    );
  }

  function SidebarContent({ onNavigate }) {
    return (
      <>
        <div className="shrink-0 px-4 pb-5 pt-5">
          <Link
            href="/dashboard/superadmin"
            onClick={() => onNavigate?.()}
            className="btn-primary flex w-full items-center justify-between gap-2 rounded-xl px-4 py-3 text-sm font-semibold tracking-tight text-brand-on-accent"
          >
            <span>Operations overview</span>
            <LayoutDashboard className="h-4 w-4 shrink-0 opacity-95" strokeWidth={2.5} aria-hidden />
          </Link>
        </div>

        <nav
          className="sidebar-nav-scroll min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-2.5 pb-2"
          aria-label="Platform navigation"
        >
          <p className="px-2 pb-2 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-brand-subtle">
            Platform
          </p>
          <div className="flex flex-col gap-0.5">
            {navMain.map((item) => (
              <NavRow key={item.href} item={item} onNavigate={onNavigate} />
            ))}
          </div>
        </nav>

        <div className="shrink-0 border-t border-white/[0.06] bg-black/[0.12] px-2.5 pb-4 pt-4">
          <p className="px-2 pb-2 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-brand-subtle">
            Account
          </p>
          <div className="flex flex-col gap-0.5">
            {navAccount.map((item) => (
              <NavRow key={item.href} item={item} onNavigate={onNavigate} />
            ))}
          </div>
        </div>

        {/* <div className="shrink-0 border-t border-white/[0.06] bg-black/[0.12] px-2.5 pb-5 pt-4">
          <p className="px-2 pb-2 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-brand-subtle">
            Session
          </p>
          <button
            type="button"
            onClick={() => {
              onNavigate?.();
              onLogout();
            }}
            className="group flex w-full items-start gap-3 rounded-lg border-l-[3px] border-l-transparent py-2.5 pl-3 pr-2 text-left text-brand-muted transition-[background-color,color] duration-200 hover:bg-white/[0.045] hover:text-brand-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/35"
          >
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.04] text-brand-subtle transition-colors group-hover:text-red-300">
              <LogOut className="h-[1.125rem] w-[1.125rem]" strokeWidth={2} aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[0.8125rem] font-medium leading-tight tracking-tight">Sign out</span>
              <span className="mt-0.5 block truncate text-[0.65rem] font-normal leading-snug text-brand-subtle/85">
                End session securely
              </span>
            </span>
          </button>
        </div> */}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-brand-page font-sans text-brand-foreground">
      <div className="pointer-events-none fixed inset-0 bg-brand-hero-radial opacity-90" aria-hidden />
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_55%_40%_at_100%_0%,rgba(51,65,85,0.28),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 bg-gradient-to-b from-transparent to-brand-page"
        aria-hidden
      />

      <header className="sticky top-0 z-40 border-b border-brand-border-muted bg-brand-page/90 shadow-[inset_0_-1px_0_0_rgba(255,255,255,0.05)] backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex h-[3.75rem] max-w-[1600px] items-center justify-between gap-3 px-4 sm:h-16 sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileNav(true)}
              className="btn-icon-header lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" strokeWidth={1.5} />
            </button>
            <Link href="/dashboard/superadmin" className="group flex min-w-0 items-center gap-2.5 rounded-xl py-1 sm:gap-3">
              <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.1] bg-gradient-to-b from-white/[0.08] to-white/[0.02] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] transition duration-200 group-hover:border-white/[0.14] group-hover:shadow-[0_0_0_1px_rgba(201,162,39,0.12)] sm:h-10 sm:w-10">
                <span className="absolute inset-x-2 top-1 h-px rounded-full bg-gradient-to-r from-transparent via-brand-accent/40 to-transparent" />
                <span className="font-bold tabular-nums text-sm text-brand-accent sm:text-[0.9375rem]">
                  759
                </span>
              </span>
              <span className="hidden min-w-0 sm:block">
                <span className="flex items-center gap-2">
                  <span className="block truncate text-sm font-semibold tracking-tight text-brand-heading">
                    Private Exchange
                  </span>
                  {/* <span className="hidden shrink-0 rounded-md border border-brand-accent/20 bg-brand-accent/10 px-1.5 py-0.5 text-[0.5625rem] font-semibold uppercase tracking-[0.12em] text-brand-accent md:inline">
                    Operations
                  </span> */}
                </span>
                <span className="mt-0.5 block text-[0.625rem] font-medium uppercase tracking-[0.14em] text-brand-subtle">
                  Control center
                </span>
              </span>
            </Link>
          </div>

          <div className="relative flex flex-shrink-0 items-center gap-2 sm:gap-3" ref={userMenuRef}>
            <div className="hidden text-right md:block">
              <p className="max-w-[220px] truncate text-xs font-medium text-brand-heading lg:max-w-[280px]">
                {user.email}
              </p>
              <p className="text-[0.625rem] font-medium uppercase tracking-[0.14em] text-brand-subtle">
                {user?.role === 'superadmin' ? 'Platform operations' : 'Delegated access'}
              </p>
            </div>

            <div className="flex items-center gap-1 rounded-xl border border-brand-border-muted bg-black/25 p-1 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] sm:gap-1.5 sm:p-1.5">
              <button
                type="button"
                onClick={openProfile}
                title="Open profile"
                className={`group/avatar relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2a2418] to-[#0f0e0c] text-xs font-bold tracking-tight text-brand-accent ring-2 transition-all duration-200 sm:h-10 sm:w-10 sm:text-sm ${
                  profileActive
                    ? 'ring-brand-accent/70 shadow-[0_0_20px_-4px_rgba(201,162,39,0.45)]'
                    : 'ring-white/12 hover:scale-[1.03] hover:ring-brand-accent/45'
                }`}
                aria-label="Open profile"
              >
                <span
                  className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-accent/30 to-transparent opacity-90 transition-opacity group-hover/avatar:opacity-100"
                  aria-hidden
                />
                {user?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- user avatar (local or blob URL)
                  <img
                    src={avatarSrc(user.avatarUrl)}
                    alt=""
                    className="relative z-[1] h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <span className="relative z-[1]">{initials}</span>
                )}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setUserMenuOpen((o) => !o);
                }}
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 sm:h-9 sm:w-9 ${
                  userMenuOpen
                    ? 'bg-[var(--brand-surface-hover)] text-brand-accent'
                    : 'text-brand-subtle hover:bg-[var(--brand-surface-hover)] hover:text-brand-heading'
                }`}
                aria-expanded={userMenuOpen}
                aria-haspopup="menu"
                aria-label="Account actions"
              >
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}
                  strokeWidth={2}
                />
              </button>
            </div>

            {userMenuOpen && (
              <div
                className="absolute right-0 top-full z-[60] mt-2 w-[min(100vw-2rem,16.5rem)] origin-top-right rounded-xl border border-brand-border-strong bg-[var(--brand-page)] py-1 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.65),inset_0_1px_0_0_rgba(255,255,255,0.06)]"
                role="menu"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setUserMenuOpen(false);
                    openProfile();
                  }}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-brand-heading transition duration-150 hover:bg-[var(--brand-surface-hover)]"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-border-muted bg-black/30 text-brand-accent">
                    <User className="h-4 w-4" strokeWidth={1.5} />
                  </span>
                  <span>
                    <span className="block font-medium">Profile</span>
                    <span className="text-xs text-brand-subtle">Account & security</span>
                  </span>
                </button>
                <div className="my-1 h-px bg-brand-border-muted" role="separator" />
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setUserMenuOpen(false);
                    onLogout();
                  }}
                  className="group/logout flex w-full items-center gap-3 px-3 py-2.5 text-left transition duration-150 hover:bg-red-500/[0.08]"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/25 bg-red-500/[0.12] text-red-300 transition duration-150 group-hover/logout:border-red-400/40 group-hover/logout:bg-red-500/20">
                    <LogOut className="h-4 w-4" strokeWidth={1.5} />
                  </span>
                  <span>
                    <span className="block font-medium text-red-200/95">Sign out</span>
                    <span className="text-xs text-brand-subtle">End session securely</span>
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto flex max-w-[1600px] flex-1 gap-0 lg:gap-6">
        <aside className="relative sticky top-16 z-20 hidden h-[calc(100vh-4rem)] w-[272px] shrink-0 flex-col overflow-hidden border-r border-brand-border-muted bg-gradient-to-b from-[rgba(10,11,15,0.97)] via-[rgba(7,8,11,0.95)] to-[rgba(5,6,9,0.98)] shadow-[inset_-1px_0_0_0_rgba(255,255,255,0.04),4px_0_24px_-12px_rgba(0,0,0,0.5)] backdrop-blur-md lg:flex lg:flex-col xl:w-[280px]">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_45%_at_0%_0%,rgba(201,162,39,0.07),transparent_55%)]"
            aria-hidden
          />
          <div className="relative flex min-h-0 flex-1 flex-col">
            <SidebarContent />
          </div>
        </aside>

        {mobileNav && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
              aria-label="Close menu"
              onClick={() => setMobileNav(false)}
            />
            <div className="fixed inset-y-0 left-0 z-50 flex min-h-0 w-[min(100%,21rem)] flex-col overflow-hidden border-r border-brand-border-muted bg-gradient-to-b from-brand-page to-[#050508] shadow-2xl lg:hidden">
              <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-4 py-3">
                <div>
                  <span className="block text-sm font-semibold text-brand-heading">Operations</span>
                  <span className="text-[0.65rem] font-medium uppercase tracking-[0.12em] text-brand-subtle">
                    Private Exchange
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileNav(false)}
                  className="rounded-lg p-2 text-brand-muted hover:bg-[var(--brand-surface-hover)] hover:text-brand-heading"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
                <SidebarContent onNavigate={() => setMobileNav(false)} />
              </div>
            </div>
          </>
        )}

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:py-8 lg:pr-8">{children}</main>
      </div>
    </div>
  );
}

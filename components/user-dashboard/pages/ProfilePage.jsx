'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import {
  Mail,
  User,
  Phone,
  Globe,
  Clock,
  Shield,
  CheckCircle2,
  Lock,
  Camera,
} from 'lucide-react';
import { useAuth } from '@/components/auth-context';
import PasswordField from '@/components/auth/PasswordField';
import Spinner from '@/components/ui/Spinner';
import Panel from '@/components/user-dashboard/Panel';
import { emailInitials } from '@/components/user-dashboard/utils';
import { avatarSrc } from '@/lib/avatarUrl';
import { useWebsiteT } from '@/components/i18n/WebsiteLocaleProvider';

function getTimezones(t) {
  return [
    { value: '', label: t('dashboard.profile.selectTimezone') },
    { value: 'America/New_York', label: t('dashboard.profile.timezones.eastern') },
    { value: 'America/Chicago', label: t('dashboard.profile.timezones.central') },
    { value: 'America/Denver', label: t('dashboard.profile.timezones.mountain') },
    { value: 'America/Los_Angeles', label: t('dashboard.profile.timezones.pacific') },
    { value: 'Europe/London', label: t('dashboard.profile.timezones.london') },
    { value: 'Asia/Dubai', label: t('dashboard.profile.timezones.dubai') },
    { value: 'Asia/Karachi', label: t('dashboard.profile.timezones.karachi') },
  ];
}

export default function ProfilePage() {
  const { t, locale } = useWebsiteT();
  const timezones = useMemo(() => getTimezones(t), [t]);
  const { user, updateProfile, token } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [timezone, setTimezone] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSaved, setPwSaved] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [avatarBroken, setAvatarBroken] = useState(false);
  const avatarInputRef = useRef(/** @type {HTMLInputElement | null} */ (null));

  useEffect(() => {
    setAvatarBroken(false);
  }, [user?.avatarUrl]);

  useEffect(() => {
    if (!user) return;
    setDisplayName(user.displayName ?? user.name ?? '');
    setPhone(user.phone ?? '');
    setCountry(user.country ?? '');
    setTimezone(user.timezone ?? '');
  }, [user]);

  const initials = emailInitials(user?.email);
  const avatarLetter = displayName?.trim()
    ? displayName
        .trim()
        .split(/\s+/)
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : initials;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaved(false);
    if (!token) {
      setError(t('dashboard.profile.notSignedIn'));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: displayName.trim(),
          phone: phone.trim(),
          country: country.trim(),
          timezone,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = [data.error, data.detail].filter(Boolean).join(' — ');
        setError(msg || t('dashboard.profile.couldNotSave'));
        return;
      }
      if (data.user) {
        updateProfile({
          ...data.user,
          displayName: data.user.name || '',
        });
      }
      setSaved(true);
      window.setTimeout(() => setSaved(false), 3500);
    } catch {
      setError(t('dashboard.common.networkError'));
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarChange(/** @type {React.ChangeEvent<HTMLInputElement>} */ e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !token) return;
    setAvatarError('');
    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/auth/avatar', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = [data.error, data.detail].filter(Boolean).join(' — ');
        setAvatarError(msg || t('dashboard.profile.couldNotUpload'));
        return;
      }
      if (data.user) {
        updateProfile({
          ...data.user,
          displayName: data.user.name || '',
        });
      }
    } catch {
      setAvatarError(t('dashboard.common.networkError'));
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPwError('');
    setPwSaved(false);
    if (newPw !== confirmPw) {
      setPwError(t('dashboard.profile.passwordMismatch'));
      return;
    }
    if (newPw.length < 8) {
      setPwError(t('dashboard.profile.passwordMinLength'));
      return;
    }
    if (!token) {
      setPwError(t('dashboard.profile.notSignedIn'));
      return;
    }
    setPwLoading(true);
    try {
      const res = await fetch('/api/auth/password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: currentPw,
          newPassword: newPw,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPwError(data.error || t('dashboard.profile.couldNotSave'));
        return;
      }
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      setPwSaved(true);
      window.setTimeout(() => setPwSaved(false), 3500);
    } catch {
      setPwError(t('dashboard.common.networkError'));
    } finally {
      setPwLoading(false);
    }
  }

  const memberSince =
    user?.createdAt &&
    (() => {
      try {
        return new Date(user.createdAt).toLocaleDateString(locale === 'es' ? 'es' : 'en', {
          month: 'short',
          year: 'numeric',
        });
      } catch {
        return null;
      }
    })();

  return (
    <>
      <header className="mb-8 sm:mb-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-brand-subtle">
              {t('dashboard.profile.eyebrow')}
            </p>
            <h1 className="mt-1.5 text-2xl font-semibold tracking-[-0.03em] text-brand-heading sm:text-[1.75rem]">
              {t('dashboard.profile.title')}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-brand-muted">
              {t('dashboard.profile.subtitle')}
            </p>
          </div>
          <p className="shrink-0 text-xs font-medium tabular-nums text-brand-subtle">
            {user?.role === 'user'
              ? t('dashboard.shell.user')
              : user?.role === 'superadmin'
                ? t('dashboard.profile.platformOperations')
                : user?.role === 'admin'
                  ? t('dashboard.profile.admin')
                  : user?.role}
          </p>
        </div>
      </header>

      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-2xl border border-white/[0.1] bg-gradient-to-br from-[var(--brand-accent-soft)]/2 via-[#0a0b0f] to-black/45 p-6 sm:p-8">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_0%_0%,rgba(201,162,39,0.12),transparent_55%)]"
            aria-hidden
          />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-5">
              <div className="relative">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="sr-only"
                aria-label={t('dashboard.profile.uploadPhoto')}
                  onChange={handleAvatarChange}
                  disabled={avatarUploading}
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarUploading || !token}
                  className="group relative flex h-20 w-20 overflow-hidden rounded-2xl border border-brand-accent/25 bg-gradient-to-br from-[#2a2418] to-[#0f0e0c] shadow-[0_0_32px_-8px_rgba(201,162,39,0.35)] sm:h-[5.5rem] sm:w-[5.5rem] disabled:opacity-60"
                >
                  {user?.avatarUrl && !avatarBroken ? (
                    // eslint-disable-next-line @next/next/no-img-element -- user-uploaded dynamic URL
                    <img
                      key={user.avatarUrl}
                      src={avatarSrc(user.avatarUrl)}
                      alt=""
                      className="h-full w-full object-cover"
                      onError={() => setAvatarBroken(true)}
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-xl font-bold tracking-tight text-brand-accent sm:text-2xl">
                      {avatarLetter}
                    </span>
                  )}
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                    <Camera className="h-6 w-6 text-white" strokeWidth={1.75} aria-hidden />
                  </span>
                  {avatarUploading ? (
                    <span className="absolute inset-0 z-[1] flex items-center justify-center bg-black/60">
                      <Spinner size="md" variant="muted" />
                    </span>
                  ) : null}
                </button>
                <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/20 text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" strokeWidth={2} aria-hidden />
                </span>
              </div>
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold text-brand-heading sm:text-xl">
                  {displayName?.trim() || user?.email?.split('@')[0] || t('dashboard.shell.user')}
                </p>
                <p className="mt-1 truncate text-sm text-brand-muted">{user?.email}</p>
                {avatarError ? (
                  <p className="mt-2 text-xs text-red-300/90">{avatarError}</p>
                ) : null}
                <p className="mt-2 text-xs text-brand-subtle">
                  {t('dashboard.profile.avatarUploadHint')}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/[0.1] px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-emerald-200/95">
                    <Mail className="h-3 w-3" strokeWidth={2} aria-hidden />
                    {t('dashboard.profile.email')}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.04] px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-brand-subtle">
                    <Shield className="h-3 w-3 text-brand-accent" strokeWidth={2} aria-hidden />
                    {t('dashboard.membership.active')}
                  </span>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-black/35 px-4 py-3 text-sm text-brand-muted shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] sm:max-w-xs sm:text-right">
              <p className="font-medium text-brand-heading">{t('dashboard.common.date')}</p>
              <p className="mt-1 text-xs">{memberSince || '—'}</p>
            </div>
          </div>
        </section>

        <Panel title={t('dashboard.profile.updateProfile')} subtitle={t('dashboard.profile.updateProfileSub')}>
          <form className="mx-auto max-w-2xl space-y-6" onSubmit={handleSubmit}>
            {error ? (
              <div
                className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200/90"
                role="alert"
              >
                {error}
              </div>
            ) : null}
            <div className="rounded-xl border border-white/[0.06] bg-black/[0.2] px-4 py-4 sm:px-5">
              <label className="auth-label" htmlFor="profile-email">
                  {t('dashboard.profile.email')}
              </label>
              <input
                id="profile-email"
                type="email"
                className="auth-input mt-2 bg-white/[0.03]"
                value={user?.email ?? ''}
                disabled
                readOnly
              />
              <p className="auth-hint mt-2">{t('dashboard.profile.emailChangeHint')}</p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="auth-label" htmlFor="displayName">
                  {t('dashboard.profile.displayName')}
                </label>
                <div className="relative mt-2">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-subtle" aria-hidden />
                  <input
                    id="displayName"
                    className="auth-input pl-10"
                  placeholder={t('dashboard.profile.displayName')}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    autoComplete="name"
                  />
                </div>
              </div>
              <div>
                <label className="auth-label" htmlFor="phone">
                  {t('dashboard.profile.phone')}
                </label>
                <div className="relative mt-2">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-subtle" aria-hidden />
                  <input
                    id="phone"
                    type="tel"
                    className="auth-input pl-10 tabular-nums"
                    placeholder="+1 · optional"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoComplete="tel"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="auth-label" htmlFor="country">
                  {t('dashboard.profile.country')}
                </label>
                <div className="relative mt-2">
                  <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-subtle" aria-hidden />
                  <input
                    id="country"
                    className="auth-input pl-10"
                    placeholder="e.g. United States"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    autoComplete="country-name"
                  />
                </div>
              </div>
              <div>
                <label className="auth-label" htmlFor="timezone">
                  {t('dashboard.profile.timezone')}
                </label>
                <div className="relative mt-2">
                  <Clock className="pointer-events-none absolute left-3 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-brand-subtle" aria-hidden />
                  <select
                    id="timezone"
                    className="auth-input appearance-none pl-10 pr-10"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                  >
                    {timezones.map((tz) => (
                      <option key={tz.value || 'empty'} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-brand-subtle" aria-hidden>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>

            {saved ? (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.08] px-4 py-3 text-sm text-emerald-200/95">
                <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                {t('dashboard.profile.profileSaved')}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="submit"
                disabled={saving}
                aria-busy={saving}
                className="btn-primary w-full justify-center gap-2 rounded-xl px-8 py-3.5 text-sm font-semibold disabled:opacity-60 sm:w-auto"
              >
                {saving ? <Spinner size="sm" variant="onAccent" /> : null}
                <span>{saving ? t('dashboard.common.saving') : t('dashboard.profile.saveChanges')}</span>
              </button>
            </div>
          </form>
        </Panel>

        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title={t('dashboard.profile.verification')} subtitle={t('dashboard.profile.verificationSub')}>
            <ul className="space-y-3">
              <li className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-black/[0.2] px-4 py-3">
                <span className="flex items-center gap-2 text-sm text-brand-heading">
                  <Mail className="h-4 w-4 text-brand-accent" strokeWidth={2} aria-hidden />
                  {t('dashboard.profile.email')}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-emerald-300/95">
                  <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                  {t('dashboard.common.approved')}
                </span>
              </li>
              <li className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-white/[0.1] bg-black/[0.12] px-4 py-3">
                <span className="flex items-center gap-2 text-sm text-brand-muted">
                  <Shield className="h-4 w-4 text-brand-subtle" strokeWidth={2} aria-hidden />
                  {t('dashboard.profile.idDocument')}
                </span>
                <span className="text-xs font-medium text-brand-subtle">{t('dashboard.profile.kycLiveLabel')}</span>
              </li>
            </ul>
          </Panel>

          <Panel title={t('dashboard.profile.security')} subtitle={t('dashboard.profile.securitySub')}>
            <form
              className="flex flex-col gap-4 rounded-xl border border-white/[0.06] bg-black/[0.2] px-4 py-5"
              onSubmit={handlePasswordSubmit}
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-brand-subtle">
                  <Lock className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </span>
                <div>
                  <p className="font-medium text-brand-heading">{t('dashboard.profile.updatePassword')}</p>
                  <p className="mt-1 text-sm text-brand-muted">
                    {t('dashboard.profile.passwordChangeHint')}
                  </p>
                </div>
              </div>
              {pwError ? (
                <div
                  className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200/90"
                  role="alert"
                >
                  {pwError}
                </div>
              ) : null}
              {pwSaved ? (
                <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/[0.08] px-3 py-2 text-sm text-emerald-200/95">
                  {t('dashboard.profile.passwordUpdated')}
                </div>
              ) : null}
              <PasswordField
                label={t('dashboard.profile.currentPassword')}
                value={currentPw}
                onChange={setCurrentPw}
                autoComplete="current-password"
                id="profile-current-pw"
              />
              <PasswordField
                label={t('dashboard.profile.newPassword')}
                value={newPw}
                onChange={setNewPw}
                autoComplete="new-password"
                id="profile-new-pw"
              />
              <PasswordField
                label={t('dashboard.profile.confirmPassword')}
                value={confirmPw}
                onChange={setConfirmPw}
                autoComplete="new-password"
                id="profile-confirm-pw"
              />
              <button
                type="submit"
                disabled={pwLoading}
                aria-busy={pwLoading}
                className="btn-secondary w-full justify-center gap-2 rounded-xl border-brand-border py-3 text-sm font-semibold disabled:opacity-60"
              >
                {pwLoading ? <Spinner size="sm" variant="accent" /> : null}
                <span>{pwLoading ? t('dashboard.common.saving') : t('dashboard.profile.updatePassword')}</span>
              </button>
            </form>
          </Panel>
        </div>
      </div>
    </>
  );
}

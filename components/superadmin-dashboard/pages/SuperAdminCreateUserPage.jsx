'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserPlus, Loader2, Crown } from 'lucide-react';
import { useAuth } from '@/components/auth-context';
import { useWebsiteT } from '@/components/i18n/WebsiteLocaleProvider';
import PasswordField from '@/components/auth/PasswordField';
import { cn } from '@/lib/utils';
import { formatCurrencySmart } from '@/lib/numberFormat';
import { DEFAULT_ADMIN_PERMISSIONS, mergeAdminPermissions } from '@/lib/adminPermissions';
import FeedbackMessage from '@/components/ui/FeedbackMessage';

function PermToggle({ id, label, checked, onChange, disabled = false }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-brand-border-muted bg-black/30 px-3 py-2.5 text-sm text-brand-muted transition hover:border-white/[0.08]">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="mt-0.5 h-4 w-4 rounded border-brand-border-muted bg-black/40 text-brand-accent focus:ring-brand-accent/30 disabled:opacity-40"
      />
      <span className="block font-medium text-brand-heading">{label}</span>
    </label>
  );
}

export default function SuperAdminCreateUserPage() {
  const { t } = useWebsiteT();
  const router = useRouter();
  const { token, user } = useAuth();
  const isSuperAdmin = user?.role === 'superadmin';
  const [role, setRole] = useState('user');
  const [isVip, setIsVip] = useState(false);
  const [adminPermissions, setAdminPermissions] = useState(() => ({ ...DEFAULT_ADMIN_PERMISSIONS }));
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [emailSent, setEmailSent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [membershipTiers, setMembershipTiers] = useState([]);
  const [membershipTiersLoading, setMembershipTiersLoading] = useState(false);
  const [manualMembershipTierId, setManualMembershipTierId] = useState(null);

  const loadMembershipTiers = useCallback(async () => {
    if (!token || !isSuperAdmin) return;
    setMembershipTiersLoading(true);
    try {
      const res = await fetch('/api/superadmin/membership-tiers', {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      setMembershipTiers(Array.isArray(data.tiers) ? data.tiers : []);
    } catch {
      setMembershipTiers([]);
    } finally {
      setMembershipTiersLoading(false);
    }
  }, [token, isSuperAdmin]);

  useEffect(() => {
    if (isSuperAdmin && role === 'user') {
      void loadMembershipTiers();
    } else {
      setMembershipTiers([]);
      setManualMembershipTierId(null);
    }
  }, [isSuperAdmin, role, loadMembershipTiers]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setEmailSent(null);
    if (password !== confirm) {
      setError(t('superadmin.createUser.errors.passwordMismatch'));
      return;
    }
    if (!token) {
      setError(t('superadmin.createUser.errors.notSignedIn'));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/superadmin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          name: name.trim(),
          role: isSuperAdmin ? role : 'user',
          isVip: (isSuperAdmin ? role : 'user') === 'user' ? isVip : false,
          ...(isSuperAdmin && role === 'admin'
            ? { adminPermissions: mergeAdminPermissions(adminPermissions) }
            : {}),
          ...(isSuperAdmin && role === 'user' && manualMembershipTierId
            ? { manualMembershipTierId }
            : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || t('superadmin.createUser.errors.couldNotCreate'));
        return;
      }
      setSuccess(data.message || t('superadmin.createUser.successDefault'));
      setEmailSent(data.credentialsEmailSent === true);
      setName('');
      setEmail('');
      setPassword('');
      setConfirm('');
      setIsVip(false);
      setManualMembershipTierId(null);
    } catch {
      setError(t('superadmin.createUser.errors.networkError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-white/[0.06] pb-6">
        <button
          type="button"
          onClick={() => router.push('/dashboard/superadmin/users')}
          className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-brand-accent hover:underline"
        >
          {t('superadmin.createUser.backToUsers')}
        </button>
        <h1 className="text-xl font-semibold tracking-tight text-brand-heading sm:text-2xl">
          {t('superadmin.createUser.title')}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-brand-muted">
          {t('superadmin.createUser.subtitleBeforeUser')}{' '}
          <strong className="font-medium text-brand-subtle">{t('superadmin.createUser.subtitleUserRole')}</strong>{' '}
          {t('superadmin.createUser.subtitleOr')}{' '}
          <strong className="font-medium text-brand-subtle">{t('superadmin.createUser.subtitleAdminRole')}</strong>{' '}
          {t('superadmin.createUser.subtitleAfterRole')}{' '}
          <Link href="/login" className="text-brand-accent underline-offset-2 hover:underline">
            /login
          </Link>{' '}
          {t('superadmin.createUser.subtitleAfterLogin')}
        </p>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-black/[0.35] to-[#060708] p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] sm:p-8">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_80%_at_50%_0%,rgba(201,162,39,0.06),transparent_55%)]"
          aria-hidden
        />

        <div className="relative mx-auto max-w-xxl">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand-accent/25 bg-[var(--brand-accent-soft)]/50 text-brand-accent">
              <UserPlus className="h-5 w-5" strokeWidth={2} aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold text-brand-heading">{t('superadmin.createUser.accountType')}</p>
            </div>
          </div>

          {success ? (
            <div className="mb-6 space-y-3">
              <FeedbackMessage tone="success" title={t('superadmin.createUser.userCreatedTitle')} message={success} />
              {emailSent === false ? (
                <FeedbackMessage
                  tone="info"
                  title={t('superadmin.createUser.emailNotSentTitle')}
                  message={t('superadmin.createUser.emailNotSentMessage')}
                />
              ) : null}
              <Link
                href="/dashboard/superadmin/users"
                className="inline-block text-xs font-semibold text-brand-accent hover:underline"
              >
                {t('superadmin.createUser.viewUsersList')}
              </Link>
            </div>
          ) : null}

          {error ? (
            <FeedbackMessage
              tone="error"
              title={t('superadmin.createUser.createFailedTitle')}
              message={error}
              className="mb-6"
            />
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="sa-user-role"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-brand-subtle"
              >
                {t('superadmin.createUser.role')}
              </label>
              {isSuperAdmin ? (
                <select
                  id="sa-user-role"
                  value={role}
                  onChange={(e) => {
                    const next = e.target.value;
                    setRole(next);
                    if (next !== 'admin') {
                      setAdminPermissions({ ...DEFAULT_ADMIN_PERMISSIONS });
                    }
                  }}
                  disabled={loading}
                  className="w-full rounded-xl border border-brand-border-muted bg-black/40 px-4 py-3 text-sm text-brand-heading focus:border-brand-accent/35 focus:outline-none focus:ring-2 focus:ring-brand-accent/20 disabled:opacity-50"
                >
                  <option value="user">{t('superadmin.createUser.roleUser')}</option>
                  <option value="admin">{t('superadmin.createUser.roleAdmin')}</option>
                </select>
              ) : (
                <div className="rounded-xl border border-brand-border-muted bg-black/25 px-4 py-3 text-sm text-brand-muted">
                  {t('superadmin.createUser.newAccountsUsersOnly')}{' '}
                  <span className="font-medium text-brand-heading">{t('superadmin.createUser.usersOnly')}</span>{' '}
                  {t('superadmin.createUser.only')}
                </div>
              )}
            </div>
            {isSuperAdmin && role === 'admin' ? (
              <div className="space-y-2 rounded-xl border border-white/[0.06] bg-black/25 p-4">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">
                  {t('superadmin.createUser.usersModuleTitle')}
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <PermToggle
                    id="new-ap-view"
                    label={t('superadmin.createUser.permViewList')}
                    checked={adminPermissions.usersView}
                    onChange={(v) => setAdminPermissions((p) => ({ ...p, usersView: v }))}
                    disabled={loading}
                  />
                  <PermToggle
                    id="new-ap-create"
                    label={t('superadmin.createUser.permCreateAccounts')}
                    checked={adminPermissions.usersCreate}
                    onChange={(v) => setAdminPermissions((p) => ({ ...p, usersCreate: v }))}
                    disabled={loading}
                  />
                  <PermToggle
                    id="new-ap-edit"
                    label={t('superadmin.createUser.permEditUsers')}
                    checked={adminPermissions.usersEdit}
                    onChange={(v) => setAdminPermissions((p) => ({ ...p, usersEdit: v }))}
                    disabled={loading}
                  />
                  <PermToggle
                    id="new-ap-delete"
                    label={t('superadmin.createUser.permArchiveUsers')}
                    checked={adminPermissions.usersDelete}
                    onChange={(v) => setAdminPermissions((p) => ({ ...p, usersDelete: v }))}
                    disabled={loading}
                  />
                </div>
                <p className="pt-2 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">
                  {t('superadmin.createUser.walletsModuleTitle')}
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <PermToggle
                    id="new-ap-wallets-view"
                    label={t('superadmin.createUser.permViewWallets')}
                    checked={adminPermissions.walletsView}
                    onChange={(v) =>
                      setAdminPermissions((p) => ({
                        ...p,
                        walletsView: v,
                        walletsAdjust: v ? p.walletsAdjust : false,
                      }))
                    }
                    disabled={loading}
                  />
                  <PermToggle
                    id="new-ap-wallets-adjust"
                    label={t('superadmin.createUser.permManageBalances')}
                    checked={adminPermissions.walletsAdjust}
                    onChange={(v) =>
                      setAdminPermissions((p) => ({
                        ...p,
                        walletsAdjust: v,
                        walletsView: v ? true : p.walletsView,
                      }))
                    }
                    disabled={loading}
                  />
                </div>
                <p className="text-[0.65rem] leading-relaxed text-brand-muted">{t('superadmin.createUser.walletsHint')}</p>
                <p className="pt-2 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">
                  {t('superadmin.createUser.settingsModuleTitle')}
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <PermToggle
                    id="new-ap-tokens"
                    label={t('superadmin.createUser.permManageTokens')}
                    checked={adminPermissions.manageTokens}
                    onChange={(v) => setAdminPermissions((p) => ({ ...p, manageTokens: v }))}
                    disabled={loading}
                  />
                </div>
                <p className="pt-2 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">
                  {t('superadmin.createUser.platformModulesTitle')}
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <PermToggle
                    id="new-ap-transactions"
                    label={t('superadmin.createUser.permViewTransactions')}
                    checked={adminPermissions.transactionsView}
                    onChange={(v) => setAdminPermissions((p) => ({ ...p, transactionsView: v }))}
                    disabled={loading}
                  />
                  <PermToggle
                    id="new-ap-drawings"
                    label={t('superadmin.createUser.permManageDrawings')}
                    checked={adminPermissions.drawingsManage}
                    onChange={(v) => setAdminPermissions((p) => ({ ...p, drawingsManage: v }))}
                    disabled={loading}
                  />
                  <PermToggle
                    id="new-ap-membership"
                    label={t('superadmin.createUser.permManageMembership')}
                    checked={adminPermissions.membershipManage}
                    onChange={(v) => setAdminPermissions((p) => ({ ...p, membershipManage: v }))}
                    disabled={loading}
                  />
                  <PermToggle
                    id="new-ap-announcements"
                    label={t('superadmin.createUser.permAnnouncements')}
                    checked={adminPermissions.announcementsManage}
                    onChange={(v) => setAdminPermissions((p) => ({ ...p, announcementsManage: v }))}
                    disabled={loading}
                  />
                  <PermToggle
                    id="new-ap-support"
                    label={t('superadmin.createUser.permSupportTickets')}
                    checked={adminPermissions.supportTicketsManage}
                    onChange={(v) => setAdminPermissions((p) => ({ ...p, supportTicketsManage: v }))}
                    disabled={loading}
                  />
                </div>
              </div>
            ) : null}
            {(isSuperAdmin ? role : 'user') === 'user' ? (
              <div className="space-y-2 rounded-xl border border-white/[0.06] bg-black/25 p-4">
                {isSuperAdmin ? (
                  <div className="mt-3">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-brand-accent" strokeWidth={2} aria-hidden />
                      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">
                        {t('superadmin.createUser.membership')}
                      </p>
                    </div>
                    {membershipTiersLoading ? (
                      <p className="mt-2 flex items-center gap-2 text-sm text-brand-muted">
                        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} aria-hidden />
                        {t('superadmin.createUser.loadingTiers')}
                      </p>
                    ) : (
                      <div className="mt-2 max-h-44 space-y-2 overflow-y-auto pr-1">
                        {membershipTiers.map((tier) => {
                          const selected = manualMembershipTierId === tier.id;
                          return (
                            <button
                              key={tier.id}
                              type="button"
                              disabled={loading}
                              onClick={() => setManualMembershipTierId(tier.id)}
                              className={cn(
                                'w-full rounded-xl border px-3 py-2.5 text-left text-sm transition',
                                selected
                                  ? 'border-brand-accent/40 bg-[var(--brand-accent-soft)]/15 text-brand-heading'
                                  : 'border-white/[0.08] bg-black/30 text-brand-muted hover:border-white/[0.12]'
                              )}
                            >
                              <span className="font-semibold text-brand-heading">{tier.name}</span>
                              <span className="mt-0.5 block text-xs text-brand-muted">
                                {t('superadmin.createUser.minUsd', {
                                  amount: formatCurrencySmart(tier.minValueUsd, 'USD'),
                                })}
                              </span>
                            </button>
                          );
                        })}
                        {!membershipTiersLoading && membershipTiers.length === 0 ? (
                          <p className="text-xs text-brand-muted">{t('superadmin.createUser.noTiersYet')}</p>
                        ) : null}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            ) : null}
            <div>
              <label
                htmlFor="sa-user-name"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-brand-subtle"
              >
                {t('superadmin.createUser.displayName')}{' '}
                <span className="font-normal normal-case text-brand-muted">{t('superadmin.createUser.optional')}</span>
              </label>
              <input
                id="sa-user-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                className="w-full rounded-xl border border-brand-border-muted bg-black/40 px-4 py-3 text-sm text-brand-heading placeholder:text-brand-subtle/70 focus:border-brand-accent/35 focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
                placeholder={t('superadmin.createUser.displayNamePlaceholder')}
              />
            </div>
            <div>
              <label
                htmlFor="sa-user-email"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-brand-subtle"
              >
                {t('superadmin.createUser.email')}
              </label>
              <input
                id="sa-user-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
                className="w-full rounded-xl border border-brand-border-muted bg-black/40 px-4 py-3 text-sm text-brand-heading placeholder:text-brand-subtle/70 focus:border-brand-accent/35 focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
                placeholder={t('superadmin.createUser.emailPlaceholder')}
              />
            </div>
            <PasswordField
              label={t('superadmin.createUser.password')}
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              required
              disabled={loading}
            />
            <div>
              <label
                htmlFor="sa-user-confirm"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-brand-subtle"
              >
                {t('superadmin.createUser.confirmPassword')}
              </label>
              <input
                id="sa-user-confirm"
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                disabled={loading}
                className={cn(
                  'w-full rounded-xl border border-brand-border-muted bg-black/40 px-4 py-3 text-sm text-brand-heading focus:outline-none focus:ring-2 focus:ring-brand-accent/20',
                  'focus:border-brand-accent/35 disabled:opacity-50'
                )}
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-brand-on-accent disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} aria-hidden />
                  {t('superadmin.createUser.creating')}
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" strokeWidth={2} aria-hidden />
                  {t('superadmin.createUser.createAccount')}
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

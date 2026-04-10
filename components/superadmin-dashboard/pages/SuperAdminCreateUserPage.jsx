'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserPlus, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/components/auth-context';
import PasswordField from '@/components/auth/PasswordField';
import { cn } from '@/lib/utils';

export default function SuperAdminCreateUserPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [role, setRole] = useState('user');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [emailSent, setEmailSent] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setEmailSent(null);
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (!token) {
      setError('You are not signed in.');
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
          role,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not create user.');
        return;
      }
      setSuccess(data.message || 'User created successfully.');
      setEmailSent(data.credentialsEmailSent === true);
      setName('');
      setEmail('');
      setPassword('');
      setConfirm('');
    } catch {
      setError('Network error.');
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
          ← Back to users
        </button>
        <h1 className="text-xl font-semibold tracking-tight text-brand-heading sm:text-2xl">Add user</h1>
        <p className="mt-1 max-w-2xl text-sm text-brand-muted">
          Create a <strong className="font-medium text-brand-subtle">member</strong> or{' '}
          <strong className="font-medium text-brand-subtle">admin</strong> account. They are email-verified
          immediately and can sign in at{' '}
          <Link href="/login" className="text-brand-accent underline-offset-2 hover:underline">
            /login
          </Link>{' '}
          with the password you set—no OTP. When SMTP is configured in{' '}
          <code className="rounded bg-black/40 px-1 text-[0.7rem]">.env.local</code>, we email them the login
          link and credentials.
        </p>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-black/[0.35] to-[#060708] p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] sm:p-8">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_80%_at_50%_0%,rgba(201,162,39,0.06),transparent_55%)]"
          aria-hidden
        />

        <div className="relative mx-auto max-w-md">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand-accent/25 bg-[var(--brand-accent-soft)]/50 text-brand-accent">
              <UserPlus className="h-5 w-5" strokeWidth={2} aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold text-brand-heading">Account type</p>
              <p className="text-xs text-brand-muted">Member or admin only · not superadmin</p>
            </div>
          </div>

          {success ? (
            <div className="mb-6 flex gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.08] px-4 py-3 text-sm text-emerald-100/95">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" strokeWidth={2} aria-hidden />
              <div>
                <p className="font-medium">{success}</p>
                {emailSent === false ? (
                  <p className="mt-2 text-xs text-emerald-100/80">
                    SMTP missing: share credentials manually or add SMTP_* vars so the next user gets email
                    automatically.
                  </p>
                ) : null}
                <Link
                  href="/dashboard/superadmin/users"
                  className="mt-2 inline-block text-xs font-semibold text-brand-accent hover:underline"
                >
                  View users list →
                </Link>
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="mb-6 rounded-xl border border-red-500/25 bg-red-500/[0.08] px-4 py-3 text-sm text-red-200/95">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="sa-user-role"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-brand-subtle"
              >
                Role
              </label>
              <select
                id="sa-user-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={loading}
                className="w-full rounded-xl border border-brand-border-muted bg-black/40 px-4 py-3 text-sm text-brand-heading focus:border-brand-accent/35 focus:outline-none focus:ring-2 focus:ring-brand-accent/20 disabled:opacity-50"
              >
                <option value="user">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="sa-user-name"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-brand-subtle"
              >
                Display name <span className="font-normal normal-case text-brand-muted">(optional)</span>
              </label>
              <input
                id="sa-user-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                className="w-full rounded-xl border border-brand-border-muted bg-black/40 px-4 py-3 text-sm text-brand-heading placeholder:text-brand-subtle/70 focus:border-brand-accent/35 focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
                placeholder="e.g. Jane Doe"
              />
            </div>
            <div>
              <label
                htmlFor="sa-user-email"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-brand-subtle"
              >
                Email
              </label>
              <input
                id="sa-user-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
                className="w-full rounded-xl border border-brand-border-muted bg-black/40 px-4 py-3 text-sm text-brand-heading placeholder:text-brand-subtle/70 focus:border-brand-accent/35 focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
                placeholder="user@company.com"
              />
            </div>
            <PasswordField
              label="Password"
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
                Confirm password
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
                  Creating…
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" strokeWidth={2} aria-hidden />
                  Create account
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

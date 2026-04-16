'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthShell from '@/components/auth/AuthShell';
import PasswordField from '@/components/auth/PasswordField';
import Spinner from '@/components/ui/Spinner';
import { setPendingRegister } from '@/lib/auth-flow';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Use at least 8 characters for your password.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password, role: 'user' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Registration failed.');
        return;
      }
      setPendingRegister({ email, name, role: 'user' });
      router.push('/verify-otp');
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Register to access the workspace. You will verify your email with a one-time code."
      badge="Register"
      footer={
        <span className="text-brand-muted">
          Already registered?{' '}
          <Link href="/login" className="auth-link text-brand-heading">
            Sign in
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error ? (
          <div
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200/90"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <div>
          <label htmlFor="reg-name" className="auth-label">
            Full name
          </label>
          <input
            id="reg-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Doe"
            autoComplete="name"
            required
            className="auth-input"
          />
        </div>

        <div>
          <label htmlFor="reg-email" className="auth-label">
            Email
          </label>
          <input
            id="reg-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
            className="auth-input"
          />
        </div>

        <PasswordField
          label="Password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
        />
        <p className="auth-hint -mt-3">At least 8 characters.</p>

        <PasswordField
          label="Confirm password"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
        />

        <p className="auth-hint text-center text-xs text-brand-muted">
          Public sign-up creates a <span className="font-medium text-brand-subtle">member</span> account only.
          Admin accounts are created by your platform super admin.
        </p>

        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="btn-primary w-full justify-center gap-2 disabled:opacity-60"
        >
          {loading ? <Spinner size="sm" variant="onAccent" /> : null}
          <span>{loading ? 'Sending code…' : 'Continue to verification'}</span>
        </button>
      </form>
    </AuthShell>
  );
}

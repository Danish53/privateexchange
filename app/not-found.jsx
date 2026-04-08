import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-brand-page px-4 font-sans text-brand-muted">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-subtle">404</p>
      <h1 className="text-2xl font-semibold text-brand-heading">Page not found</h1>
      <Link href="/" className="auth-link text-brand-accent">
        Return home
      </Link>
    </div>
  );
}

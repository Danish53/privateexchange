'use client';

import { Skeleton } from '@/components/ui/Skeleton';

/** Full-viewport loading layout while auth/session resolves — matches dashboard chrome. */
export default function UserDashboardSkeleton() {
  return (
    <div className="relative min-h-screen bg-brand-page font-sans">
      <div className="pointer-events-none fixed inset-0 bg-brand-hero-radial opacity-90" aria-hidden />
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_55%_40%_at_100%_0%,rgba(51,65,85,0.28),transparent_55%)]"
        aria-hidden
      />

      <div className="relative mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-[260px] shrink-0 border-r border-white/[0.06] lg:block">
          <div className="flex h-full flex-col gap-3 p-4 pt-6">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
            <div className="mt-4 space-y-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-11 w-full rounded-lg" />
              ))}
            </div>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-10 border-b border-brand-border-muted bg-brand-page/95 px-4 py-3 backdrop-blur-md sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 shrink-0 rounded-lg sm:h-10 sm:w-10" />
                <div className="hidden space-y-2 sm:block">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-4 w-40" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden text-right md:block">
                  <Skeleton className="ml-auto h-3 w-32" />
                  <Skeleton className="mt-1.5 h-2.5 w-16" />
                </div>
                <Skeleton className="h-9 w-9 shrink-0 rounded-full sm:h-10 sm:w-10" />
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl space-y-8">
              <div className="space-y-3">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-9 w-52 max-w-full" />
                <Skeleton className="h-4 w-full max-w-xl" />
              </div>
              <div className="grid gap-5 lg:grid-cols-12">
                <Skeleton className="h-56 rounded-2xl lg:col-span-7" />
                <div className="grid gap-3 lg:col-span-5">
                  <Skeleton className="h-28 rounded-xl" />
                  <Skeleton className="h-28 rounded-xl" />
                </div>
              </div>
              <Skeleton className="h-36 rounded-2xl" />
            </div>
          </main>
        </div>
      </div>
      <span className="sr-only">Loading workspace</span>
    </div>
  );
}

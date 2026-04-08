'use client';

/**
 * Neutral block placeholder — uses subtle shimmer (see globals.css).
 */
export function Skeleton({ className = '', shimmer = true }) {
  return (
    <div
      className={`rounded-md bg-white/[0.055] ${shimmer ? 'skeleton-shimmer' : 'animate-pulse'} ${className}`}
      aria-hidden
    />
  );
}

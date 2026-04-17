/**
 * Normalize stored avatar URL for <img src={...}>.
 * - Absolute https (e.g. Vercel Blob) is returned as-is.
 * - Site-relative `/uploads/...` works on the same origin (local dev with public/uploads).
 */
export function avatarSrc(stored) {
  if (!stored || typeof stored !== 'string') return '';
  const s = stored.trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  return s.startsWith('/') ? s : `/${s}`;
}

export function emailInitials(email) {
  if (!email || typeof email !== 'string') return 'U';
  const local = email.split('@')[0] || '';
  if (local.length >= 2) return local.slice(0, 2).toUpperCase();
  return local.slice(0, 1).toUpperCase() || 'U';
}

/** @param {string} pathname */
/** @param {string} href */
export function isUserNavActive(pathname, href) {
  const p = pathname.replace(/\/$/, '') || '/';
  const h = href.replace(/\/$/, '') || '/';
  if (h === '/dashboard/user') {
    return p === '/dashboard/user';
  }
  return p === h || p.startsWith(`${h}/`);
}

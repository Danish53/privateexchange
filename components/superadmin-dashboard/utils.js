/** @param {string} pathname @param {string} href */
export function isSuperAdminNavActive(pathname, href) {
  const p = pathname.replace(/\/$/, '') || '/';
  const h = href.replace(/\/$/, '') || '/';
  if (h === '/dashboard/superadmin') {
    return p === '/dashboard/superadmin';
  }
  return p === h || p.startsWith(`${h}/`);
}

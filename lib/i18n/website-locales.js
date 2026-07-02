export const WEBSITE_LOCALES = ['en', 'es'];

export const DEFAULT_WEBSITE_LOCALE = 'en';

export const WEBSITE_LOCALE_STORAGE_KEY = 'website-locale';

export const WEBSITE_LOCALE_META = {
  en: {
    label: 'English',
    nativeLabel: 'English',
  },
  es: {
    label: 'Spanish',
    nativeLabel: 'Español',
  },
};

export const WEBSITE_AUTH_PATHS = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-otp'];

export function isWebsiteLocale(value) {
  return WEBSITE_LOCALES.includes(value);
}

export function isWebsitePath(pathname) {
  if (!pathname) return false;
  return (
    pathname === '/' ||
    pathname === '/privacy' ||
    pathname === '/terms' ||
    WEBSITE_AUTH_PATHS.includes(pathname) ||
    pathname === '/dashboard/user' ||
    pathname.startsWith('/dashboard/user/') ||
    pathname === '/dashboard/superadmin' ||
    pathname.startsWith('/dashboard/superadmin/')
  );
}

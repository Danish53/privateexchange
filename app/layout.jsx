import '@fontsource-variable/source-sans-3';
import { AuthProvider } from '@/components/auth-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { WebsiteLocaleProvider } from '@/components/i18n/WebsiteLocaleProvider';
import TranslationOverlay from '@/components/i18n/TranslationOverlay';
import { ToastProvider } from '@/components/ui/toast-context';
import './globals.css';

export const metadata = {
  title: '759 Private Exchange',
  description: '759 Private Exchange - Secure Multi-Token Wallet Platform',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export const viewport = {
  themeColor: '#1e293b',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-900 font-sans antialiased">
        <ErrorBoundary>
          <AuthProvider>
            <WebsiteLocaleProvider>
              <ToastProvider>{children}</ToastProvider>
              <TranslationOverlay />
            </WebsiteLocaleProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

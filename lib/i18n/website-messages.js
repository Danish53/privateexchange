import en from '@/messages/website/en.json';
import es from '@/messages/website/es.json';
import privacyEn from '@/messages/website/legal-privacy-en.json';
import privacyEs from '@/messages/website/legal-privacy-es.json';
import termsEn from '@/messages/website/legal-terms-en.json';
import termsEs from '@/messages/website/legal-terms-es.json';
import dashboardEn from '@/messages/website/user-dashboard-en.json';
import dashboardEs from '@/messages/website/user-dashboard-es.json';
import superadminEn from '@/messages/website/superadmin-en.json';
import superadminEs from '@/messages/website/superadmin-es.json';

const bundles = {
  en: { ...en, dashboard: dashboardEn, superadmin: superadminEn, legalContent: { privacy: privacyEn, terms: termsEn } },
  es: { ...es, dashboard: dashboardEs, superadmin: superadminEs, legalContent: { privacy: privacyEs, terms: termsEs } },
};

export function getWebsiteMessages(locale) {
  return bundles[locale] || bundles.en;
}

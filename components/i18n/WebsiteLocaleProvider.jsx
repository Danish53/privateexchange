'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getMessage } from '@/lib/i18n/getMessage';
import { getWebsiteMessages } from '@/lib/i18n/website-messages';
import {
  DEFAULT_WEBSITE_LOCALE,
  isWebsiteLocale,
  isWebsitePath,
  WEBSITE_LOCALE_META,
  WEBSITE_LOCALE_STORAGE_KEY,
} from '@/lib/i18n/website-locales';

const WebsiteLocaleContext = createContext(null);

function readStoredLocale() {
  if (typeof window === 'undefined') return DEFAULT_WEBSITE_LOCALE;
  try {
    const stored = localStorage.getItem(WEBSITE_LOCALE_STORAGE_KEY);
    return isWebsiteLocale(stored) ? stored : DEFAULT_WEBSITE_LOCALE;
  } catch {
    return DEFAULT_WEBSITE_LOCALE;
  }
}

async function fetchTranslations(texts, target) {
  if (!texts.length || target === 'en') {
    return Object.fromEntries(texts.map((t) => [t, t]));
  }
  const res = await fetch('/api/website/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texts, target }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.ok) {
    return Object.fromEntries(texts.map((t) => [t, t]));
  }
  return json.translations || {};
}

export function WebsiteLocaleProvider({ children }) {
  const pathname = usePathname();
  const [locale, setLocaleState] = useState(DEFAULT_WEBSITE_LOCALE);
  const [hydrated, setHydrated] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [targetLocale, setTargetLocale] = useState(null);

  useEffect(() => {
    setLocaleState(readStoredLocale());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.lang = locale;
  }, [locale, hydrated]);

  const messages = useMemo(() => getWebsiteMessages(locale), [locale]);

  const t = useCallback(
    (key, vars) => getMessage(messages, key, vars),
    [messages]
  );

  const setLocale = useCallback(
    async (next) => {
      if (!isWebsiteLocale(next) || next === locale) return;

      setTargetLocale(next);
      setIsTranslating(true);

      await new Promise((r) => setTimeout(r, 520));

      setLocaleState(next);
      try {
        localStorage.setItem(WEBSITE_LOCALE_STORAGE_KEY, next);
      } catch {
        /* ignore */
      }

      await new Promise((r) => setTimeout(r, 380));

      setIsTranslating(false);
      setTargetLocale(null);
    },
    [locale]
  );

  const translateDynamicTexts = useCallback(
    async (texts) => {
      const unique = [...new Set((texts || []).map((x) => String(x || '').trim()).filter(Boolean))];
      if (!unique.length || locale === 'en') {
        return Object.fromEntries(unique.map((text) => [text, text]));
      }
      return fetchTranslations(unique, locale);
    },
    [locale]
  );

  const translateRowFields = useCallback(
    async (rows, fields) => {
      if (!Array.isArray(rows) || !rows.length || locale === 'en') return rows;
      const texts = [];
      for (const row of rows) {
        for (const field of fields) {
          if (row?.[field]) texts.push(row[field]);
        }
      }
      const map = await translateDynamicTexts(texts);
      return rows.map((row) => {
        const patch = {};
        for (const field of fields) {
          if (row?.[field]) patch[field] = map[row[field]] || row[field];
        }
        return { ...row, ...patch };
      });
    },
    [locale, translateDynamicTexts]
  );

  const translateWinnerRows = useCallback(
    async (rows) => translateRowFields(rows, ['title', 'prize_title']),
    [translateRowFields]
  );

  const showOverlay = isTranslating && isWebsitePath(pathname);

  const value = useMemo(
    () => ({
      locale,
      hydrated,
      isTranslating: showOverlay,
      targetLocale,
      messages,
      t,
      setLocale,
      translateDynamicTexts,
      translateRowFields,
      translateWinnerRows,
    }),
    [
      locale,
      hydrated,
      showOverlay,
      targetLocale,
      messages,
      t,
      setLocale,
      translateDynamicTexts,
      translateRowFields,
      translateWinnerRows,
    ]
  );

  return (
    <WebsiteLocaleContext.Provider value={value}>{children}</WebsiteLocaleContext.Provider>
  );
}

export function useWebsiteLocale() {
  const ctx = useContext(WebsiteLocaleContext);
  if (!ctx) {
    throw new Error('useWebsiteLocale must be used within WebsiteLocaleProvider');
  }
  return ctx;
}

export function useWebsiteT() {
  const ctx = useWebsiteLocale();
  return ctx;
}

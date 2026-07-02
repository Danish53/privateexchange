const translationCache = new Map();

function cacheKey(text, target) {
  return `${target}::${text}`;
}

async function translateOne(text, target) {
  const trimmed = String(text || '').trim();
  if (!trimmed || target === 'en') return trimmed;

  const key = cacheKey(trimmed, target);
  if (translationCache.has(key)) return translationCache.get(key);

  const langpair = `en|${target}`;
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=${langpair}`;

  try {
    const res = await fetch(url);
    const data = await res.json().catch(() => ({}));
    const translated = String(data?.responseData?.translatedText || trimmed).trim();
    const result = translated || trimmed;
    translationCache.set(key, result);
    return result;
  } catch {
    return trimmed;
  }
}

/** Batch-translate unique strings with light concurrency. */
export async function translateTexts(texts, target = 'es') {
  if (target === 'en') {
    return Object.fromEntries(
      (texts || []).filter(Boolean).map((t) => [t, t])
    );
  }

  const unique = [...new Set((texts || []).map((t) => String(t || '').trim()).filter(Boolean))];
  const entries = await Promise.all(
    unique.map(async (text) => {
      const translated = await translateOne(text, target);
      return [text, translated];
    })
  );

  return Object.fromEntries(entries);
}

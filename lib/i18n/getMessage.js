/**
 * Resolve nested message keys: t('nav.overview') → messages.nav.overview
 * Supports simple {var} interpolation.
 */
export function getMessage(messages, key, vars = {}) {
  if (!messages || !key) return key;
  const parts = String(key).split('.');
  let value = messages;
  for (const part of parts) {
    value = value?.[part];
    if (value === undefined) return key;
  }
  if (typeof value !== 'string') return key;
  return value.replace(/\{(\w+)\}/g, (_, name) =>
    vars[name] !== undefined ? String(vars[name]) : `{${name}}`
  );
}

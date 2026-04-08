export const PENDING_REGISTER_KEY = '759_pending_register';

/** @typedef {{ email: string; name?: string }} PendingRegister */

export function setPendingRegister(/** @type {PendingRegister} */ data) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(PENDING_REGISTER_KEY, JSON.stringify(data));
}

export function getPendingRegister() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(PENDING_REGISTER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearPendingRegister() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(PENDING_REGISTER_KEY);
}

import { verifyAuthToken } from '@/lib/token';

/** @returns {string | null} Mongo user id from JWT sub */
export function getUserIdFromRequest(request) {
  const auth = request.headers.get('authorization');
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  const payload = verifyAuthToken(token);
  return typeof payload?.sub === 'string' ? payload.sub : null;
}

/** @param {import('mongoose').Document | Record<string, unknown>} u */
export function toPublicUser(u) {
  const id = u._id != null ? String(u._id) : String(u.id);
  return {
    id,
    email: u.email,
    name: u.name || '',
    role: u.role,
    phone: u.phone || '',
    country: u.country || '',
    timezone: u.timezone || '',
  };
}

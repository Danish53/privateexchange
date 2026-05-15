export const SUPPORT_TICKET_STATUSES = ['pending', 'in_progress', 'resolved', 'closed'];

export const SUPPORT_STATUS_LABELS = {
  pending: 'Pending',
  in_progress: 'In progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

/**
 * @param {Record<string, unknown>} doc
 * @param {{ includeUser?: boolean }} [opts]
 */
export function serializeSupportTicket(doc, opts = {}) {
  const d = doc && typeof doc.toObject === 'function' ? doc.toObject() : doc;
  const user = d.user;
  const base = {
    id: String(d._id),
    subject: d.subject || '',
    detail: d.detail || '',
    status: d.status || 'pending',
    adminReply: d.adminReply || '',
    repliedAt: d.repliedAt ? new Date(d.repliedAt).toISOString() : '',
    createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : '',
    updatedAt: d.updatedAt ? new Date(d.updatedAt).toISOString() : '',
  };
  if (opts.includeUser && user && typeof user === 'object') {
    return {
      ...base,
      user: {
        id: user._id ? String(user._id) : '',
        name: user.name || '',
        email: user.email || '',
      },
    };
  }
  return base;
}

/**
 * @param {string} raw
 * @returns {string | null}
 */
export function normalizeSupportTicketStatus(raw) {
  const v = String(raw || '').trim();
  return SUPPORT_TICKET_STATUSES.includes(v) ? v : null;
}

/** @typedef {{ usersView: boolean; usersCreate: boolean; usersEdit: boolean; usersDelete: boolean; walletsView: boolean; walletsAdjust: boolean }} AdminPermissionsShape */

export const DEFAULT_ADMIN_PERMISSIONS = {
  usersView: false,
  usersCreate: false,
  usersEdit: false,
  usersDelete: false,
  walletsView: false,
  walletsAdjust: false,
};

/** Coerce JSON / form values to boolean (avoids truthy string "false"). */
function normBool(v) {
  if (v === true || v === 1) return true;
  if (v === false || v === 0 || v === null || v === undefined) return false;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    if (s === 'true' || s === '1' || s === 'yes') return true;
    return false;
  }
  return Boolean(v);
}

/** @param {Record<string, unknown> | null | undefined} raw */
export function mergeAdminPermissions(raw) {
  let x = raw;
  if (typeof x === 'string') {
    try {
      x = JSON.parse(x);
    } catch {
      x = {};
    }
  }
  const p =
    x && typeof x === 'object' && !Array.isArray(x) ? /** @type {Record<string, unknown>} */ (x) : {};
  const walletsAdjust = normBool(p.walletsAdjust);
  const walletsView = normBool(p.walletsView) || walletsAdjust;
  return {
    usersView: normBool(p.usersView),
    usersCreate: normBool(p.usersCreate),
    usersEdit: normBool(p.usersEdit),
    usersDelete: normBool(p.usersDelete),
    walletsView,
    walletsAdjust,
  };
}

/**
 * @param {Record<string, unknown> | null | undefined} userLean
 * @returns {boolean}
 */
export function adminHasAnyPlatformAccess(userLean) {
  if (!userLean || userLean.role !== 'admin') return false;
  const p = mergeAdminPermissions(userLean.adminPermissions);
  return (
    p.usersView ||
    p.usersCreate ||
    p.usersEdit ||
    p.usersDelete ||
    p.walletsView ||
    p.walletsAdjust
  );
}

/**
 * @param {Record<string, unknown>} userLean
 * @param {'view'|'create'|'edit'|'delete'} action
 */
export function userHasUsersPermission(userLean, action) {
  if (!userLean) return false;
  if (userLean.role === 'superadmin') return true;
  if (userLean.role !== 'admin') return false;
  const p = mergeAdminPermissions(userLean.adminPermissions);
  switch (action) {
    case 'view':
      return p.usersView;
    case 'create':
      return p.usersCreate;
    case 'edit':
      return p.usersEdit;
    case 'delete':
      return p.usersDelete;
    default:
      return false;
  }
}

/** True if admin may open the Users area at all (list + actions gated separately). */
export function hasAnyUsersModulePermission(userLean) {
  if (!userLean) return false;
  if (userLean.role === 'superadmin') return true;
  if (userLean.role !== 'admin') return false;
  const p = mergeAdminPermissions(userLean.adminPermissions);
  return p.usersView || p.usersCreate || p.usersEdit || p.usersDelete;
}

/** View member wallets (balances list). Adjusters implicitly need this for their work. */
export function userHasWalletsView(userLean) {
  if (!userLean) return false;
  if (userLean.role === 'superadmin') return true;
  if (userLean.role !== 'admin') return false;
  const p = mergeAdminPermissions(userLean.adminPermissions);
  return p.walletsView || p.walletsAdjust;
}

/** Credit / debit member token balances (plus superadmin). */
export function userHasWalletsAdjust(userLean) {
  if (!userLean) return false;
  if (userLean.role === 'superadmin') return true;
  if (userLean.role !== 'admin') return false;
  return mergeAdminPermissions(userLean.adminPermissions).walletsAdjust;
}

export function hasAnyWalletsPermission(userLean) {
  if (!userLean) return false;
  if (userLean.role === 'superadmin') return true;
  if (userLean.role !== 'admin') return false;
  const p = mergeAdminPermissions(userLean.adminPermissions);
  return p.walletsView || p.walletsAdjust;
}

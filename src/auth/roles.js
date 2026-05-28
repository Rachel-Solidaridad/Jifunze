// Role-based access control for Jifunze.
//
// Three levels:
//   - learner  (default): own data only
//   - manager:           can view all stats + assign courses, cannot promote
//   - admin:             can do everything, including changing other roles
//
// The first admin is bootstrapped via SEED_ADMINS — those emails get
// `role: 'admin'` on their first sign-in. After that, admins promote others
// through the User Management UI.

export const ROLES = {
  LEARNER: 'learner',
  MANAGER: 'manager',
  ADMIN: 'admin',
};

export const ROLE_LABELS = {
  [ROLES.LEARNER]: 'Learner',
  [ROLES.MANAGER]: 'Manager',
  [ROLES.ADMIN]: 'Admin',
};

export const ROLE_OPTIONS = [ROLES.LEARNER, ROLES.MANAGER, ROLES.ADMIN];

// Seed admin emails — these accounts auto-get `role: 'admin'` on first login.
// All lowercase; must be @solidaridadnetwork.org.
export const SEED_ADMINS = [
  'rachel@solidaridadnetwork.org',
];

export function isSeedAdmin(email) {
  if (!email) return false;
  return SEED_ADMINS.includes(email.trim().toLowerCase());
}

export function normalizeRole(role) {
  if (role === ROLES.ADMIN || role === ROLES.MANAGER) return role;
  return ROLES.LEARNER;
}

export function isAdmin(role) {
  return role === ROLES.ADMIN;
}

export function isManagerOrAdmin(role) {
  return role === ROLES.ADMIN || role === ROLES.MANAGER;
}

export function canViewAdminDashboard(role) {
  return isManagerOrAdmin(role);
}

export function canChangeRoles(role) {
  return isAdmin(role);
}

export function canAssignCourses(role) {
  return isManagerOrAdmin(role);
}

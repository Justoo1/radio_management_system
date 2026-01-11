/**
 * Permission Helpers
 *
 * Provides permission checking utilities for API routes
 */

type User = {
  id: string;
  role?: string;
  organizationId?: string;
};

type Resource =
  | "clients"
  | "programs"
  | "contracts"
  | "invoices"
  | "expenses"
  | "sms"
  | "media"
  | "ads"
  | "team"
  | "settings"
  | "reports"
  | "streaming"
  | "onair";

type Action = "create" | "read" | "update" | "delete";

// Role hierarchy (higher number = more permissions)
const ROLE_LEVELS: Record<string, number> = {
  VIEWER: 1,
  HOST: 2,
  SALES_MANAGER: 3,
  PROGRAM_MANAGER: 3,
  ADMIN: 4,
  OWNER: 5,
};

// Resource permissions by role
const ROLE_PERMISSIONS: Record<string, Record<Resource, Action[]>> = {
  OWNER: {
    clients: ["create", "read", "update", "delete"],
    programs: ["create", "read", "update", "delete"],
    contracts: ["create", "read", "update", "delete"],
    invoices: ["create", "read", "update", "delete"],
    expenses: ["create", "read", "update", "delete"],
    sms: ["create", "read", "update", "delete"],
    media: ["create", "read", "update", "delete"],
    ads: ["create", "read", "update", "delete"],
    team: ["create", "read", "update", "delete"],
    settings: ["create", "read", "update", "delete"],
    reports: ["read"],
    streaming: ["create", "read", "update", "delete"],
    onair: ["create", "read", "update", "delete"],
  },
  ADMIN: {
    clients: ["create", "read", "update", "delete"],
    programs: ["create", "read", "update", "delete"],
    contracts: ["create", "read", "update", "delete"],
    invoices: ["create", "read", "update", "delete"],
    expenses: ["create", "read", "update", "delete"],
    sms: ["create", "read", "update", "delete"],
    media: ["create", "read", "update", "delete"],
    ads: ["create", "read", "update", "delete"],
    team: ["create", "read", "update"],
    settings: ["read", "update"],
    reports: ["read"],
    streaming: ["create", "read", "update", "delete"],
    onair: ["create", "read", "update", "delete"],
  },
  PROGRAM_MANAGER: {
    clients: ["read"],
    programs: ["create", "read", "update", "delete"],
    contracts: ["read"],
    invoices: ["read"],
    expenses: ["read"],
    sms: ["read"],
    media: ["create", "read", "update", "delete"],
    ads: ["read"],
    team: ["read"],
    settings: ["read"],
    reports: ["read"],
    streaming: ["create", "read", "update"],
    onair: ["create", "read", "update"],
  },
  SALES_MANAGER: {
    clients: ["create", "read", "update", "delete"],
    programs: ["read"],
    contracts: ["create", "read", "update", "delete"],
    invoices: ["create", "read", "update", "delete"],
    expenses: ["create", "read", "update"],
    sms: ["create", "read", "update"],
    media: ["read"],
    ads: ["create", "read", "update", "delete"],
    team: ["read"],
    settings: ["read"],
    reports: ["read"],
    streaming: ["read"],
    onair: ["read"],
  },
  HOST: {
    clients: ["read"],
    programs: ["read"],
    contracts: ["read"],
    invoices: ["read"],
    expenses: ["read"],
    sms: ["read"],
    media: ["create", "read"],
    ads: ["read"],
    team: ["read"],
    settings: ["read"],
    reports: ["read"],
    streaming: ["read"],
    onair: ["read", "update"],
  },
  VIEWER: {
    clients: ["read"],
    programs: ["read"],
    contracts: ["read"],
    invoices: ["read"],
    expenses: ["read"],
    sms: ["read"],
    media: ["read"],
    ads: ["read"],
    team: ["read"],
    settings: ["read"],
    reports: ["read"],
    streaming: ["read"],
    onair: ["read"],
  },
};

/**
 * Check if a user has permission to perform an action on a resource
 */
export function hasPermission(
  user: User | null | undefined,
  resource: Resource,
  action: Action
): boolean {
  if (!user) return false;

  const role = user.role || "VIEWER";
  const permissions = ROLE_PERMISSIONS[role];

  if (!permissions) {
    // Unknown role, fall back to VIEWER
    return ROLE_PERMISSIONS.VIEWER[resource]?.includes(action) ?? false;
  }

  const resourcePermissions = permissions[resource];
  if (!resourcePermissions) return false;

  return resourcePermissions.includes(action);
}

/**
 * Check if a user has a specific role or higher
 */
export function hasRole(
  user: User | null | undefined,
  requiredRole: string
): boolean {
  if (!user) return false;

  const userRole = user.role || "VIEWER";
  const userLevel = ROLE_LEVELS[userRole] || 0;
  const requiredLevel = ROLE_LEVELS[requiredRole] || 0;

  return userLevel >= requiredLevel;
}

/**
 * Check if a user is an admin (ADMIN or OWNER)
 */
export function isAdmin(user: User | null | undefined): boolean {
  return hasRole(user, "ADMIN");
}

/**
 * Check if a user is the owner
 */
export function isOwner(user: User | null | undefined): boolean {
  return hasRole(user, "OWNER");
}

/**
 * Get all permissions for a user's role
 */
export function getUserPermissions(
  user: User | null | undefined
): Record<Resource, Action[]> | null {
  if (!user) return null;

  const role = user.role || "VIEWER";
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.VIEWER;
}

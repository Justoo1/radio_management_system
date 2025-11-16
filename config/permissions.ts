/**
 * Permissions Configuration
 * Defines role-based access control (RBAC) permissions
 */

export enum Permission {
  // Clients
  CLIENTS_VIEW = 'clients.view',
  CLIENTS_CREATE = 'clients.create',
  CLIENTS_EDIT = 'clients.edit',
  CLIENTS_DELETE = 'clients.delete',

  // Programs
  PROGRAMS_VIEW = 'programs.view',
  PROGRAMS_CREATE = 'programs.create',
  PROGRAMS_EDIT = 'programs.edit',
  PROGRAMS_DELETE = 'programs.delete',
  PROGRAMS_SCHEDULE = 'programs.schedule',

  // SMS
  SMS_VIEW = 'sms.view',
  SMS_CREATE = 'sms.create',
  SMS_SEND = 'sms.send',
  SMS_EDIT = 'sms.edit',
  SMS_DELETE = 'sms.delete',

  // Media
  MEDIA_VIEW = 'media.view',
  MEDIA_UPLOAD = 'media.upload',
  MEDIA_DELETE = 'media.delete',

  // Advertising
  ADS_VIEW = 'ads.view',
  ADS_CREATE = 'ads.create',
  ADS_EDIT = 'ads.edit',
  ADS_DELETE = 'ads.delete',

  // Contracts
  CONTRACTS_VIEW = 'contracts.view',
  CONTRACTS_CREATE = 'contracts.create',
  CONTRACTS_EDIT = 'contracts.edit',
  CONTRACTS_DELETE = 'contracts.delete',

  // Invoices
  INVOICES_VIEW = 'invoices.view',
  INVOICES_CREATE = 'invoices.create',
  INVOICES_EDIT = 'invoices.edit',
  INVOICES_DELETE = 'invoices.delete',

  // Reports
  REPORTS_VIEW = 'reports.view',
  REPORTS_EXPORT = 'reports.export',

  // Team
  TEAM_VIEW = 'team.view',
  TEAM_INVITE = 'team.invite',
  TEAM_REMOVE = 'team.remove',
  TEAM_MANAGE_ROLES = 'team.manage_roles',

  // Settings
  SETTINGS_VIEW = 'settings.view',
  SETTINGS_EDIT = 'settings.edit',
  SETTINGS_BILLING = 'settings.billing',

  // Admin
  ADMIN_ACCESS = 'admin.access',
}

export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'USER'

export const rolePermissions: Record<Role, Permission[]> = {
  SUPER_ADMIN: Object.values(Permission),

  ADMIN: [
    Permission.CLIENTS_VIEW,
    Permission.CLIENTS_CREATE,
    Permission.CLIENTS_EDIT,
    Permission.CLIENTS_DELETE,
    Permission.PROGRAMS_VIEW,
    Permission.PROGRAMS_CREATE,
    Permission.PROGRAMS_EDIT,
    Permission.PROGRAMS_DELETE,
    Permission.PROGRAMS_SCHEDULE,
    Permission.SMS_VIEW,
    Permission.SMS_CREATE,
    Permission.SMS_SEND,
    Permission.SMS_EDIT,
    Permission.SMS_DELETE,
    Permission.MEDIA_VIEW,
    Permission.MEDIA_UPLOAD,
    Permission.ADS_VIEW,
    Permission.ADS_CREATE,
    Permission.ADS_EDIT,
    Permission.ADS_DELETE,
    Permission.CONTRACTS_VIEW,
    Permission.CONTRACTS_CREATE,
    Permission.CONTRACTS_EDIT,
    Permission.INVOICES_VIEW,
    Permission.INVOICES_CREATE,
    Permission.INVOICES_EDIT,
    Permission.REPORTS_VIEW,
    Permission.TEAM_VIEW,
    Permission.TEAM_INVITE,
    Permission.SETTINGS_VIEW,
    Permission.SETTINGS_EDIT,
  ],

  MANAGER: [
    Permission.CLIENTS_VIEW,
    Permission.CLIENTS_CREATE,
    Permission.CLIENTS_EDIT,
    Permission.PROGRAMS_VIEW,
    Permission.PROGRAMS_CREATE,
    Permission.PROGRAMS_EDIT,
    Permission.PROGRAMS_SCHEDULE,
    Permission.SMS_VIEW,
    Permission.SMS_CREATE,
    Permission.SMS_SEND,
    Permission.MEDIA_VIEW,
    Permission.MEDIA_UPLOAD,
    Permission.ADS_VIEW,
    Permission.ADS_CREATE,
    Permission.ADS_EDIT,
    Permission.CONTRACTS_VIEW,
    Permission.INVOICES_VIEW,
    Permission.REPORTS_VIEW,
    Permission.SETTINGS_VIEW,
  ],

  USER: [
    Permission.CLIENTS_VIEW,
    Permission.PROGRAMS_VIEW,
    Permission.SMS_VIEW,
    Permission.MEDIA_VIEW,
    Permission.MEDIA_UPLOAD,
    Permission.ADS_VIEW,
    Permission.CONTRACTS_VIEW,
    Permission.INVOICES_VIEW,
    Permission.REPORTS_VIEW,
  ],
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: Role): Permission[] {
  return rolePermissions[role] ?? []
}

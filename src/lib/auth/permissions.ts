import type { Role } from '@prisma/client'

/**
 * Permission definitions for the application
 * Maps permission keys to the roles that have access
 */
export const PERMISSIONS = {
  // Workspace management
  'workspace.read': ['OWNER', 'ADMIN', 'EDITOR', 'VIEWER'],
  'workspace.update': ['OWNER', 'ADMIN'],
  'workspace.delete': ['OWNER'],
  'workspace.invite': ['OWNER', 'ADMIN'],

  // Ad Account connections
  'ad_account.read': ['OWNER', 'ADMIN', 'EDITOR', 'VIEWER'],
  'ad_account.connect': ['OWNER', 'ADMIN'],
  'ad_account.update': ['OWNER', 'ADMIN'],
  'ad_account.disconnect': ['OWNER', 'ADMIN'],
  'ad_account.sync': ['OWNER', 'ADMIN', 'EDITOR'],

  // Metrics & Data
  'metrics.read': ['OWNER', 'ADMIN', 'EDITOR', 'VIEWER'],
  'metrics.create': ['OWNER', 'ADMIN', 'EDITOR'],
  'metrics.update': ['OWNER', 'ADMIN', 'EDITOR'],
  'metrics.delete': ['OWNER', 'ADMIN'],

  // Custom Metrics
  'custom_metrics.read': ['OWNER', 'ADMIN', 'EDITOR', 'VIEWER'],
  'custom_metrics.create': ['OWNER', 'ADMIN', 'EDITOR'],
  'custom_metrics.update': ['OWNER', 'ADMIN', 'EDITOR'],
  'custom_metrics.delete': ['OWNER', 'ADMIN'],

  // Goals
  'goals.read': ['OWNER', 'ADMIN', 'EDITOR', 'VIEWER'],
  'goals.create': ['OWNER', 'ADMIN', 'EDITOR'],
  'goals.update': ['OWNER', 'ADMIN', 'EDITOR'],
  'goals.delete': ['OWNER', 'ADMIN'],

  // Funnels
  'funnels.read': ['OWNER', 'ADMIN', 'EDITOR', 'VIEWER'],
  'funnels.create': ['OWNER', 'ADMIN', 'EDITOR'],
  'funnels.update': ['OWNER', 'ADMIN', 'EDITOR'],
  'funnels.delete': ['OWNER', 'ADMIN'],

  // Webhooks
  'webhooks.read': ['OWNER', 'ADMIN', 'EDITOR', 'VIEWER'],
  'webhooks.create': ['OWNER', 'ADMIN'],
  'webhooks.update': ['OWNER', 'ADMIN'],
  'webhooks.delete': ['OWNER', 'ADMIN'],

  // Sales Data
  'sales.read': ['OWNER', 'ADMIN', 'EDITOR', 'VIEWER'],
  'sales.export': ['OWNER', 'ADMIN', 'EDITOR'],

  // API Keys
  'api_keys.read': ['OWNER', 'ADMIN'],
  'api_keys.create': ['OWNER', 'ADMIN'],
  'api_keys.delete': ['OWNER', 'ADMIN'],

  // Team management
  'members.read': ['OWNER', 'ADMIN', 'EDITOR', 'VIEWER'],
  'members.invite': ['OWNER', 'ADMIN'],
  'members.remove': ['OWNER', 'ADMIN'],
  'members.update_role': ['OWNER'],
} as const

export type Permission = keyof typeof PERMISSIONS

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  const allowedRoles = PERMISSIONS[permission]
  return (allowedRoles as readonly string[]).includes(role)
}

/**
 * Check if a role can perform multiple permissions
 */
export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every((permission) => hasPermission(role, permission))
}

/**
 * Check if a role can perform at least one of the permissions
 */
export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission))
}

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(role: Role): Permission[] {
  return (Object.keys(PERMISSIONS) as Permission[]).filter((permission) =>
    hasPermission(role, permission)
  )
}

/**
 * Role hierarchy for comparison
 */
const ROLE_HIERARCHY: Record<Role, number> = {
  OWNER: 4,
  ADMIN: 3,
  EDITOR: 2,
  VIEWER: 1,
}

/**
 * Check if one role is higher than another
 */
export function isRoleHigherThan(role: Role, otherRole: Role): boolean {
  return ROLE_HIERARCHY[role] > ROLE_HIERARCHY[otherRole]
}

/**
 * Check if one role is at least equal to another
 */
export function isRoleAtLeast(role: Role, minimumRole: Role): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[minimumRole]
}

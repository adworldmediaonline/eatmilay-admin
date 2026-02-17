export const ADMIN_ROLES = ["admin", "super_admin"] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export function isAdminRole(role: string | undefined): role is AdminRole {
  return role !== undefined && ADMIN_ROLES.includes(role as AdminRole);
}

export function isUserRole(role: string | undefined): boolean {
  return role === "user" || role === undefined;
}

import type { Role } from "@/generated/prisma/enums";

const roleRank: Record<Role, number> = {
  OWNER: 4,
  ADMIN: 3,
  MEMBER: 2,
  VIEWER: 1,
};

export function hasRole(currentRole: Role, requiredRole: Role) {
  return roleRank[currentRole] >= roleRank[requiredRole];
}

export function canManageOrganization(role: Role) {
  return hasRole(role, "ADMIN");
}

export function canManageProjects(role: Role) {
  return hasRole(role, "MEMBER");
}

export function canViewProjects(role: Role) {
  return hasRole(role, "VIEWER");
}
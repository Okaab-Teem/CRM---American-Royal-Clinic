import type { CurrentUser } from "@/types/common";

export function can(user: CurrentUser | null, permission: string) {
  return Boolean(user?.permissions.includes(permission));
}

export function anyPermission(user: CurrentUser | null, permissions: string[]) {
  return permissions.some((permission) => can(user, permission));
}

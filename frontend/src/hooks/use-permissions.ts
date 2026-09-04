import { useAuth } from "@/features/auth/auth-context";
import { can, anyPermission } from "@/lib/permissions";

export function usePermissions() {
  const { user } = useAuth();
  return {
    can: (permission: string) => can(user, permission),
    any: (permissions: string[]) => anyPermission(user, permissions),
  };
}

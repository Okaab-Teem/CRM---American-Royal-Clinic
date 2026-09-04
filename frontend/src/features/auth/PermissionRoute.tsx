import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/features/auth/auth-context";
import { usePermissions } from "@/hooks/use-permissions";
import type { UserRole } from "@/types/common";

interface PermissionRouteProps {
  permission?: string;
  allowedRoles?: UserRole[];
}

export function PermissionRoute({ permission, allowedRoles }: PermissionRouteProps) {
  const { user } = useAuth();
  const permissions = usePermissions();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/403" replace />;
  }

  if (permission && !permissions.can(permission)) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}

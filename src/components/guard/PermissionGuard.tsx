import React, { ReactNode } from "react";
import { usePermissions } from "../../hooks/usePermissions";

interface PermissionGuardProps {
  permission?: string;
  anyOf?: string[];
  allOf?: string[];
  fallback?: ReactNode;
  children: ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  anyOf,
  allOf,
  fallback = null,
  children,
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  let isAllowed = true;

  if (permission && !hasPermission(permission)) {
    isAllowed = false;
  }
  if (anyOf && anyOf.length > 0 && !hasAnyPermission(anyOf)) {
    isAllowed = false;
  }
  if (allOf && allOf.length > 0 && !hasAllPermissions(allOf)) {
    isAllowed = false;
  }

  return isAllowed ? <>{children}</> : <>{fallback}</>;
};

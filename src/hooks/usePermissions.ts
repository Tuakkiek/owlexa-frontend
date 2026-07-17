import { useAuthStore } from "../store/authStore";

export function usePermissions() {
  const { user } = useAuthStore();
  const permissions = user?.permissions || [];

  const hasPermission = (permission: string) => permissions.includes(permission);

  const hasAnyPermission = (requiredPermissions: string[]) => {
    return requiredPermissions.some((perm) => permissions.includes(perm));
  };

  const hasAllPermissions = (requiredPermissions: string[]) => {
    return requiredPermissions.every((perm) => permissions.includes(perm));
  };

  return { permissions, hasPermission, hasAnyPermission, hasAllPermissions };
}

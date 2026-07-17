import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { usePermissions } from '../hooks/usePermissions';

interface ProtectedRouteProps {
  allowedRoles?: Array<'ADMIN' | 'OWNER' | 'TEACHER' | 'STUDENT' | 'CASHIER' | 'MANAGER' | 'ACADEMIC_STAFF'>;
  permission?: string;
  anyOf?: string[];
  allOf?: string[];
}

const ProtectedRoute = ({ allowedRoles, permission, anyOf, allOf }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuthStore();
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.roleName)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (permission && !hasPermission(permission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (anyOf && anyOf.length > 0 && !hasAnyPermission(anyOf)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (allOf && allOf.length > 0 && !hasAllPermissions(allOf)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;

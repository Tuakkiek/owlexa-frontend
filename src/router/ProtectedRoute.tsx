import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface ProtectedRouteProps {
  allowedRoles?: Array<'ADMIN' | 'OWNER' | 'TEACHER' | 'STUDENT' | 'CASHIER'>;
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.roleName)) {
    return <Navigate to="/unauthorized" replace />; // Or 404
  }

  return <Outlet />;
};

export default ProtectedRoute;

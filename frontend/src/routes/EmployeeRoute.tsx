import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore, useIsAdmin, useIsEmployee } from '../store/authStore';

export const EmployeeRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isAdmin = useIsAdmin();
  const isEmployee = useIsEmployee();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin && !isEmployee) {
    return <Navigate to="/" replace />; // Kỵ mạo danh thì đá về Home
  }

  return <Outlet />;
};

import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const ADMIN_TOKEN_KEY = 'auth-access-token';

export const checkAuth = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  return Boolean(localStorage.getItem(ADMIN_TOKEN_KEY));
};

export const AdminRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const role = useAuthStore((state) => state.user?.role?.toUpperCase() ?? '');

  const isAdminOrEmployee = role === 'ADMIN' || role === 'EMPLOYEE' || role === 'EMPOYEE';

  if (!checkAuth() || !isAuthenticated || !isAdminOrEmployee) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
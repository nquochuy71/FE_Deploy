import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export const GuestRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const role = useAuthStore((state) => state.user?.role?.toUpperCase() ?? '');
  const internalDashboardPath = role === 'ADMIN' || role === 'EMPLOYEE' || role === 'EMPOYEE' ? '/admin/dashboard' : '/';

  // Nếu đã đăng nhập thì quay về trang chủ, ko cho vào login/register nữa
  if (isAuthenticated) {
    return <Navigate to={internalDashboardPath} replace />;
  }

  return <Outlet />;
};

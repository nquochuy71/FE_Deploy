import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useAuth } from '../../hooks/useAuth';
import { AdminSidebar } from '../admin/AdminSidebar';
import { AdminNotFound } from '../../pages/admin/AdminNotFound';

export const AdminLayout = () => {
  const user = useAuthStore((state) => state.user);
  const role = user?.role?.toUpperCase() ?? '';
  const navigate = useNavigate();
  const location = useLocation();
  const { logoutMutation } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const restrictedVoucherPaths = ['/admin/vouchers', '/admin/voucher'];

  if (role !== 'ADMIN' && restrictedVoucherPaths.includes(location.pathname)) {
    return <AdminNotFound />;
  }

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        navigate('/login');
      },
    });
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: collapsed ? '76px 1fr' : '264px 1fr',
        background: 'var(--color-cream)',
        transition: 'grid-template-columns 0.25s ease',
      }}
    >
      <AdminSidebar
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((value) => !value)}
        onLogout={handleLogout}
        isLogoutPending={logoutMutation.isPending}
        role={role}
      />

      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            padding: '1.25rem 2rem',
            background: 'rgba(250, 246, 240, 0.92)',
            borderBottom: '1px solid rgba(201,169,110,0.18)',
            backdropFilter: 'blur(14px)',
          }}
        >
          <div>
            <p style={{ margin: 0, color: 'var(--color-gold-dark)', fontSize: '0.78rem', letterSpacing: '0.24em', textTransform: 'uppercase' }}>Internal console</p>
            <h1 style={{ margin: '0.15rem 0 0', fontSize: '1.5rem', color: 'var(--color-black)' }}>Lumière</h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontWeight: 700, color: 'var(--color-black)' }}>{user?.email || 'admin@gmail.com'}</p>
              
            </div>
          </div>
        </header>

        <main style={{ flex: 1, padding: '2rem', overflow: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
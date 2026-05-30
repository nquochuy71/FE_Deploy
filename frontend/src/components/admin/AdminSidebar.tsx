import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PackageSearch, Users, Settings, Box, Ticket, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';

type AdminSidebarProps = {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onLogout: () => void;
  isLogoutPending: boolean;
  role?: string;
};

const linkStyle = ({ isActive }: { isActive: boolean }, collapsed: boolean) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: collapsed ? 'center' : 'flex-start',
  gap: collapsed ? '0' : '0.75rem',
  padding: collapsed ? '0.95rem' : '0.9rem 1rem',
  borderRadius: '14px',
  color: isActive ? 'var(--color-black)' : '#f5f0e7',
  background: isActive ? 'linear-gradient(135deg, #D4B785, #C5A872)' : 'transparent',
  textDecoration: 'none',
  fontWeight: 600,
  boxShadow: isActive ? '0 14px 30px rgba(201,169,110,0.28)' : 'none',
});

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/products', label: 'Quản lý sản phẩm', icon: PackageSearch },
  { to: '/admin/orders', label: 'Quản lý đơn hàng', icon: Box },
  { to: '/admin/vouchers', label: 'Quản lý voucher', icon: Ticket },
  { to: '/admin/users', label: 'Quản lý người dùng', icon: Users },
  { to: '/admin/profile', label: 'Quản lý thông tin cá nhân', icon: Settings },
];

export const AdminSidebar = ({ collapsed, onToggleCollapsed, onLogout, isLogoutPending, role }: AdminSidebarProps) => {
  const visibleNavItems = role === 'ADMIN' ? navItems : navItems.filter((item) => item.to !== '/admin/vouchers');

  return (
    <aside
      style={{
        position: 'sticky',
        top: 0,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        padding: collapsed ? '1rem 0.7rem' : '1.5rem',
        background: 'linear-gradient(180deg, var(--color-charcoal) 0%, var(--color-black) 100%)',
        color: 'var(--color-cream)',
        boxShadow: 'inset -1px 0 0 rgba(201,169,110,0.14)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: collapsed ? 'center' : 'flex-end', marginBottom: '1.5rem' }}>
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
          title={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
          style={{
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: '999px',
            border: '1px solid rgba(201,169,110,0.22)',
            background: 'rgba(255,255,255,0.05)',
            color: 'var(--color-cream)',
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {!collapsed && (
        <div style={{ marginBottom: '0.85rem', padding: '0 0.25rem' }}>
          <p style={{ margin: 0, fontSize: '0.72rem', letterSpacing: '0.26em', textTransform: 'uppercase', color: 'var(--color-gold-light)' }}>
            Chức năng
          </p>
        </div>
      )}

      <nav style={{ display: 'grid', gap: '0.6rem' }}>
        {visibleNavItems.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} style={(state) => linkStyle(state, collapsed)} title={collapsed ? label : undefined}>
            <Icon size={18} />
            {!collapsed && label}
          </NavLink>
        ))}
      </nav>

      <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(201,169,110,0.14)' }}>
        
        <button
          type="button"
          onClick={onLogout}
          disabled={isLogoutPending}
          title={collapsed ? 'Đăng xuất' : undefined}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: collapsed ? '0' : '0.75rem',
            padding: collapsed ? '0.85rem' : '0.9rem 1rem',
            borderRadius: '14px',
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.04)',
            color: 'var(--color-cream)',
            fontWeight: 600,
            cursor: isLogoutPending ? 'not-allowed' : 'pointer',
            opacity: isLogoutPending ? 0.6 : 1,
          }}
        >
          <LogOut size={18} />
          {!collapsed && (isLogoutPending ? 'Đang đăng xuất...' : 'Đăng xuất')}
        </button>
      </div>
    </aside>
  );
};
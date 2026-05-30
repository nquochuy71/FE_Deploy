import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthStore, useIsAdmin, useIsEmployee, useIsCustomer } from '../../store/authStore';
import { useAuth } from '../../hooks/useAuth';
import { cartApi } from '../../api/cartApi';
import { useGuestCartStore } from '../../store/guestCartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import {  ShoppingBag, UserCircle, ClipboardList, Heart } from 'lucide-react';

export const Header = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const accountId = useAuthStore((state) => state.user?.accountId);
  const { logoutMutation } = useAuth();
  const isCustomer = useIsCustomer();
  const guestCartCount = useGuestCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const { items: wishItems, initialized } = useWishlistStore();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated && isCustomer && accountId && !initialized) {
      // Tìm customerId qua accountId nếu cần, hoặc giả sử store tự handle
      // Ở đây useCustomerId hook thường dùng userApi.getCustomerByAccountId
      // Để đơn giản và nhất quán, ta fetch wishlist nếu đã có accountId
      // Tuy nhiên wishlistApi cần customerId. 
      // Tạm thời để store fetch khi có customerId ở component con, 
      // hoặc ta bổ sung logic fetch ở đây nếu có customerId.
    }
  }, [isAuthenticated, isCustomer, accountId, initialized]);

  const wishCount = isCustomer ? wishItems.length : 0;

  useEffect(() => {
    let isMounted = true;

    const loadCartCount = async () => {
      if (!isAuthenticated || !accountId || !isCustomer) {
        setCartCount(0);
        return;
      }
      try {
        const res = await cartApi.getCartByAccountId(accountId);
        if (isMounted) {
          const total = res.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
          setCartCount(total);
        }
      } catch {
        if (isMounted) {
          setCartCount(0);
        }
      }
    };

    loadCartCount();
    const handler = () => loadCartCount();
    window.addEventListener('cart:updated', handler);

    return () => {
      isMounted = false;
      window.removeEventListener('cart:updated', handler);
    };
  }, [isAuthenticated, accountId, isCustomer]);

  const displayCartCount = isCustomer ? cartCount : (!isAuthenticated ? guestCartCount : 0);
  const showCartIcon = isCustomer || !isAuthenticated;


  const isAdmin = useIsAdmin();
  const isEmployee = useIsEmployee();
  const canAccessDashboard = isAdmin || isEmployee;

  return (
    <header className="header" id="header" style={{ position: 'sticky', top: 0, zIndex: 1000, background: 'rgba(250, 246, 240, 0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(201,169,110,0.15)' }}>
      <div className="header__inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '80px', maxWidth: '1400px', margin: '0 auto', padding: '0 2rem' }}>

        {/* Logo */}
        <Link to="/" className="logo" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span className="logo__main" style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-black)', letterSpacing: '6px', textTransform: 'uppercase' }}>Lumière</span>
          <span className="logo__sub" style={{ fontFamily: 'var(--font-accent)', fontSize: '0.7rem', color: 'var(--color-gold)', letterSpacing: '5px', textTransform: 'uppercase' }}>Beauty & Skincare</span>
        </Link>

        {/* Navigation */}
        <nav className="nav" style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <ul className="nav__list" style={{ display: 'flex', alignItems: 'center', gap: '2rem', listStyle: 'none', margin: 0, padding: 0 }}>
            <li className="nav__item">
              <Link to="/" className="nav__link">Trang chủ</Link>
            </li>
            <li className="nav__item">
              <Link to="/products" className="nav__link">Sản phẩm</Link>
            </li>
            {isAuthenticated && isCustomer && (
              <li className="nav__item">
                <Link to="/recommendations" className="nav__link" style={{ color: 'var(--color-gold)', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span role="img" aria-label="sparkles">✨</span> Dành cho bạn
                </Link>
              </li>
            )}
            {canAccessDashboard && (
              <li className="nav__item">
                <Link to="/admin/dashboard" className="nav__link" style={{ color: 'var(--color-error)', fontWeight: 'bold' }}>Dashboard Nội Bộ</Link>
              </li>
            )}
          </ul>
        </nav>

        {/* Header Actions */}
        <div className="header__actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            className="header__action-btn"
            aria-label="Tìm kiếm"
            style={{ border: 'none', background: 'none', fontSize: '1.1rem', cursor: 'pointer', padding: '10px' }}
            onClick={() => navigate('/products')}
          >
          </button>
          {showCartIcon && (
            <Link to="/cart" className="header__action-btn" aria-label="Giỏ hàng" style={{ border: 'none', background: 'none', fontSize: '1.1rem', cursor: 'pointer', padding: '10px', position: 'relative' }}>
              <ShoppingBag size={20} />
              {displayCartCount > 0 && (
                <span className="badge" style={{ position: 'absolute', top: 0, right: 0, background: 'var(--color-gold)', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '50%' }}>{displayCartCount}</span>
              )}
            </Link>
          )}

          {isAuthenticated ? (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <Link to="/orders" className="header__action-btn" aria-label="Đơn hàng" style={{ border: 'none', background: 'none', fontSize: '1.1rem', cursor: 'pointer', padding: '10px' }}>
                <ClipboardList size={20} />
              </Link>
              <Link to="/profile" state={{ activeTab: 'wishlist' }} className="header__action-btn" aria-label="Yêu thích" style={{ border: 'none', background: 'none', fontSize: '1.1rem', cursor: 'pointer', padding: '10px', position: 'relative' }}>
                <Heart size={20} />
                {wishCount > 0 && (
                  <span className="badge" style={{ position: 'absolute', top: 0, right: 0, background: '#ef4444', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '50%' }}>{wishCount}</span>
                )}
              </Link>
              <Link to="/profile" className="header__action-btn" aria-label="Tài khoản" style={{ border: 'none', background: 'none', fontSize: '1.1rem', cursor: 'pointer', padding: '10px' }}>
                <UserCircle size={20} />
              </Link>
              <button onClick={() => logoutMutation.mutate()} style={{ background: 'none', border: '1px solid var(--color-gray-300)', padding: '5px 15px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>
                Đăng xuất
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <Link to="/order-lookup" className="nav__link" style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>Tra cứu đơn</Link>
              <button onClick={() => navigate('/login')} className="btn btn--primary btn--sm" style={{ padding: '8px 20px', background: 'linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Đăng nhập
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

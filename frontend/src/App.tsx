import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useAuthStore } from './store/authStore';

// Layouts & Guards
import { MainLayout } from './components/layout/MainLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import { GuestRoute } from './routes/GuestRoute';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { AdminRoute } from './routes/AdminRoute';

// Pages
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Profile } from './pages/Profile';
import { Home, ProductList, ProductDetail, Cart, Checkout, OrderHistory, OrderDetail, OrderSuccess, OrderFailed, Payment, VerifyEmail, ForgotPassword, ResetPassword, CategoryDetailPage, BrandDetailPage, Chat, OrderLookup, RecommendationsPage } from './pages';
import { Dashboard as AdminDashboard } from './pages/admin/Dashboard';
import { ProductManagement } from './pages/admin/ProductManagement';
import { UserManagement} from './pages/admin/UserManagement';
import { OrderManagement } from './pages/admin/OrderManagement';
import { ProductCreatePage } from './pages/admin/product-create/ProductCreatePage';
import { ProductEditPage } from './pages/admin/product-edit/ProductEditPage';
import { VoucherManagement } from './pages/admin/VoucherManagement';

function App() {
  const { initSession } = useAuth();
  const isInitialized = useAuthStore((state) => state.isInitialized);

  useEffect(() => {
    initSession();
  }, [initSession]);

  // Hiển thị vòng xoáy (Loading screen) hoặc logo trong lúc chờ khôi phục session từ Backend
  if (!isInitialized) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--color-cream)' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-gold)', letterSpacing: '4px', animation: 'sparkle 2s infinite' }}>LUMIÈRE</h1>
        <p style={{ color: 'var(--color-gray-500)' }}>Đang tải cửa hàng...</p>
      </div>
    );
  }

  return (
    <div className="font-[Arial]">
      <BrowserRouter>
        <Routes>
        {/* Nhóm Main Layout (có Header/Footer) */}
        <Route element={<MainLayout />}>

          {/* Dashboar for admin and employee */}
          
          
          {/* Public Routes (Ai cũng xem được) */}
          <Route path="/" element={<Home />} />
          <Route path="/categories/:slug" element={<CategoryDetailPage />} />
          <Route path="/brands/:slug" element={<BrandDetailPage />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-lookup" element={<OrderLookup />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/order-success/:orderId" element={<OrderSuccess />} />
          <Route path="/order-failed/:orderId" element={<OrderFailed />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* Guest Routes (Chỉ người CHƯA đăng nhập) */}
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>

          {/* Protected Routes (Chỉ người ĐÃ đăng nhập) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<Profile />} />
            <Route path="/ai-chat" element={<Chat />} />
            <Route path="/orders" element={<OrderHistory />} />
            <Route path="/orders/:orderId" element={<OrderDetail />} />
            <Route path="/recommendations" element={<RecommendationsPage />} />
          </Route>

          {/* Employee/Admin Routes */}
          {/* <Route element={<EmployeeRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
          </Route> */}
        </Route>
        {/* ================= ADMIN ================= */}
        <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
        <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="products" element={<ProductManagement />} />
              <Route path="products/new" element={<ProductCreatePage />} />
              <Route path="products/:productId/edit" element={<ProductEditPage />} />
              <Route path="orders" element={<OrderManagement />} />
              <Route path="voucher" element={<VoucherManagement />} />
              <Route path="vouchers" element={<VoucherManagement />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="profile" element={<Profile />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;

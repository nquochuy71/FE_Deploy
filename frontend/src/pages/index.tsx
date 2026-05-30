// Tập trung tất cả các exports từ các file riêng biệt (Theo cấu trúc của develop)
export { ProductList } from './ProductList';
export { ProductDetail } from './ProductDetail';
export { HomePage as Home, HomePage } from './HomePage';
export { CategoryDetailPage } from './CategoryDetailPage';
export { BrandDetailPage } from './BrandDetailPage';
export { Cart } from './Cart';
export { Checkout } from './Checkout';
export { OrderLookup } from './OrderLookup';
export { OrderHistory } from './OrderHistory';
export { OrderDetail } from './OrderDetail';
export { OrderSuccess } from './OrderSuccess';
export { OrderFailed } from './OrderFailed';
export { Chat } from './Chat';
export { VerifyEmail } from './VerifyEmail';
export { ForgotPassword } from './ForgotPassword';
export { ResetPassword } from './ResetPassword';
export { RecommendationsPage } from './RecommendationsPage';

// Component giả lập chưa được tách file
export const Payment = () => {
    return (
        <div style={{ padding: '4rem', textAlign: 'center' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', color: 'var(--color-gold)' }}>Giả lập cổng Thanh toán (VNPay...)</h1>
            <p>Thực hiện thanh toán...</p>
        </div>
    );
};

// Component nội bộ đang bị ẩn
// export const Dashboard = () => {
//     return (
//         <div style={{ padding: '4rem', textAlign: 'center' }}>
//             <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', color: 'var(--color-error)' }}>Dashboard (Nội bộ)</h1>
//             <p>Trang quản trị dành riêng cho nhân viên và admin</p>
//         </div>
//     );
// };
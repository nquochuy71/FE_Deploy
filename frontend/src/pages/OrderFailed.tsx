import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export const OrderFailed = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
            if (orderId) {
                navigate(`/orders/${orderId}`);
            } else {
                navigate('/orders');
            }
        }, 3000);

        return () => clearTimeout(timer);
    }, [orderId, navigate]);

    return (
        <div style={{ padding: '4rem', textAlign: 'center', minHeight: '60vh' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', color: '#ef4444' }}>Thanh toán thất bại</h1>
            <p style={{ marginTop: '1rem', color: 'var(--color-gray-500)' }}>Giao dịch chưa thành công. Đang chuyển đến chi tiết đơn hàng...</p>
            <button
                type="button"
                onClick={() => orderId ? navigate(`/orders/${orderId}`) : navigate('/orders')}
                style={{ marginTop: '1.5rem', padding: '10px 20px', background: '#ef4444', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer' }}
            >
                Xem chi tiết đơn hàng
            </button>
        </div>
    );
};

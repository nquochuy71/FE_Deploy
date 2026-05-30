import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export const OrderSuccess = () => {
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
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', color: 'var(--color-gold)' }}>Thanh toán thành công</h1>
            <p style={{ marginTop: '1rem', color: 'var(--color-gray-500)' }}>Cảm ơn bạn đã mua hàng. Đang chuyển đến chi tiết đơn hàng...</p>
            <button
                type="button"
                onClick={() => orderId ? navigate(`/orders/${orderId}`) : navigate('/orders')}
                style={{ marginTop: '1.5rem', padding: '10px 20px', background: 'var(--color-gold)', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer' }}
            >
                Xem chi tiết đơn hàng
            </button>
        </div>
    );
};

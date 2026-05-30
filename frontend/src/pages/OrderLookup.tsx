import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { orderApi } from '../api/orderApi';
import type { OrderResponse } from '../types/order';
import { toast } from 'sonner';
import { XCircle } from 'lucide-react';
import { CancelOrderModal } from '../components/order/CancelOrderModal';

const formatCurrency = (value?: number) => {
    if (value === null || value === undefined) return '--';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
};

const statusLabels: Record<string, string> = {
    PENDING: 'Chờ xác nhận',
    CONFIRMED: 'Đã xác nhận',
    PROCESSING: 'Đang xử lý',
    SHIPPING: 'Đang giao',
    DELIVERED: 'Đã giao',
    CANCELLED: 'Đã hủy',
    REFUNDED: 'Đã hoàn tiền',
};

export const OrderLookup = () => {
    const location = useLocation();
    const [orderCode, setOrderCode] = useState(location.state?.orderCode || '');
    const [email, setEmail] = useState(location.state?.email || '');
    const [order, setOrder] = useState<OrderResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

    const handleLookup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orderCode.trim() || !email.trim()) {
            toast.error('Vui lòng nhập mã đơn hàng và email');
            return;
        }

        setLoading(true);
        setSearched(true);
        try {
            const res = await orderApi.lookupOrder(orderCode.trim(), email.trim());
            const data = (res as unknown as { data?: OrderResponse }).data ?? res;
            setOrder(data);
        } catch {
            setOrder(null);
            toast.error('Không tìm thấy đơn hàng. Vui lòng kiểm tra lại mã đơn và email.');
        } finally {
            setLoading(false);
        }
    };

    const confirmCancelOrder = async (reason: string) => {
        if (!order) return;
        try {
            await orderApi.updateOrderStatus(order.id, { status: 'CANCELLED', cancelReason: reason });
            toast.success('Hủy đơn hàng thành công');
            setOrder(prev => prev ? { ...prev, status: 'CANCELLED' as any } : null);
        } catch (error) {
            toast.error('Lỗi khi hủy đơn hàng');
        } finally {
            setIsCancelModalOpen(false);
        }
    };

    return (
        <div style={{ padding: '4rem 2rem', maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', color: 'var(--color-gold)', textAlign: 'center', marginBottom: '0.5rem' }}>Tra cứu đơn hàng</h1>
            <p style={{ textAlign: 'center', color: 'var(--color-gray-500)', marginBottom: '2rem' }}>Nhập mã đơn hàng và email để xem trạng thái đơn hàng của bạn</p>

            <form onSubmit={handleLookup} style={{ background: '#fff', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '2rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Mã đơn hàng</label>
                    <input type="text" value={orderCode} onChange={e => setOrderCode(e.target.value)} placeholder="VD: ORD-20260520-1234" required style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '1rem' }} />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email bạn đã dùng khi đặt hàng" required style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '1rem' }} />
                </div>
                <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                    {loading ? 'Đang tìm...' : 'Tra cứu'}
                </button>
            </form>

            {searched && !loading && !order && (
                <div style={{ textAlign: 'center', padding: '2rem', background: '#fff3f3', borderRadius: '12px', color: '#c0392b' }}>
                    Không tìm thấy đơn hàng. Vui lòng kiểm tra lại thông tin.
                </div>
            )}

            {order && (
                <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #eee' }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--color-black)' }}>Đơn hàng: {order.orderCode}</h2>
                            <p style={{ margin: '0.25rem 0 0', color: 'var(--color-gray-500)', fontSize: '0.9rem' }}>Ngày đặt: {new Date(order.orderDate).toLocaleDateString('vi-VN')}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {order.status === 'PENDING' && (
                                <button
                                    onClick={() => setIsCancelModalOpen(true)}
                                    style={{ padding: '6px 12px', borderRadius: '20px', background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                    <XCircle size={14} />
                                    Hủy đơn
                                </button>
                            )}
                            {order.status !== 'PENDING' && !['CANCELLED', 'DELIVERED', 'REFUNDED'].includes(order.status) && (
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-gray-500)', fontStyle: 'italic', marginRight: '4px' }}>
                                    Liên hệ CSKH để hủy
                                </span>
                            )}
                            <span style={{ padding: '6px 16px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600, background: order.status === 'DELIVERED' ? '#e8f5e9' : order.status === 'CANCELLED' ? '#ffebee' : '#fff3e0', color: order.status === 'DELIVERED' ? '#2e7d32' : order.status === 'CANCELLED' ? '#c62828' : '#e65100' }}>
                                {statusLabels[order.status] || order.status}
                            </span>
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--color-gray-600)' }}>Thông tin giao hàng</h3>
                        <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}><strong>Người nhận:</strong> {order.recipientName}</p>
                        <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}><strong>SĐT:</strong> {order.phone}</p>
                        <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}><strong>Địa chỉ:</strong> {order.shippingAddress}</p>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--color-gray-600)' }}>Sản phẩm</h3>
                        {order.items.map(item => (
                            <div key={item.id} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid #f5f5f5' }}>
                                {item.imageUrl ? (
                                    <img src={item.imageUrl} alt={item.productName} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px' }} />
                                ) : (
                                    <div style={{ width: '50px', height: '50px', background: '#eee', borderRadius: '6px' }} />
                                )}
                                <div style={{ flex: 1 }}>
                                    <p style={{ margin: 0, fontWeight: 500, fontSize: '0.9rem' }}>{item.productName}</p>
                                    <p style={{ margin: '2px 0 0', color: '#888', fontSize: '0.8rem' }}>{item.variantName} x {item.quantity}</p>
                                </div>
                                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{formatCurrency(item.totalPrice)}</span>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-gold)', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
                        <span>Tổng cộng</span>
                        <span>{formatCurrency(order.total)}</span>
                    </div>
                </div>
            )}

            <CancelOrderModal 
                isOpen={isCancelModalOpen} 
                onClose={() => setIsCancelModalOpen(false)} 
                onConfirm={confirmCancelOrder} 
            />
        </div>
    );
};

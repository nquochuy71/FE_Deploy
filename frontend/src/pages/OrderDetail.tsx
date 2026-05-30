import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderApi } from '../api/orderApi';
import type { OrderResponse, OrderStatus, PaymentStatus } from '../types/order';
import { toast } from 'sonner';
import { Package, Clock, CheckCircle, Truck, XCircle } from 'lucide-react';
import { CancelOrderModal } from '../components/order/CancelOrderModal';

const formatCurrency = (value?: number) => {
    if (value === null || value === undefined) {
        return '--';
    }
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(value);
};

const formatDate = (dateString?: string) => {
    if (!dateString) return '--';
    try {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('vi-VN', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        }).format(date);
    } catch {
        return dateString;
    }
};

const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
        case 'PENDING':
            return { color: '#f59e0b', label: 'Chờ xác nhận', icon: <Clock size={16} /> };
        case 'CONFIRMED':
            return { color: '#3b82f6', label: 'Đã xác nhận', icon: <CheckCircle size={16} /> };
        case 'PROCESSING':
            return { color: '#8b5cf6', label: 'Đang xử lý', icon: <Package size={16} /> };
        case 'SHIPPING':
            return { color: '#0ea5e9', label: 'Đang giao hàng', icon: <Truck size={16} /> };
        case 'DELIVERED':
            return { color: '#10b981', label: 'Đã giao thành công', icon: <CheckCircle size={16} /> };
        case 'CANCELLED':
            return { color: '#ef4444', label: 'Đã hủy', icon: <XCircle size={16} /> };
        case 'REFUNDED':
            return { color: '#64748b', label: 'Đã hoàn tiền', icon: <XCircle size={16} /> };
        default:
            return { color: '#6b7280', label: status, icon: <Clock size={16} /> };
    }
};

const getPaymentStatusLabel = (status: PaymentStatus) => {
    switch (status) {
        case 'PENDING': return 'Chưa thanh toán';
        case 'PAID': return 'Đã thanh toán';
        case 'FAILED': return 'Thanh toán thất bại';
        case 'REFUNDED': return 'Đã hoàn tiền';
        default: return status;
    }
};

export const OrderDetail = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const navigate = useNavigate();
    const [order, setOrder] = useState<OrderResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

    useEffect(() => {
        if (!orderId) {
            navigate('/orders');
            return;
        }

        const fetchOrder = async () => {
            try {
                const res = await orderApi.getOrderById(orderId);
                const data = ((res as unknown as { data?: OrderResponse }).data ?? res) as OrderResponse;
                setOrder(data);
            } catch {
                toast.error('Không tìm thấy đơn hàng');
                navigate('/orders');
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [orderId, navigate]);

    const confirmCancelOrder = async (reason: string) => {
        if (!order) return;
        try {
            await orderApi.updateOrderStatus(order.id, { status: 'CANCELLED', cancelReason: reason });
            toast.success('Hủy đơn hàng thành công');
            setOrder(prev => prev ? { ...prev, status: 'CANCELLED' as OrderStatus } : null);
        } catch (error) {
            toast.error('Lỗi khi hủy đơn hàng');
        } finally {
            setIsCancelModalOpen(false);
        }
    };

    if (loading) {
        return <div style={{ padding: '4rem', textAlign: 'center' }}>Đang tải chi tiết đơn hàng...</div>;
    }

    if (!order) {
        return null;
    }

    const statusConfig = getStatusConfig(order.status);

    return (
        <div style={{ padding: '4rem 2rem', maxWidth: '1000px', margin: '0 auto', minHeight: '60vh' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', color: 'var(--color-gold)', marginBottom: '2rem' }}>Chi tiết đơn hàng</h1>

            <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0', paddingBottom: '1rem', marginBottom: '1rem' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Đơn hàng <span style={{ color: 'var(--color-gold)' }}>#{order.orderCode}</span></h3>
                        <span style={{ fontSize: '0.85rem', color: 'var(--color-gray-500)' }}>Đặt lúc: {formatDate(order.orderDate)}</span>
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: statusConfig.color, background: `${statusConfig.color}15`, padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 }}>
                            {statusConfig.icon}
                            {statusConfig.label}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                        <p style={{ margin: '0 0 6px 0', fontSize: '0.8rem', color: 'var(--color-gray-500)' }}>Mã đơn hàng</p>
                        <p style={{ margin: 0, fontWeight: 600 }}>#{order.orderCode}</p>
                    </div>
                    <div>
                        <p style={{ margin: '0 0 6px 0', fontSize: '0.8rem', color: 'var(--color-gray-500)' }}>Cập nhật gần nhất</p>
                        <p style={{ margin: 0, fontWeight: 600 }}>{formatDate(order.updatedAt)}</p>
                    </div>
                    <div>
                        <p style={{ margin: '0 0 6px 0', fontSize: '0.8rem', color: 'var(--color-gray-500)' }}>Thanh toán</p>
                        <p style={{ margin: 0, fontWeight: 600 }}>{order.paymentMethod} - {getPaymentStatusLabel(order.paymentStatus)}</p>
                    </div>
                    <div>
                        <p style={{ margin: '0 0 6px 0', fontSize: '0.8rem', color: 'var(--color-gray-500)' }}>Khách hàng</p>
                        <p style={{ margin: 0, fontWeight: 600 }}>{order.recipientName}</p>
                    </div>
                </div>
            </div>

            <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0', marginBottom: '1.5rem' }}>
                <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.1rem' }}>Thông tin giao hàng</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                    <div>
                        <p style={{ margin: '0 0 6px 0', fontSize: '0.8rem', color: 'var(--color-gray-500)' }}>Người nhận</p>
                        <p style={{ margin: 0, fontWeight: 600 }}>{order.recipientName}</p>
                    </div>
                    <div>
                        <p style={{ margin: '0 0 6px 0', fontSize: '0.8rem', color: 'var(--color-gray-500)' }}>Số điện thoại</p>
                        <p style={{ margin: 0, fontWeight: 600 }}>{order.phone || '--'}</p>
                    </div>
                    <div>
                        <p style={{ margin: '0 0 6px 0', fontSize: '0.8rem', color: 'var(--color-gray-500)' }}>Email</p>
                        <p style={{ margin: 0, fontWeight: 600 }}>{order.email || '--'}</p>
                    </div>
                    <div>
                        <p style={{ margin: '0 0 6px 0', fontSize: '0.8rem', color: 'var(--color-gray-500)' }}>Địa chỉ</p>
                        <p style={{ margin: 0, fontWeight: 600 }}>{order.shippingAddress}</p>
                    </div>
                    <div>
                        <p style={{ margin: '0 0 6px 0', fontSize: '0.8rem', color: 'var(--color-gray-500)' }}>Ghi chú</p>
                        <p style={{ margin: 0, fontWeight: 600 }}>{order.note || '--'}</p>
                    </div>
                </div>
            </div>

            <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' }}>
                <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.1rem' }}>Sản phẩm</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {order.items?.map(item => (
                        <div key={item.id} style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                            {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.productName} style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '6px' }} />
                            ) : (
                                <div style={{ width: '70px', height: '70px', background: '#ddd', borderRadius: '6px' }}></div>
                            )}
                            <div style={{ flex: 1 }}>
                                <h4 style={{ margin: 0, fontSize: '1rem' }}>{item.productName}</h4>
                                {item.variantName && <p style={{ margin: '2px 0', fontSize: '0.85rem', color: 'var(--color-gray-500)' }}>Phân loại: {item.variantName}</p>}
                                <p style={{ margin: 0, fontSize: '0.85rem' }}>x{item.quantity}</p>
                            </div>
                            <div style={{ fontWeight: 600 }}>
                                {formatCurrency(item.totalPrice)}
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px dashed #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--color-gray-500)' }}>
                        <p style={{ margin: '0 0 6px 0' }}>Tạm tính: <strong>{formatCurrency(order.subtotal)}</strong></p>
                        <p style={{ margin: '0 0 6px 0' }}>Giảm giá: <strong>-{formatCurrency(order.discountAmount)}</strong></p>
                        <p style={{ margin: 0 }}>Phí vận chuyển: <strong>{formatCurrency(0)}</strong></p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.9rem', color: 'var(--color-gray-500)', marginRight: '10px' }}>Tổng thanh toán:</span>
                        <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-gold)' }}>{formatCurrency(order.total)}</span>
                    </div>
                </div>
            </div>
            
            <CancelOrderModal 
                isOpen={isCancelModalOpen} 
                onClose={() => setIsCancelModalOpen(false)} 
                onConfirm={confirmCancelOrder} 
            />
        </div>
    );
};

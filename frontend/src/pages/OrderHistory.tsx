import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { orderApi } from '../api/orderApi';
import { userApi } from '../api/userApi';
import { reviewApi } from '../api/reviewApi';
import type { OrderResponse, OrderStatus, PaymentStatus } from '../types/order';
import type { ReviewResponse } from '../types/review';
import { toast } from 'sonner';
import { Package, Clock, CheckCircle, Truck, XCircle, Search } from 'lucide-react';
import { ReviewForm } from '../components/review/ReviewForm';
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

export const OrderHistory = () => {
    const { user } = useAuthStore();
    const [orderList, setOrderList] = useState<OrderResponse[]>([]);
    const [loading, setLoading] = useState(true);
    // Merge state review từ nhánh HEAD
    const [reviewingItem, setReviewingItem] = useState<{ productId: string, orderItemId: string, customerId: string, existingReview?: ReviewResponse } | null>(null);
    const [customerId, setCustomerId] = useState<string>('');
    const [customerReviews, setCustomerReviews] = useState<ReviewResponse[]>([]);
    const [cancelingOrderId, setCancelingOrderId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('ALL');
    const [expandedOrderIds, setExpandedOrderIds] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);

    const toggleExpandOrder = (orderId: string) => {
        setExpandedOrderIds(prev => 
            prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
        );
    };

    useEffect(() => {
        const fetchOrders = async () => {
            if (!user?.accountId) return;
            try {
                // 1. Get customerId
                const userRes = await userApi.getCustomerByAccountId(user.accountId);
                const payload = userRes as unknown as { data?: { id?: string }, id?: string };
                const cId = payload.data?.id ?? payload.id;
                
                if (!cId) {
                    toast.error('Không tìm thấy thông tin khách hàng');
                    return;
                }
                setCustomerId(cId);

                // 2. Get orders
                const ordersRes = await orderApi.getOrdersByCustomerId(cId);
                const data = ((ordersRes as unknown as { data?: OrderResponse[] }).data ?? ordersRes) as OrderResponse[];
                setOrderList(Array.isArray(data) ? data : []);

                // 3. Get customer reviews
                try {
                    const reviewsRes = await reviewApi.getReviewsByCustomerId(cId);
                    const revData = ((reviewsRes as unknown as { data?: ReviewResponse[] }).data ?? reviewsRes) as ReviewResponse[];
                    setCustomerReviews(Array.isArray(revData) ? revData : []);
                } catch {
                    // Ignore review error if it fails
                }
            } catch {
                toast.error('Lỗi khi tải danh sách đơn hàng');
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [user]);

    const confirmCancelOrder = async (reason: string) => {
        if (!cancelingOrderId) return;
        try {
            await orderApi.updateOrderStatus(cancelingOrderId, { status: 'CANCELLED', cancelReason: reason });
            toast.success('Hủy đơn hàng thành công');
            setOrderList(prev => prev.map(order => 
                order.id === cancelingOrderId ? { ...order, status: 'CANCELLED' as OrderStatus } : order
            ));
        } catch (error) {
            toast.error('Lỗi khi hủy đơn hàng');
        } finally {
            setCancelingOrderId(null);
        }
    };

    if (!user) {
        return <div style={{ padding: '4rem 0', textAlign: 'center' }}>Vui lòng đăng nhập để xem đơn hàng.</div>;
    }

    if (loading) {
        return <div style={{ padding: '4rem', textAlign: 'center' }}>Đang tải lịch sử đơn hàng...</div>;
    }

    if (orderList.length === 0) {
        return (
            <div style={{ padding: '4rem', textAlign: 'center', minHeight: '60vh' }}>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', color: 'var(--color-gold)' }}>Lịch sử đơn hàng</h1>
                <p style={{ marginTop: '2rem', color: 'var(--color-gray-500)' }}>Bạn chưa có đơn hàng nào.</p>
            </div>
        );
    }

    const filteredOrders = orderList.filter(order => {
        if (activeTab !== 'ALL' && order.status !== activeTab) {
            return false;
        }
        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            const matchCode = order.orderCode.toLowerCase().includes(query);
            const matchProduct = order.items.some(item => item.productName.toLowerCase().includes(query));
            if (!matchCode && !matchProduct) {
                return false;
            }
        }
        return true;
    });

    const ITEMS_PER_PAGE = 5;
    const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
    const paginatedOrders = filteredOrders.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const TABS = [
        { value: 'ALL', label: 'Tất cả' },
        { value: 'PENDING', label: 'Chờ xác nhận' },
        { value: 'CONFIRMED', label: 'Đã xác nhận' },
        { value: 'PROCESSING', label: 'Đang xử lý' },
        { value: 'SHIPPING', label: 'Đang giao' },
        { value: 'DELIVERED', label: 'Đã giao' },
        { value: 'CANCELLED', label: 'Đã hủy' },
    ];

    return (
        <div style={{ padding: '4rem 2rem', maxWidth: '1000px', margin: '0 auto', minHeight: '60vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', color: 'var(--color-gold)', margin: 0 }}>Lịch sử đơn hàng</h1>
                <div style={{ position: 'relative', width: '100%', maxWidth: '350px' }}>
                    <input 
                        type="text" 
                        placeholder="Tìm mã đơn, tên sản phẩm..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                        }}
                        style={{ width: '100%', padding: '10px 15px 10px 40px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.95rem', outline: 'none' }}
                    />
                    <Search size={18} color="#9ca3af" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '1rem', marginBottom: '1rem', scrollbarWidth: 'none' }}>
                {TABS.map(tab => (
                    <button
                        key={tab.value}
                        onClick={() => {
                            setActiveTab(tab.value);
                            setCurrentPage(1);
                        }}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '20px',
                            border: '1px solid',
                            borderColor: activeTab === tab.value ? 'var(--color-gold)' : '#e5e7eb',
                            background: activeTab === tab.value ? 'var(--color-gold)' : '#fff',
                            color: activeTab === tab.value ? '#fff' : '#4b5563',
                            fontWeight: 500,
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.2s'
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            
            {filteredOrders.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', background: '#f9fafb', borderRadius: '12px', border: '1px dashed #e5e7eb' }}>
                    <p style={{ color: 'var(--color-gray-500)', margin: 0 }}>Không tìm thấy đơn hàng nào phù hợp.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {paginatedOrders.map(order => {
                    const statusConfig = getStatusConfig(order.status);
                    return (
                        <div key={order.id} style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0', paddingBottom: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Đơn hàng <span style={{ color: 'var(--color-gold)' }}>#{order.orderCode}</span></h3>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--color-gray-500)' }}>Đặt lúc: {formatDate(order.orderDate)}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    {order.status === 'PENDING' && (
                                        <button
                                            onClick={() => setCancelingOrderId(order.id)}
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

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {(() => {
                                    const isExpanded = expandedOrderIds.includes(order.id);
                                    const itemsToShow = isExpanded ? order.items : order.items?.slice(0, 2);
                                    
                                    return (
                                        <>
                                            {itemsToShow?.map(item => (
                                                <div key={item.id} style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                                    {item.imageUrl ? (
                                                        <img src={item.imageUrl} alt={item.productName} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px' }} />
                                                    ) : (
                                                        <div style={{ width: '60px', height: '60px', background: '#ddd', borderRadius: '6px' }}></div>
                                                    )}
                                                    <div style={{ flex: 1 }}>
                                                        <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{item.productName}</h4>
                                                        {item.variantName && <p style={{ margin: '2px 0', fontSize: '0.8rem', color: 'var(--color-gray-500)' }}>Phân loại: {item.variantName}</p>}
                                                        <p style={{ margin: 0, fontSize: '0.85rem' }}>x{item.quantity}</p>
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                                                        <div style={{ fontWeight: 500 }}>
                                                            {formatCurrency(item.totalPrice)}
                                                        </div>
                                                        {/* Merge nút Đánh giá từ HEAD */}
                                                        {order.status === 'DELIVERED' && (() => {
                                                            const review = customerReviews.find(r => r.orderItemId === item.id);
                                                            const isReviewed = !!review;
                                                            const isEdited = review?.isEdited === true;

                                                            if (isReviewed && isEdited) {
                                                                return (
                                                                    <button 
                                                                        style={{ padding: '6px 12px', borderRadius: '6px', background: 'var(--color-gray-300)', color: '#fff', border: 'none', cursor: 'not-allowed', fontSize: '0.85rem' }}
                                                                        disabled
                                                                    >
                                                                        Đã đánh giá
                                                                    </button>
                                                                );
                                                            }

                                                            return (
                                                                <button 
                                                                    style={{ padding: '6px 12px', borderRadius: '6px', background: isReviewed ? '#3b82f6' : 'var(--color-gold)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
                                                                    onClick={() => setReviewingItem({ 
                                                                        productId: (item as any).productId || (item as any).productVariantId || '', 
                                                                        orderItemId: item.id,
                                                                        customerId: customerId,
                                                                        existingReview: review
                                                                    })}
                                                                >
                                                                    {isReviewed ? 'Chỉnh sửa' : 'Đánh giá'}
                                                                </button>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>
                                            ))}
                                            
                                            {order.items && order.items.length > 2 && (
                                                <div style={{ textAlign: 'center', marginTop: '0.5rem', borderTop: '1px solid #f0f0f0', paddingTop: '1rem' }}>
                                                    <button
                                                        onClick={() => toggleExpandOrder(order.id)}
                                                        style={{
                                                            background: 'transparent',
                                                            border: 'none',
                                                            color: 'var(--color-gold)',
                                                            fontWeight: 600,
                                                            cursor: 'pointer',
                                                            fontSize: '0.9rem'
                                                        }}
                                                    >
                                                        {isExpanded ? 'Thu gọn ^' : `Xem thêm ${order.items.length - 2} sản phẩm v`}
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>

                            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px dashed #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--color-gray-500)' }}>
                                    <p style={{ margin: '0 0 4px 0' }}>Thanh toán: <strong>{order.paymentMethod}</strong> ({getPaymentStatusLabel(order.paymentStatus)})</p>
                                    <p style={{ margin: 0 }}>Giao đến: {order.recipientName} - {order.shippingAddress}</p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{ fontSize: '0.9rem', color: 'var(--color-gray-500)', marginRight: '10px' }}>Tổng tiền:</span>
                                        <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-gold)' }}>{formatCurrency(order.total)}</span>
                                    </div>
                                    <Link
                                        to={`/orders/${order.id}`}
                                        style={{ padding: '8px 14px', borderRadius: '6px', background: '#f3f4f6', color: '#374151', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}
                                    >
                                        Xem chi tiết
                                    </Link>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            )}

            {totalPages > 1 && (() => {
                const MAX_PAGES_SHOWN = 5;
                const startPage = Math.floor((currentPage - 1) / MAX_PAGES_SHOWN) * MAX_PAGES_SHOWN + 1;
                const endPage = Math.min(startPage + MAX_PAGES_SHOWN - 1, totalPages);
                const visiblePages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

                return (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}
                        >
                            Trước
                        </button>
                        {visiblePages.map(page => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                style={{ padding: '8px 14px', borderRadius: '8px', border: currentPage === page ? 'none' : '1px solid #e5e7eb', background: currentPage === page ? 'var(--color-gold)' : '#fff', color: currentPage === page ? '#fff' : '#374151', cursor: 'pointer', fontWeight: 600 }}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1 }}
                        >
                            Sau
                        </button>
                    </div>
                );
            })()}

            {/* Merge Modal Đánh Giá từ nhánh HEAD */}
            {reviewingItem && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{ width: '100%', maxWidth: 600 }}>
                        <ReviewForm 
                            productId={reviewingItem.productId} 
                            orderItemId={reviewingItem.orderItemId}
                            customerId={reviewingItem.customerId}
                            existingReview={reviewingItem.existingReview}
                            onCancel={() => setReviewingItem(null)}
                            onSuccess={() => {
                                toast.success(reviewingItem.existingReview ? 'Cập nhật đánh giá thành công!' : 'Cảm ơn bạn đã đánh giá!');
                                setReviewingItem(null);
                                // Refresh customer reviews
                                reviewApi.getReviewsByCustomerId(customerId).then(res => {
                                    const revData = ((res as unknown as { data?: ReviewResponse[] }).data ?? res) as ReviewResponse[];
                                    setCustomerReviews(Array.isArray(revData) ? revData : []);
                                }).catch(() => {});
                            }}
                        />
                    </div>
                </div>
            )}

            <CancelOrderModal 
                isOpen={!!cancelingOrderId} 
                onClose={() => setCancelingOrderId(null)} 
                onConfirm={confirmCancelOrder} 
            />
        </div>
    );
};

export default OrderHistory;
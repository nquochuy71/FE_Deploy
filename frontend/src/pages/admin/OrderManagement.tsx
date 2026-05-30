import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    CalendarDays,
    CheckCircle2,
    Clock3,
    Filter,
    Package,
    RefreshCw,
    Search,
    Truck,
    XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { orderApi } from '../../api/orderApi';
import type { OrderResponse, OrderStatus, UpdateOrderStatusRequest } from '../../types/order';

type OrderStatusFilter = 'ALL' | OrderStatus | 'PENDING_REFUND';

const isPendingRefund = (order: OrderResponse): boolean => {
    return (
        (order.status === 'CANCELLED' || order.status === 'DELIVERY_FAILED') &&
        order.paymentStatus === 'PAID' &&
        (order.paymentMethod === 'VNPAY' || order.paymentMethod === 'BANK_TRANSFER')
    );
};

const statusOptions: Array<{ value: OrderStatus; label: string }> = [
    { value: 'PENDING', label: 'Chờ xác nhận' },
    { value: 'CONFIRMED', label: 'Đã xác nhận' },
    { value: 'PROCESSING', label: 'Đang chuẩn bị hàng' },
    { value: 'SHIPPING', label: 'Đang giao hàng' },
    { value: 'DELIVERED', label: 'Đã giao' },
    { value: 'CANCELLED', label: 'Đã hủy' },
    { value: 'REFUNDED', label: 'Đã hoàn tiền' },
    { value: 'DELIVERY_FAILED', label: 'Giao thất bại' },
];

const filterOptions: Array<{ value: OrderStatusFilter; label: string }> = [
    { value: 'ALL', label: 'Tất cả trạng thái' },
    ...statusOptions,
    { value: 'PENDING_REFUND', label: 'Chờ hoàn tiền' },
];

const statusConfig: Record<OrderStatus, { label: string; className: string; icon: ReactNode }> = {
    PENDING: { label: 'Chờ xác nhận', className: 'bg-amber-100 text-amber-800 border-amber-200', icon: <Clock3 size={14} /> },
    CONFIRMED: { label: 'Đã xác nhận', className: 'bg-sky-100 text-sky-800 border-sky-200', icon: <CheckCircle2 size={14} /> },
    PROCESSING: { label: 'Đang chuẩn bị hàng', className: 'bg-violet-100 text-violet-800 border-violet-200', icon: <Package size={14} /> },
    SHIPPING: { label: 'Đang giao hàng', className: 'bg-cyan-100 text-cyan-800 border-cyan-200', icon: <Truck size={14} /> },
    DELIVERED: { label: 'Đã giao', className: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: <CheckCircle2 size={14} /> },
    CANCELLED: { label: 'Đã hủy', className: 'bg-rose-100 text-rose-800 border-rose-200', icon: <XCircle size={14} /> },
    REFUNDED: { label: 'Đã hoàn tiền', className: 'bg-slate-100 text-slate-700 border-slate-200', icon: <RefreshCw size={14} /> },
    DELIVERY_FAILED: { label: 'Giao thất bại', className: 'bg-orange-100 text-orange-800 border-orange-200', icon: <XCircle size={14} /> },
};

const pendingRefundConfig = { label: 'Chờ hoàn tiền', className: 'bg-purple-100 text-purple-800 border-purple-200', icon: <RefreshCw size={14} /> };

const allowedStatusTransitions: Record<OrderStatus, OrderStatus[]> = {
    PENDING: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['PROCESSING', 'CANCELLED'],
    PROCESSING: ['SHIPPING', 'CANCELLED'],
    SHIPPING: ['DELIVERED', 'DELIVERY_FAILED'],
    DELIVERED: [],
    CANCELLED: [],
    REFUNDED: [],
    DELIVERY_FAILED: [],
};

const paymentMethodLabels: Record<string, string> = {
    COD: 'Thanh toán khi nhận hàng',
    VNPAY: 'VNPay',
    BANK_TRANSFER: 'Chuyển khoản ngân hàng',
};

const paymentStatusLabels: Record<string, string> = {
    PENDING: 'Chưa thanh toán',
    PAID: 'Đã thanh toán',
    FAILED: 'Thanh toán thất bại',
    REFUNDED: 'Đã hoàn tiền',
};

const formatCurrency = (value?: number | null) => {
    if (value === null || value === undefined) {
        return '--';
    }

    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(value);
};

const formatDateTime = (value?: string) => {
    if (!value) {
        return '--';
    }

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(parsedDate);
};

const isWithinDateRange = (value: string, fromDate: string, toDate: string) => {
    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
        return false;
    }

    if (fromDate) {
        const from = new Date(`${fromDate}T00:00:00`);
        if (parsedDate < from) {
            return false;
        }
    }

    if (toDate) {
        const to = new Date(`${toDate}T23:59:59.999`);
        if (parsedDate > to) {
            return false;
        }
    }

    return true;
};

const getStatusBadge = (status: OrderStatus) => {
    const config = statusConfig[status] ?? statusConfig.PENDING;

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${config.className}`}>
            {config.icon}
            {config.label}
        </span>
    );
};

const getPendingRefundBadge = () => {
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${pendingRefundConfig.className}`}>
            {pendingRefundConfig.icon}
            {pendingRefundConfig.label}
        </span>
    );
};

const getErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof Error && error.message) {
        return error.message;
    }

    if (typeof error === 'object' && error && 'message' in error) {
        const message = (error as { message?: string }).message;
        if (message) {
            return message;
        }
    }

    return fallback;
};

export const OrderManagement = () => {
    const queryClient = useQueryClient();
    const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>('ALL');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [keyword, setKeyword] = useState('');

    const ordersQuery = useQuery({
        queryKey: ['admin', 'orders'],
        queryFn: async () => {
            const response = await orderApi.getAllOrders();
            return Array.isArray(response) ? response : [];
        },
        staleTime: 30 * 1000,
        retry: false,
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ orderId, payload }: { orderId: string; payload: UpdateOrderStatusRequest }) =>
            orderApi.updateOrderStatus(orderId, payload),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
            toast.success('Đã cập nhật trạng thái đơn hàng.');
        },
        onError: (error) => {
            toast.error(getErrorMessage(error, 'Không thể cập nhật trạng thái đơn hàng.'));
        },
    });

    const orders = ordersQuery.data ?? [];

    const filteredOrders = useMemo(() => {
        const normalizedKeyword = keyword.trim().toLowerCase();

        return [...orders]
            .filter((order) => {
                if (statusFilter === 'ALL') return true;
                if (statusFilter === 'PENDING_REFUND') return isPendingRefund(order);
                return order.status === statusFilter;
            })
            .filter((order) => {
                if (!normalizedKeyword) {
                    return true;
                }

                return [order.orderCode, order.recipientName, order.email, order.phone].some((value) =>
                    value?.toLowerCase().includes(normalizedKeyword)
                );
            })
            .filter((order) => (fromDate || toDate ? isWithinDateRange(order.orderDate, fromDate, toDate) : true))
            .sort((left, right) => new Date(right.orderDate).getTime() - new Date(left.orderDate).getTime());
    }, [orders, statusFilter, fromDate, toDate, keyword]);

    const filteredStats = useMemo(() => {
        return {
            total: filteredOrders.length,
            pending: filteredOrders.filter((order) => order.status === 'PENDING').length,
            confirmed: filteredOrders.filter((order) => order.status === 'CONFIRMED').length,
            processing: filteredOrders.filter((order) => order.status === 'PROCESSING').length,
            shipping: filteredOrders.filter((order) => order.status === 'SHIPPING').length,
            pendingRefund: filteredOrders.filter((order) => isPendingRefund(order)).length,
        };
    }, [filteredOrders]);

    const clearFilters = () => {
        setStatusFilter('ALL');
        setFromDate('');
        setToDate('');
        setKeyword('');
    };

    const handleUpdateStatus = async (orderId: string, payload: UpdateOrderStatusRequest) => {
        return updateStatusMutation.mutateAsync({ orderId, payload });
    };

    return (
        <div className="grid gap-6">
            <section className="grid gap-4 md:grid-cols-5">
                {[
                    { label: 'Chờ xác nhận', value: filteredStats.pending, tone: 'from-amber-500 to-amber-600' },
                    { label: 'Đã xác nhận', value: filteredStats.confirmed, tone: 'from-sky-500 to-sky-600' },
                    { label: 'Đang chuẩn bị hàng', value: filteredStats.processing, tone: 'from-violet-500 to-violet-600' },
                    { label: 'Đang giao', value: filteredStats.shipping, tone: 'from-cyan-500 to-cyan-600' },
                    { label: 'Chờ hoàn tiền', value: filteredStats.pendingRefund, tone: 'from-purple-500 to-purple-600' },
                ].map((card) => (
                    <div key={card.label} className={`rounded-2xl bg-gradient-to-br ${card.tone} p-4 text-white shadow-lg`}>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/80">{card.label}</p>
                        <p className="mt-2 text-3xl font-black">{card.value}</p>
                    </div>
                ))}
            </section>

            <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-sm font-semibold text-slate-500">Bộ lọc</p>
                        <h2 className="mt-1 text-xl font-bold text-slate-900">Lọc theo trạng thái và thời gian</h2>
                    </div>

                    <button
                        type="button"
                        onClick={clearFilters}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                    >
                        <RefreshCw size={16} />
                        Xóa bộ lọc
                    </button>
                </div>

                <div className="grid gap-3 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)]">
                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-600">
                        <Search size={18} />
                        <input
                            value={keyword}
                            onChange={(event) => setKeyword(event.target.value)}
                            type="text"
                            placeholder="Tìm theo mã đơn, tên khách, email, số điện thoại"
                            className="w-full border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                        />
                    </label>

                    <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-600">
                        <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <Filter size={16} />
                            Trạng thái
                        </span>
                        <select
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value as OrderStatusFilter)}
                            className="min-w-0 border-none bg-transparent text-right text-sm font-semibold text-slate-900 outline-none"
                        >
                            {filterOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-600">
                            <CalendarDays size={18} />
                            <input
                                value={fromDate}
                                onChange={(event) => setFromDate(event.target.value)}
                                type="date"
                                className="w-full border-none bg-transparent text-sm font-semibold text-slate-900 outline-none"
                            />
                        </label>
                        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-600">
                            <CalendarDays size={18} />
                            <input
                                value={toDate}
                                onChange={(event) => setToDate(event.target.value)}
                                type="date"
                                className="w-full border-none bg-transparent text-sm font-semibold text-slate-900 outline-none"
                            />
                        </label>
                    </div>
                </div>
            </section>

            {ordersQuery.isLoading ? (
                <section className="grid gap-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="h-4 w-1/4 rounded-full bg-slate-200 animate-pulse" />
                            <div className="mt-4 h-24 rounded-2xl bg-slate-100 animate-pulse" />
                            <div className="mt-4 h-10 rounded-2xl bg-slate-100 animate-pulse" />
                        </div>
                    ))}
                </section>
            ) : ordersQuery.isError ? (
                <section className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-900">
                    <h3 className="text-lg font-bold">Không thể tải danh sách đơn hàng</h3>
                    <p className="mt-2 text-sm">{getErrorMessage(ordersQuery.error, 'Vui lòng thử tải lại dữ liệu đơn hàng.')}</p>
                </section>
            ) : filteredOrders.length === 0 ? (
                <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
                    <p className="text-lg font-bold text-slate-900">Không có đơn hàng phù hợp bộ lọc</p>
                    <p className="mt-2 text-sm text-slate-500">Thử nới bộ lọc trạng thái hoặc khoảng thời gian để xem dữ liệu.</p>
                </section>
            ) : (
                <section className="grid gap-4">
                    {filteredOrders.map((order) => (
                        <OrderCard
                            key={order.id}
                            order={order}
                            onUpdate={handleUpdateStatus}
                        />
                    ))}
                </section>
            )}
        </div>
    );
};

function OrderCard({
    order,
    onUpdate,
}: {
    order: OrderResponse;
    onUpdate: (orderId: string, payload: UpdateOrderStatusRequest) => Promise<unknown>;
}) {
    const [nextStatus, setNextStatus] = useState<OrderStatus | ''>('');
    const [cancelReason, setCancelReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setNextStatus('');
        setCancelReason('');
        setIsSubmitting(false);
    }, [order.status, order.id]);

    const pendingRefundOrder = isPendingRefund(order);
    const statusBadge = pendingRefundOrder ? pendingRefundConfig : (statusConfig[order.status] ?? statusConfig.PENDING);
    const itemCount = order.items?.length ?? 0;
    const isCancelLikeStatus = nextStatus === 'CANCELLED' || nextStatus === 'DELIVERY_FAILED';
    const allowedNextStatuses: OrderStatus[] = pendingRefundOrder
        ? ['REFUNDED']
        : (allowedStatusTransitions[order.status] ?? []);
    const isTransitionAllowed = nextStatus !== '' && allowedNextStatuses.includes(nextStatus as OrderStatus);

    const handleSubmit = async () => {
        if (!isTransitionAllowed) {
            toast.error('Chỉ được cập nhật theo đúng trình tự trạng thái.');
            return;
        }

        setIsSubmitting(true);
        try {
            await onUpdate(order.id, {
                status: nextStatus as OrderStatus,
                cancelReason: isCancelLikeStatus ? cancelReason.trim() || undefined : undefined,
            });
        } catch (err) {
            toast.error(getErrorMessage(err, 'Không thể cập nhật trạng thái đơn hàng.'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <article className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-black text-slate-900">Đơn hàng #{order.orderCode}</h3>
                        {isPendingRefund(order) ? getPendingRefundBadge() : getStatusBadge(order.status)}
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                        Đặt lúc {formatDateTime(order.orderDate)} • Cập nhật {formatDateTime(order.updatedAt)}
                    </p>
                </div>

                <div className="grid gap-2 text-right">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Tổng tiền</p>
                    <p className="text-2xl font-black text-slate-900">{formatCurrency(order.total)}</p>
                </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                <div className="grid gap-3">
                    <div className="grid gap-2 rounded-2xl bg-slate-50 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-bold text-slate-900">Thông tin khách hàng</p>
                            <span className="text-xs font-semibold text-slate-500">{itemCount} sản phẩm</span>
                        </div>
                        <div className="grid gap-1 text-sm text-slate-600">
                            <p>
                                <span className="font-semibold text-slate-900">Người nhận:</span> {order.recipientName || '--'}
                            </p>
                            <p>
                                <span className="font-semibold text-slate-900">Email:</span> {order.email || '--'}
                            </p>
                            <p>
                                <span className="font-semibold text-slate-900">Số điện thoại:</span> {order.phone || '--'}
                            </p>
                            <p>
                                <span className="font-semibold text-slate-900">Địa chỉ:</span> {order.shippingAddress || '--'}
                            </p>
                            {order.note ? (
                                <p>
                                    <span className="font-semibold text-slate-900">Ghi chú khách:</span> {order.note}
                                </p>
                            ) : null}
                        </div>
                    </div>

                    <div className="grid gap-3 rounded-2xl border border-slate-200 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-bold text-slate-900">Sản phẩm trong đơn</p>
                            <span className="text-xs font-semibold text-slate-500">
                                {paymentMethodLabels[order.paymentMethod] ?? order.paymentMethod} •{' '}
                                {paymentStatusLabels[order.paymentStatus] ?? order.paymentStatus}
                            </span>
                        </div>

                        <div className="grid gap-3">
                            {(order.items || []).slice(0, 3).map((item) => (
                                <div key={item.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                                    <div className="h-14 w-14 overflow-hidden rounded-xl bg-slate-200">
                                        {item.imageUrl ? <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-cover" /> : null}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-bold text-slate-900">{item.productName || '--'}</p>
                                        <p className="text-xs text-slate-500">
                                            {item.variantName || 'Không có phân loại'} • x{item.quantity}
                                        </p>
                                    </div>
                                    <div className="text-sm font-bold text-slate-900">{formatCurrency(item.totalPrice)}</div>
                                </div>
                            ))}

                            {itemCount > 3 ? <p className="text-xs font-semibold text-slate-500">+{itemCount - 3} sản phẩm khác</p> : null}
                        </div>
                    </div>
                </div>

                <div className="grid content-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div>
                        <p className="text-sm font-bold text-slate-900">Cập nhật trạng thái</p>
                    </div>

                    <label className="grid gap-2">
                        <select
                            value={nextStatus}
                            onChange={(event) => setNextStatus(event.target.value as OrderStatus | '')}
                            disabled={allowedNextStatuses.length === 0}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100"
                        >
                            <option value="">Chọn trạng thái</option>
                            {allowedNextStatuses.map((status) => (
                                <option key={status} value={status}>
                                    {statusConfig[status]?.label ?? status}
                                </option>
                            ))}
                        </select>
                    </label>

                    {allowedNextStatuses.length === 0 ? (
                        <p className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                            Đơn hàng này đã ở trạng thái cuối, không thể chuyển tiếp nữa.
                        </p>
                    ) : null}

                    {isCancelLikeStatus ? (
                        <label className="grid gap-2">
                            <span className="text-sm font-bold text-slate-900">Lý do</span>
                            <textarea
                                value={cancelReason}
                                onChange={(event) => setCancelReason(event.target.value)}
                                rows={4}
                                placeholder="Nhập lý do hủy hoặc ghi chú khi giao thất bại"
                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
                            />
                        </label>
                    ) : null}

                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitting || nextStatus === '' || !isTransitionAllowed}
                            className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                            style={{ background: 'linear-gradient(135deg, #D4AF37, #B8860B)' }}
                        >
                            {isSubmitting ? 'Đang lưu...' : 'Cập nhật'}
                        </button>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-600">
                        <p className="font-semibold text-slate-900">Trạng thái hiện tại</p>
                        <div className="mt-2">{statusBadge.label}</div>
                        {(order.status === 'CANCELLED' || order.status === 'DELIVERY_FAILED') && order.cancelReason ? (
                            <div className="mt-2 text-xs text-rose-600">
                                <p className="font-semibold text-rose-800">Lý do</p>
                                <div className="mt-1">{order.cancelReason}</div>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </article>
    );
}

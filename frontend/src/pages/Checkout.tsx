import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { cartApi } from '../api/cartApi';
import { catalogApi } from '../api/catalogApi';
import { orderApi } from '../api/orderApi';
import { paymentApi } from '../api/paymentApi';
import { addressApi } from '../api/addressApi';
import { userApi } from '../api/userApi';
import { aiApi } from '../api/aiApi';
import { useGuestCartStore, type GuestCartItem } from '../store/guestCartStore';
import type { PaymentMethod, VoucherResponse, VoucherValidationResponse } from '../types/order';
import type { CartResponse } from '../types/cart';
import type { CatalogProductVariant } from '../types/catalog';
import type { Address } from '../types/address';
import { toast } from 'sonner';
import { CheckCircle2, TicketPercent, X } from 'lucide-react';

const SHIPPING_FEE = 30000;

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

const formatAddressLine = (address: Address) => {
    const parts = [
        address.streetAddress ?? address.street,
        address.ward,
        address.district,
        address.city,
    ].filter((part): part is string => Boolean(part && part.trim()));

    return parts.join(', ');
};

const getVoucherLabel = (voucher: VoucherResponse) => {
    if (voucher.type === 'PERCENT') {
        return `Giảm ${Math.round(voucher.discountValue)}%`;
    }
    if (voucher.type === 'FREE_SHIPPING') {
        return 'Freeship';
    }
    return `Giảm ${formatCurrency(voucher.discountValue)}`;
};

const getVoucherSummary = (voucher: VoucherResponse) => {
    const minOrder = voucher.minOrderAmount ? `Đơn từ ${formatCurrency(voucher.minOrderAmount)}` : 'Không giới hạn đơn tối thiểu';
    const maxDiscount = voucher.maxDiscountAmount && voucher.type === 'PERCENT'
        ? `, tối đa ${formatCurrency(voucher.maxDiscountAmount)}`
        : '';
    return `${minOrder}${maxDiscount}`;
};

const isVoucherActive = (voucher: VoucherResponse) => {
    const now = Date.now();
    const startTime = voucher.startDate ? new Date(voucher.startDate).getTime() : Number.NEGATIVE_INFINITY;
    const endTime = voucher.endDate ? new Date(voucher.endDate).getTime() : Number.POSITIVE_INFINITY;
    return voucher.status === 'ACTIVE' && voucher.quantity > 0 && now >= startTime && now <= endTime;
};

const VoucherCard = ({
    voucher,
    selected,
    disabled,
    onSelect,
}: {
    voucher: VoucherResponse;
    selected: boolean;
    disabled: boolean;
    onSelect: () => void;
}) => (
    <button
        type="button"
        onClick={onSelect}
        disabled={disabled}
        style={{
            width: '100%',
            border: `1px solid ${selected ? '#ee4d2d' : '#e5e7eb'}`,
            background: selected ? '#fff7ed' : '#fff',
            borderRadius: '8px',
            padding: 0,
            display: 'grid',
            gridTemplateColumns: '112px 1fr',
            overflow: 'hidden',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.55 : 1,
            textAlign: 'left',
        }}
    >
        <div
            style={{
                background: 'linear-gradient(135deg, #ee4d2d, #ff7a45)',
                color: '#fff',
                minHeight: '112px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px',
            }}
        >
            <TicketPercent size={28} />
            <strong style={{ fontSize: '1rem', lineHeight: 1.2, textAlign: 'center' }}>{getVoucherLabel(voucher)}</strong>
        </div>
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
                <div>
                    <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.98rem' }}>{voucher.name}</div>
                    <div style={{ color: '#6b7280', fontSize: '0.86rem', marginTop: '3px' }}>{voucher.code}</div>
                </div>
                {selected && <CheckCircle2 size={20} color="#ee4d2d" />}
            </div>
            <div style={{ color: '#4b5563', fontSize: '0.9rem' }}>{getVoucherSummary(voucher)}</div>
            <div style={{ color: '#9ca3af', fontSize: '0.82rem' }}>Còn {voucher.quantity} lượt</div>
        </div>
    </button>
);

export const Checkout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isAuthenticated } = useAuthStore();
    const clearGuestCart = useGuestCartStore((s) => s.clearCart);
    
    const isGuest: boolean = !isAuthenticated && !!location.state?.isGuest;
    const guestItems: GuestCartItem[] = location.state?.guestItems || [];
    const selectedItemIds: string[] = location.state?.selectedItemIds || [];
    
    const [customerId, setCustomerId] = useState<string | null>(null);
    const [cart, setCart] = useState<CartResponse | null>(null);
    const [variants, setVariants] = useState<Record<string, CatalogProductVariant>>({});
    const [loading, setLoading] = useState(!isGuest);
    const [submitting, setSubmitting] = useState(false);
    const [vouchers, setVouchers] = useState<VoucherResponse[]>([]);
    const [vouchersLoading, setVouchersLoading] = useState(false);
    const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
    const [selectedVoucher, setSelectedVoucher] = useState<VoucherResponse | null>(null);
    const [voucherDiscount, setVoucherDiscount] = useState(0);
    const [voucherMessage, setVoucherMessage] = useState('');

    // Form state
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    
    const [email, setEmail] = useState('');
    const [recipientName, setRecipientName] = useState('');
    const [phone, setPhone] = useState('');
    const [shippingAddress, setShippingAddress] = useState('');
    const [note, setNote] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');

    useEffect(() => {
        // Guest checkout path
        if (isGuest) {
            if (guestItems.length === 0) {
                toast.error('Vui lòng chọn sản phẩm để thanh toán');
                navigate('/cart');
            }
            return;
        }

        if (!isAuthenticated) {
            toast.error('Vui lòng đăng nhập để thanh toán');
            navigate('/login?redirect=/checkout');
            return;
        }

        if (selectedItemIds.length === 0) {
            toast.error('Vui lòng chọn sản phẩm để thanh toán');
            navigate('/cart');
            return;
        }

        const fetchInitialData = async () => {
            try {
                // 1. Get customerId
                const userRes = await userApi.getCustomerByAccountId(user!.accountId);
                const payload = userRes as unknown as { data?: { id?: string }, id?: string };
                const cId = payload.data?.id ?? payload.id;
                
                if (!cId) {
                    toast.error('Không tìm thấy thông tin khách hàng');
                    return;
                }
                setCustomerId(cId);

                // 2. Fetch addresses
                try {
                    const addressesRes = await addressApi.getAddressesByCustomerId(cId);
                    const addressList = ((addressesRes as unknown as { data?: Address[] }).data ?? addressesRes) as Address[];
                    if (addressList && addressList.length > 0) {
                        setAddresses(addressList);
                        const defaultAddr = addressList.find(a => a.isDefault);
                        if (defaultAddr && defaultAddr.id) {
                            setSelectedAddressId(defaultAddr.id);
                        } else if (addressList[0].id) {
                            setSelectedAddressId(addressList[0].id);
                        }
                    }
                } catch {
                    console.log('No addresses found');
                }

                // Fill from user profile if not filled by address
                if (!email && user?.email) setEmail(user.email);

                // 3. Fetch cart
                let cartData: CartResponse | null = null;
                try {
                    const cartRes = await cartApi.getCartByCustomerId(cId);
                    cartData = ((cartRes as unknown as { data?: CartResponse }).data ?? cartRes) as CartResponse;
                    if (cartData && cartData.items) {
                        cartData.items = cartData.items.filter(item => selectedItemIds.includes(item.id));
                    }
                    setCart(cartData);
                } catch (err: unknown) {
                    const axiosErr = err as { response?: { status?: number } };
                    if (axiosErr?.response?.status !== 404) {
                        throw err;
                    }
                }

                // 4. Fetch variants
                if (cartData && cartData.items && cartData.items.length > 0) {
                    const variantData: Record<string, CatalogProductVariant> = {};
                    for (const item of cartData.items) {
                        try {
                            const vRes = await catalogApi.getVariantById(item.productVariantId);
                            const vData = ((vRes as unknown as { data?: CatalogProductVariant }).data ?? vRes) as CatalogProductVariant;
                            variantData[item.productVariantId] = vData;
                        } catch {
                            console.error('Failed to fetch variant', item.productVariantId);
                        }
                    }
                    setVariants(variantData);
                }

                try {
                    setVouchersLoading(true);
                    const voucherRes = await orderApi.getVouchers();
                    const voucherList = ((voucherRes as unknown as { data?: VoucherResponse[] }).data ?? voucherRes) as VoucherResponse[];
                    setVouchers(voucherList.filter(isVoucherActive));
                } catch {
                    setVouchers([]);
                } finally {
                    setVouchersLoading(false);
                }
            } catch {
                toast.error('Lỗi tải thông tin thanh toán');
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, [isAuthenticated, user, navigate]);

    const calculateSubtotal = () => {
        if (isGuest) {
            return guestItems.reduce((total, item) => total + (item.unitPrice * item.quantity), 0);
        }
        if (!cart?.items) return 0;
        return cart.items.reduce((total, item) => total + (item.unitPrice * item.quantity), 0);
    };

    const resetVoucher = () => {
        setSelectedVoucher(null);
        setVoucherDiscount(0);
        setVoucherMessage('');
    };

    const handleVoucherSelect = async (voucher: VoucherResponse) => {
        if (!customerId) {
            toast.error('Vui lòng đăng nhập để áp dụng voucher');
            return;
        }

        try {
            const validationRes = await orderApi.validateVoucher(voucher.id, {
                customerId,
                orderAmount: calculateSubtotal(),
                shippingFee: SHIPPING_FEE,
            });
            const validation = ((validationRes as unknown as { data?: VoucherValidationResponse }).data ?? validationRes) as VoucherValidationResponse;

            if (!validation.valid) {
                toast.error(validation.message || 'Voucher không thể áp dụng');
                return;
            }

            setSelectedVoucher(voucher);
            setVoucherDiscount(validation.discountAmount || 0);
            setVoucherMessage(validation.message || 'Voucher đã được áp dụng');
            setIsVoucherModalOpen(false);
            toast.success('Đã áp dụng voucher');
        } catch (error) {
            const err = error as { message?: string; response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || err.message || 'Không thể áp dụng voucher');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isGuest) {
            // Guest checkout
            if (!recipientName) { toast.error('Vui lòng nhập tên người nhận'); return; }
            if (!phone) { toast.error('Vui lòng nhập số điện thoại'); return; }
            if (!email) { toast.error('Vui lòng nhập email'); return; }
            if (!shippingAddress) { toast.error('Vui lòng nhập địa chỉ giao hàng'); return; }

            setSubmitting(true);
            try {
                const orderRes = await orderApi.createGuestOrder({
                    recipientName,
                    email,
                    phone,
                    shippingAddress,
                    note,
                    items: guestItems.map(i => ({ productVariantId: i.productVariantId, quantity: i.quantity })),
                    shippingFee: SHIPPING_FEE,
                });

                const orderPayload = orderRes as unknown as { data?: { orderCode?: string }, orderCode?: string };
                const orderCode = orderPayload.data?.orderCode ?? orderPayload.orderCode;

                clearGuestCart();
                window.dispatchEvent(new CustomEvent('cart:updated'));
                toast.success('Đặt hàng thành công!');
                navigate('/order-lookup', { state: { orderCode, email } });
            } catch (error) {
                const err = error as { response?: { data?: { message?: string } } };
                toast.error(err.response?.data?.message || 'Lỗi khi đặt hàng');
            } finally {
                setSubmitting(false);
            }
            return;
        }

        // Authenticated customer checkout
        if (!customerId) return;
        
        const selectedAddress = addresses.find(a => a.id === selectedAddressId);
        
        if (!selectedAddress) {
            toast.error('Vui lòng chọn địa chỉ giao hàng');
            return;
        }
        if (!email) {
            toast.error('Vui lòng nhập email liên hệ');
            return;
        }

        if (!cart?.items || cart.items.length === 0) {
            toast.error('Giỏ hàng trống');
            return;
        }

        setSubmitting(true);
        try {
            const shippingAddressStr = formatAddressLine(selectedAddress);
            const selectedRecipientName = selectedAddress.recipientName?.trim();
            const selectedPhone = selectedAddress.phone?.trim();
            if (!selectedRecipientName || !selectedPhone) {
                toast.error('Địa chỉ giao hàng thiếu tên người nhận hoặc số điện thoại');
                setSubmitting(false);
                return;
            }

            const orderRes = await orderApi.createOrder({
                customerId,
                recipientName: selectedRecipientName,
                email,
                phone: selectedPhone,
                shippingAddress: shippingAddressStr,
                note,
                paymentMethod,
                selectedItemIds,
                voucherCode: selectedVoucher?.code,
                shippingFee: SHIPPING_FEE,
            });

            const orderPayload = orderRes as unknown as { data?: { id?: string }, id?: string };
            const orderId = orderPayload.data?.id ?? orderPayload.id;

            if (!orderId) {
                throw new Error('Không lấy được orderId sau khi tạo đơn');
            }

            try {
                for (const itemId of selectedItemIds) {
                    await cartApi.removeItem(customerId, itemId);
                }
            } catch (cartError) {
                console.error('Failed to remove items from cart:', cartError);
            }

            // Track purchase behavior
            try {
                if (cart?.items) {
                    const purchasedItems = cart.items.filter(item => selectedItemIds.includes(item.id));
                    const uniqueProductIds = new Set(
                        purchasedItems.map(item => variants[item.productVariantId]?.productId).filter(Boolean)
                    );
                    
                    for (const pid of uniqueProductIds) {
                        aiApi.trackBehavior({
                            productId: pid,
                            eventType: 'PURCHASE',
                            source: 'CART'
                        }).catch(e => console.error('Failed to track purchase', e));
                    }
                }
            } catch (trackError) {
                console.error('Failed to track purchase:', trackError);
            }

            window.dispatchEvent(new CustomEvent('cart:updated'));

            toast.success('Đặt hàng thành công!');
            if (paymentMethod === 'COD') {
                navigate('/orders');
            } else if (paymentMethod === 'VNPAY') {
                const paymentRes = await paymentApi.createPayment({ orderId });
                const paymentPayload = paymentRes as unknown as { paymentUrl?: string };
                if (!paymentPayload.paymentUrl) {
                    throw new Error('Không lấy được link thanh toán VNPAY');
                }
                window.location.href = paymentPayload.paymentUrl;
            } else {
                navigate('/payment');
            }
        } catch (error) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || 'Lỗi khi đặt hàng');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div style={{ padding: '4rem', textAlign: 'center' }}>Đang tải thông tin thanh toán...</div>;
    }

    if (!isGuest && (!cart?.items || cart.items.length === 0)) {
        return (
            <div style={{ padding: '4rem', textAlign: 'center' }}>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', color: 'var(--color-gold)' }}>Giỏ hàng trống</h1>
                <p style={{ marginTop: '1rem' }}>Vui lòng thêm sản phẩm vào giỏ hàng trước khi thanh toán.</p>
                <button className="btn btn--primary" style={{ marginTop: '1rem', padding: '10px 20px', background: 'var(--color-gold)', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }} onClick={() => navigate('/products')}>
                    Tiếp tục mua sắm
                </button>
            </div>
        );
    }

    const displayItems = isGuest
        ? guestItems.map(gi => ({ id: gi.productVariantId, productVariantId: gi.productVariantId, quantity: gi.quantity, unitPrice: gi.unitPrice, _guestName: gi.productName, _guestVariant: gi.variantName, _guestImage: gi.imageUrl }))
        : (cart?.items || []);
    const subtotal = calculateSubtotal();
    const payableTotal = Math.max(0, subtotal + SHIPPING_FEE - voucherDiscount);

    return (
        <div style={{ padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', color: 'var(--color-gold)', textAlign: 'center', marginBottom: '2rem' }}>Thanh toán</h1>
            
            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                {/* Left Column: Form */}
                <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--color-black)' }}>Thông tin giao hàng</h2>
                    
                    {isGuest ? (
                        /* Guest: Manual form input */
                        <>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Tên người nhận *</label>
                                <input type="text" value={recipientName} onChange={e => setRecipientName(e.target.value)} required style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }} />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Số điện thoại *</label>
                                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }} />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Email *</label>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }} />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Địa chỉ giao hàng *</label>
                                <input type="text" value={shippingAddress} onChange={e => setShippingAddress(e.target.value)} required placeholder="Số nhà, đường, phường, quận, thành phố" style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }} />
                            </div>
                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Ghi chú (Tùy chọn)</label>
                                <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', resize: 'vertical' }} />
                            </div>
                            <div style={{ padding: '1rem', background: 'rgba(201,169,110,0.1)', borderRadius: '8px', marginBottom: '1rem' }}>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-gray-600)' }}>🛒 Khách vãng lai chỉ hỗ trợ thanh toán khi nhận hàng (COD)</p>
                            </div>
                        </>
                    ) : (
                        /* Customer: Address picker */
                        <>
                    {/* Address Selection Box */}
                    <div style={{ padding: '1.5rem', borderRadius: '8px', border: '1px solid #e0e0e0', marginBottom: '1.5rem', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-black)', fontWeight: 600 }}>Địa chỉ</h3>
                            <button type="button" onClick={() => setIsAddressModalOpen(true)} style={{ color: '#007bff', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', fontWeight: 500 }}>Chọn địa chỉ</button>
                        </div>
                        
                        {addresses.length > 0 && selectedAddressId ? (() => {
                            const selectedAddress = addresses.find(a => a.id === selectedAddressId);
                            if (!selectedAddress) return null;
                            return (
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {selectedAddress.recipientName} 
                                        <span style={{ fontWeight: 400, color: '#666', borderLeft: '1px solid #ddd', paddingLeft: '8px' }}>{selectedAddress.phone}</span>
                                    </div>
                                    <div style={{ color: '#555', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{formatAddressLine(selectedAddress)}</div>
                                    {selectedAddress.isDefault && (
                                        <span style={{ border: '1px solid #ee4d2d', color: '#ee4d2d', padding: '2px 8px', fontSize: '0.75rem', borderRadius: '4px' }}>Mặc định</span>
                                    )}
                                </div>
                            );
                        })() : (
                            <div style={{ color: '#888', fontStyle: 'italic', padding: '1rem 0' }}>Chưa có địa chỉ giao hàng. Vui lòng chọn hoặc thêm địa chỉ mới.</div>
                        )}
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Email *</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }} />
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Ghi chú (Tùy chọn)</label>
                        <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', resize: 'vertical' }} />
                    </div>

                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--color-black)' }}>Phương thức thanh toán</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '15px', border: `1px solid ${paymentMethod === 'COD' ? 'var(--color-gold)' : '#ddd'}`, borderRadius: '8px', cursor: 'pointer', background: paymentMethod === 'COD' ? '#fff9f0' : '#fff' }}>
                            <input type="radio" name="paymentMethod" value="COD" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} style={{ accentColor: 'var(--color-gold)' }} />
                            <span>Thanh toán khi nhận hàng (COD)</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '15px', border: `1px solid ${paymentMethod === 'VNPAY' ? 'var(--color-gold)' : '#ddd'}`, borderRadius: '8px', cursor: 'pointer', background: paymentMethod === 'VNPAY' ? '#fff9f0' : '#fff' }}>
                            <input type="radio" name="paymentMethod" value="VNPAY" checked={paymentMethod === 'VNPAY'} onChange={() => setPaymentMethod('VNPAY')} style={{ accentColor: 'var(--color-gold)' }} />
                            <span>Thanh toán qua VNPAY</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '15px', border: `1px solid ${paymentMethod === 'BANK_TRANSFER' ? 'var(--color-gold)' : '#ddd'}`, borderRadius: '8px', cursor: 'pointer', background: paymentMethod === 'BANK_TRANSFER' ? '#fff9f0' : '#fff' }}>
                            <input type="radio" name="paymentMethod" value="BANK_TRANSFER" checked={paymentMethod === 'BANK_TRANSFER'} onChange={() => setPaymentMethod('BANK_TRANSFER')} style={{ accentColor: 'var(--color-gold)' }} />
                            <span>Chuyển khoản ngân hàng</span>
                        </label>
                    </div>
                        </>
                    )}
                </div>

                {/* Right Column: Order Summary */}
                <div style={{ background: '#f9f9f9', padding: '2rem', borderRadius: '12px', height: 'fit-content', position: 'sticky', top: '2rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--color-black)' }}>Đơn hàng của bạn</h2>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem', maxHeight: '40vh', overflowY: 'auto' }}>
                        {displayItems.map((item: { id: string; productVariantId: string; quantity: number; unitPrice: number; _guestVariant?: string; _guestName?: string; _guestImage?: string }) => {
                            const variant = variants[item.productVariantId];
                            const itemName = item._guestVariant || variant?.variantName || 'Sản phẩm';
                            const itemImage = item._guestImage || variant?.imageUrl;
                            return (
                                <div key={item.id} style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                    {itemImage ? (
                                        <img src={itemImage} alt={itemName} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} />
                                    ) : (
                                        <div style={{ width: '60px', height: '60px', background: '#ddd', borderRadius: '8px' }}></div>
                                    )}
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ fontSize: '0.9rem', margin: 0, color: 'var(--color-black)' }}>{itemName}</h4>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--color-gray-500)', margin: '4px 0' }}>SL: {item.quantity}</p>
                                    </div>
                                    <div style={{ fontWeight: 600 }}>
                                        {formatCurrency(item.unitPrice * item.quantity)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ borderTop: '1px solid #ddd', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <TicketPercent size={18} color="#ee4d2d" />
                                Voucher
                            </span>
                            {selectedVoucher ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                    <strong style={{ color: '#ee4d2d' }}>{selectedVoucher.code}</strong>
                                    <button
                                        type="button"
                                        onClick={resetVoucher}
                                        aria-label="Bỏ voucher"
                                        style={{ width: '24px', height: '24px', border: 'none', borderRadius: '50%', background: '#fee2e2', color: '#b91c1c', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                    >
                                        <X size={14} />
                                    </button>
                                </span>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setIsVoucherModalOpen(true)}
                                    disabled={isGuest || vouchersLoading}
                                    style={{ background: 'none', border: 'none', color: isGuest ? '#9ca3af' : '#ee4d2d', fontWeight: 600, cursor: isGuest ? 'not-allowed' : 'pointer' }}
                                >
                                    {isGuest ? 'Đăng nhập để dùng' : vouchersLoading ? 'Đang tải...' : 'Chọn voucher'}
                                </button>
                            )}
                        </div>
                        {selectedVoucher && voucherMessage && (
                            <div style={{ color: '#16a34a', fontSize: '0.86rem', marginTop: '-0.4rem' }}>{voucherMessage}</div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Tạm tính</span>
                            <strong>{formatCurrency(subtotal)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Phí giao hàng</span>
                            <strong>{formatCurrency(SHIPPING_FEE)}</strong>
                        </div>
                        {voucherDiscount > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
                                <span>Giảm giá</span>
                                <strong>-{formatCurrency(voucherDiscount)}</strong>
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', color: 'var(--color-gold)', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #ddd' }}>
                            <strong>Tổng cộng</strong>
                            <strong>{formatCurrency(payableTotal)}</strong>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={submitting}
                        style={{ 
                            width: '100%', padding: '15px', marginTop: '2rem', 
                            background: 'linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))', 
                            color: 'white', border: 'none', borderRadius: '8px', 
                            fontSize: '1.1rem', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer',
                            opacity: submitting ? 0.7 : 1
                        }}
                    >
                        {submitting ? 'Đang xử lý...' : 'Xác nhận đặt hàng'}
                    </button>
                    <button 
                        type="button"
                        onClick={() => navigate('/cart')}
                        style={{ 
                            width: '100%', padding: '15px', marginTop: '1rem', 
                            background: 'transparent', color: 'var(--color-gray-600)', 
                            border: '1px solid var(--color-gray-300)', borderRadius: '8px', 
                            fontSize: '1rem', fontWeight: 500, cursor: 'pointer'
                        }}
                    >
                        Quay lại giỏ hàng
                    </button>
                </div>
            </form>

            {/* Voucher Selection Modal */}
            {isVoucherModalOpen && !isGuest && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '760px', maxHeight: '82vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--color-black)' }}>Chọn voucher</h2>
                                <p style={{ margin: '6px 0 0', color: '#6b7280', fontSize: '0.92rem' }}>Tạm tính {formatCurrency(subtotal)}, phí ship {formatCurrency(SHIPPING_FEE)}</p>
                            </div>
                            <button type="button" onClick={() => setIsVoucherModalOpen(false)} aria-label="Đóng" style={{ width: '36px', height: '36px', background: '#f3f4f6', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {vouchersLoading ? (
                                <p style={{ color: '#666', textAlign: 'center', padding: '2rem 0' }}>Đang tải voucher...</p>
                            ) : vouchers.length === 0 ? (
                                <p style={{ color: '#666', textAlign: 'center', padding: '2rem 0' }}>Chưa có voucher khả dụng.</p>
                            ) : (
                                vouchers.map(voucher => {
                                    const disabled = subtotal < (voucher.minOrderAmount || 0);
                                    return (
                                        <VoucherCard
                                            key={voucher.id}
                                            voucher={voucher}
                                            selected={selectedVoucher?.id === voucher.id}
                                            disabled={disabled}
                                            onSelect={() => handleVoucherSelect(voucher)}
                                        />
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Address Selection Modal */}
            {isAddressModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '700px', maxHeight: '80vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--color-black)' }}>Địa chỉ của tôi</h2>
                            <button type="button" onClick={() => setIsAddressModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '2rem', cursor: 'pointer', lineHeight: 1, color: '#999' }}>&times;</button>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {addresses.length === 0 ? (
                                <p style={{ color: '#666', textAlign: 'center', padding: '2rem 0' }}>Bạn chưa lưu địa chỉ nào.</p>
                            ) : (
                                addresses.map(addr => (
                                    <div 
                                        key={addr.id} 
                                        onClick={() => {
                                            setSelectedAddressId(addr.id!);
                                            setIsAddressModalOpen(false);
                                        }}
                                        style={{ 
                                            padding: '1.5rem', 
                                            border: `1px solid ${selectedAddressId === addr.id ? '#007bff' : '#ddd'}`, 
                                            borderRadius: '8px', 
                                            cursor: 'pointer', 
                                            background: selectedAddressId === addr.id ? '#f0f8ff' : '#fff',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center' }}>
                                            <span style={{ color: 'var(--color-black)' }}>{addr.recipientName}</span>
                                            <span style={{ fontWeight: 400, color: '#666', marginLeft: '8px', borderLeft: '1px solid #ddd', paddingLeft: '8px' }}>{addr.phone}</span>
                                        </div>
                                        <div style={{ color: '#555', fontSize: '0.95rem', marginBottom: '0.5rem' }}>{formatAddressLine(addr)}</div>
                                        {addr.isDefault && (
                                            <span style={{ border: '1px solid #ee4d2d', color: '#ee4d2d', padding: '2px 8px', fontSize: '0.75rem', borderRadius: '4px' }}>Mặc định</span>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                        
                        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #ddd', display: 'flex' }}>
                            <button 
                                type="button" 
                                onClick={() => navigate('/profile')} 
                                style={{ 
                                    color: '#007bff', background: 'none', border: '1px solid #007bff', 
                                    cursor: 'pointer', fontSize: '1rem', fontWeight: 500, padding: '10px 20px', borderRadius: '4px',
                                    display: 'flex', alignItems: 'center', gap: '8px' 
                                }}
                            >
                                <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>+</span> Thêm địa chỉ mới
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

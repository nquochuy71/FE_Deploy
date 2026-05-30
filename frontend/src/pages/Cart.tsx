import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { catalogApi } from '../api/catalogApi';
import { cartApi } from '../api/cartApi';

import { useAuthStore, useIsCustomer } from '../store/authStore';
import { useCustomerId } from '../hooks/useCustomerId';
import { useGuestCartStore } from '../store/guestCartStore';
import type { CatalogProduct, CatalogProductVariant } from '../types/catalog';
import type { CartResponse } from '../types/cart';
import { ShoppingBag } from 'lucide-react';

type PendingRemoval = {
    mode: 'guest' | 'customer';
    itemId: string;
    productName: string;
} | null;

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



export const Cart = () => {
    const navigate = useNavigate();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const isCustomer = useIsCustomer();
    const { customerId, loading: customerLoading } = useCustomerId();
    const [cart, setCart] = useState<CartResponse | null>(null);
    const [variantMap, setVariantMap] = useState<Record<string, CatalogProductVariant>>({});
    const [productMap, setProductMap] = useState<Record<string, CatalogProduct>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
    const [pendingRemoval, setPendingRemoval] = useState<PendingRemoval>(null);

    // Guest cart
    const guestItems = useGuestCartStore((s) => s.items);
    const removeGuestItem = useGuestCartStore((s) => s.removeItem);
    const updateGuestQuantity = useGuestCartStore((s) => s.updateQuantity);

    const isGuest = !isAuthenticated;
    const showGuestCart = isGuest && guestItems.length > 0;

    const toggleItem = (id: string) => {
        setSelectedItemIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        if (isGuest) {
            if (selectedItemIds.size === guestItems.length) {
                setSelectedItemIds(new Set());
            } else {
                setSelectedItemIds(new Set(guestItems.map(i => i.productVariantId)));
            }
            return;
        }
        if (!cart?.items) return;
        if (selectedItemIds.size === cart.items.length) {
            setSelectedItemIds(new Set());
        } else {
            setSelectedItemIds(new Set(cart.items.map(i => i.id)));
        }
    };

    // Fetch cart for authenticated customer
    useEffect(() => {
        if (isGuest || !isCustomer) return;
        let isMounted = true;

        const fetchCart = async () => {
            if (!customerId) {
                setCart(null);
                return;
            }

            setLoading(true);
            try {
                const res = await cartApi.getCartByCustomerId(customerId);
                if (isMounted) {
                    setCart(res);
                }
            } catch (err: unknown) {
                if (isMounted) {
                    const axiosErr = err as { response?: { status?: number } };
                    if (axiosErr?.response?.status === 404) {
                        setCart(null);
                        setError(null);
                    } else {
                        const message = err instanceof Error ? err.message : 'Khong the tai gio hang';
                        setError(message);
                    }
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchCart();

        return () => {
            isMounted = false;
        };
    }, [customerId, isGuest, isCustomer]);

    // Fetch variant/product details for authenticated cart
    useEffect(() => {
        if (isGuest) return;
        let isMounted = true;

        const loadDetails = async () => {
            if (!cart?.items?.length) {
                setVariantMap({});
                return;
            }

            try {
                const variantResults = await Promise.all(
                    cart.items.map((item) => catalogApi.getVariantById(item.productVariantId))
                );
                if (!isMounted) {
                    return;
                }

                const variantLookup = variantResults.reduce<Record<string, CatalogProductVariant>>((acc, variant) => {
                    acc[variant.id] = variant;
                    return acc;
                }, {});

                setVariantMap(variantLookup);

                const productRes = await catalogApi.getProducts(0, 200);
                if (!isMounted) {
                    return;
                }
                const productLookup = (productRes.content ?? []).reduce<Record<string, CatalogProduct>>((acc, product) => {
                    acc[product.id] = product;
                    return acc;
                }, {});
                setProductMap(productLookup);
            } catch {
                if (isMounted) {
                    setVariantMap({});
                    setProductMap({});
                }
            }
        };

        loadDetails();

        return () => {
            isMounted = false;
        };
    }, [cart, isGuest]);

    const subtotal = useMemo(() => {
        if (isGuest) {
            return guestItems
                .filter(item => selectedItemIds.has(item.productVariantId))
                .reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
        }
        if (!cart?.items) {
            return 0;
        }
        return cart.items
            .filter(item => selectedItemIds.has(item.id))
            .reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0);
    }, [cart, selectedItemIds, isGuest, guestItems]);

    const unselectItem = (itemId: string) => {
        setSelectedItemIds(prev => {
            if (!prev.has(itemId)) {
                return prev;
            }

            const next = new Set(prev);
            next.delete(itemId);
            return next;
        });
    };

    const handleGuestRemove = (itemId: string) => {
        removeGuestItem(itemId);
        unselectItem(itemId);
    };

    const handleGuestDecrease = (itemId: string, quantity: number, productName: string) => {
        if (quantity <= 1) {
            setPendingRemoval({ mode: 'guest', itemId, productName });
            return;
        }

        updateGuestQuantity(itemId, quantity - 1);
    };

    const handleCustomerDecrease = (itemId: string, quantity: number, productName: string) => {
        if (quantity <= 1) {
            setPendingRemoval({ mode: 'customer', itemId, productName });
            return;
        }

        void handleUpdateQty(itemId, quantity - 1);
    };

    const handleUpdateQty = async (itemId: string, quantity: number) => {
        if (!customerId) {
            return;
        }
        try {
            const res = await cartApi.updateItemQuantity(customerId, itemId, { quantity });
            setCart(res);
            window.dispatchEvent(new CustomEvent('cart:updated'));
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Cap nhat gio hang that bai';
            toast.error(message);
        }
    };

    const handleRemove = async (itemId: string) => {
        if (!customerId) {
            return;
        }
        try {
            const res = await cartApi.removeItem(customerId, itemId);
            setCart(res);
            unselectItem(itemId);
            window.dispatchEvent(new CustomEvent('cart:updated'));
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Xoa san pham that bai';
            toast.error(message);
        }
    };

    const confirmPendingRemoval = async () => {
        if (!pendingRemoval) {
            return;
        }

        if (pendingRemoval.mode === 'guest') {
            handleGuestRemove(pendingRemoval.itemId);
            setPendingRemoval(null);
            return;
        }

        await handleRemove(pendingRemoval.itemId);
        setPendingRemoval(null);
    };

    const handleCheckout = () => {
        if (isGuest) {
            const selectedGuest = guestItems.filter(i => selectedItemIds.has(i.productVariantId));
            if (selectedGuest.length > 0) {
                navigate('/checkout', { state: { isGuest: true, guestItems: selectedGuest } });
            }
        } else {
            if (selectedItemIds.size > 0) {
                navigate('/checkout', { state: { selectedItemIds: Array.from(selectedItemIds) } });
            }
        }
    };

    // --- Guest Cart Rendering ---
    const renderGuestCart = () => (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
            <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 16px 40px rgba(17,24,39,0.08)' }}>
                <div style={{ paddingBottom: '1rem', borderBottom: '1px solid rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                        type="checkbox"
                        checked={guestItems.length > 0 && selectedItemIds.size === guestItems.length}
                        onChange={toggleAll}
                        style={{ width: '20px', height: '20px', accentColor: 'var(--color-gold)', cursor: 'pointer' }}
                    />
                    <span style={{ fontWeight: 500, color: 'var(--color-black)' }}>Chọn tất cả ({guestItems.length} sản phẩm)</span>
                </div>
                {guestItems.map((item) => (
                    <div key={item.productVariantId} style={{ display: 'flex', gap: '1rem', padding: '1rem 0', borderBottom: '1px solid rgba(0,0,0,0.05)', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
                            <input
                                type="checkbox"
                                checked={selectedItemIds.has(item.productVariantId)}
                                onChange={() => toggleItem(item.productVariantId)}
                                style={{ width: '20px', height: '20px', accentColor: 'var(--color-gold)', cursor: 'pointer', marginTop: '0.5rem', flexShrink: 0 }}
                            />
                            <div style={{ width: '72px', height: '72px', borderRadius: '12px', background: 'var(--color-cream)', overflow: 'hidden', flexShrink: 0 }}>
                                {item.imageUrl ? (
                                    <img src={item.imageUrl} alt={item.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-gray-400)', fontSize: '0.75rem' }}>
                                        Không có ảnh
                                    </div>
                                )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ margin: 0, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.productName}</p>
                                <p style={{ margin: '0.35rem 0', color: 'var(--color-gray-500)', fontSize: '0.875rem' }}>{item.variantName}</p>
                                <p style={{ margin: '0.25rem 0', color: 'var(--color-gray-500)' }}>{formatCurrency(item.unitPrice)}</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <button
                                    onClick={() => handleGuestDecrease(item.productVariantId, item.quantity, item.productName)}
                                    style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--color-gray-300)', cursor: 'pointer', background: 'none' }}
                                >
                                    -
                                </button>
                                <span style={{ minWidth: '24px', textAlign: 'center' }}>{item.quantity}</span>
                                <button
                                    onClick={() => updateGuestQuantity(item.productVariantId, item.quantity + 1)}
                                    style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--color-gray-300)', cursor: 'pointer', background: 'none' }}
                                >
                                    +
                                </button>
                            </div>
                            <button
                                onClick={() => handleGuestRemove(item.productVariantId)}
                                style={{ border: 'none', background: 'none', color: 'var(--color-error)', cursor: 'pointer', padding: '0 0.5rem', minWidth: '40px', textAlign: 'center' }}
                            >
                                Xóa
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', height: 'fit-content', boxShadow: '0 16px 40px rgba(17,24,39,0.08)' }}>
                <h3 style={{ marginBottom: '1rem' }}>Tổng tạm tính</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>Subtotal</span>
                    <strong>{formatCurrency(subtotal)}</strong>
                </div>
                <div style={{ padding: '0.75rem', background: 'rgba(201,169,110,0.1)', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--color-gray-600)' }}>
                    Khách vãng lai chỉ hỗ trợ thanh toán COD
                </div>
                <button
                    className="btn btn--primary"
                    style={{ width: '100%', padding: '12px 16px', background: 'linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))', border: 'none', borderRadius: '8px', color: 'white', cursor: selectedItemIds.size > 0 ? 'pointer' : 'not-allowed', opacity: selectedItemIds.size > 0 ? 1 : 0.6 }}
                    onClick={handleCheckout}
                    disabled={selectedItemIds.size === 0}
                >
                    Tiến hành thanh toán ({selectedItemIds.size})
                </button>
                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                    <Link to="/login" style={{ color: 'var(--color-gold)', fontSize: '0.85rem' }}>Đăng nhập để có thêm ưu đãi</Link>
                </div>
            </div>
        </div>
    );

    return (
        <div style={{ padding: '3.5rem 6vw' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', color: 'var(--color-gold)', marginBottom: '0.5rem', textAlign: 'center' }}>Giỏ hàng</h1>

            {/* Guest with items */}
            {showGuestCart && renderGuestCart()}

            {/* Guest with empty cart */}
            {isGuest && guestItems.length === 0 && (
                <div style={{
                    padding: '4rem 2rem',
                    borderRadius: '16px',
                    background: '#fff',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 16px 40px rgba(17,24,39,0.04)'
                }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--color-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--color-gold)' }}>
                        <ShoppingBag size={40} />
                    </div>
                    <h2 style={{ fontFamily: 'serif', fontSize: '1.5rem', color: 'var(--color-black)', marginBottom: '0.5rem' }}>Chưa có sản phẩm trong giỏ hàng</h2>
                    <button className="btn btn--primary" style={{ padding: '12px 32px', background: 'var(--color-black)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: 500, display: 'inline-flex' }} onClick={() => navigate('/products')}>
                        Khám phá sản phẩm
                    </button>
                </div>
            )}

            {/* Authenticated non-customer (admin/employee) */}
            {isAuthenticated && !isCustomer && (
                <div style={{ padding: '2rem', borderRadius: '12px', background: 'rgba(201,169,110,0.1)' }}>
                    <p>Tài khoản của bạn không hỗ trợ giỏ hàng.</p>
                </div>
            )}

            {/* Authenticated customer loading */}
            {isAuthenticated && isCustomer && (customerLoading || loading) && <p>Đang tải giỏ hàng...</p>}
            {isAuthenticated && isCustomer && error && <p style={{ color: 'var(--color-error)' }}>{error}</p>}

            {/* Authenticated customer empty cart */}
            {isAuthenticated && isCustomer && !loading && (!cart || cart?.items?.length === 0) && (
                <div style={{
                    padding: '4rem 2rem',
                    borderRadius: '16px',
                    background: '#fff',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 16px 40px rgba(17,24,39,0.04)'
                }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--color-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--color-gold)' }}>
                        <ShoppingBag size={40} />
                    </div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--color-black)', marginBottom: '0.5rem' }}>Chưa có sản phẩm trong giỏ hàng</h2>
                    <button className="btn btn--primary" style={{ padding: '12px 32px', background: 'var(--color-black)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: 500, display: 'inline-flex' }} onClick={() => navigate('/products')}>
                        Khám phá sản phẩm
                    </button>
                </div>
            )}

            {/* Authenticated customer cart with items */}
            {isAuthenticated && isCustomer && cart?.items?.length ? (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                    <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 16px 40px rgba(17,24,39,0.08)' }}>
                        <div style={{ paddingBottom: '1rem', borderBottom: '1px solid rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input
                                type="checkbox"
                                checked={cart.items.length > 0 && selectedItemIds.size === cart.items.length}
                                onChange={toggleAll}
                                style={{ width: '20px', height: '20px', accentColor: 'var(--color-gold)', cursor: 'pointer' }}
                            />
                            <span style={{ fontWeight: 500, color: 'var(--color-black)' }}>Chọn tất cả ({cart.items.length} sản phẩm)</span>
                        </div>
                        {cart.items.map((item) => {
                            const variant = variantMap[item.productVariantId];
                            const productName = variant ? productMap[variant.productId]?.name : undefined;
                            const imageUrl = variant?.imageUrl;
                            const variantName = variant?.variantName || 'N/A';

                            return (
                                <div key={item.id} style={{ display: 'flex', gap: '1rem', padding: '1rem 0', borderBottom: '1px solid rgba(0,0,0,0.05)', alignItems: 'flex-start' }}>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedItemIds.has(item.id)}
                                            onChange={() => toggleItem(item.id)}
                                            style={{ width: '20px', height: '20px', accentColor: 'var(--color-gold)', cursor: 'pointer', marginTop: '0.5rem', flexShrink: 0 }}
                                        />
                                        <div style={{ width: '72px', height: '72px', borderRadius: '12px', background: 'var(--color-cream)', overflow: 'hidden', flexShrink: 0 }}>
                                            {imageUrl ? (
                                                <img src={imageUrl} alt={productName ?? 'Product'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-gray-400)', fontSize: '0.75rem' }}>
                                                    Không có ảnh
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ margin: 0, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{productName ?? 'Sản phẩm'}</p>
                                            <p style={{ margin: '0.35rem 0', color: 'var(--color-gray-500)', fontSize: '0.875rem' }}>{variantName}</p>
                                            <p style={{ margin: '0.25rem 0', color: 'var(--color-gray-500)' }}>{formatCurrency(Number(item.unitPrice))}</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <button
                                                onClick={() => handleCustomerDecrease(item.id, item.quantity, productName ?? 'San pham')}
                                                style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--color-gray-300)', cursor: 'pointer', background: 'none' }}
                                            >
                                                -
                                            </button>
                                            <span style={{ minWidth: '24px', textAlign: 'center' }}>{item.quantity}</span>
                                            <button
                                                onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                                                style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--color-gray-300)', cursor: 'pointer', background: 'none' }}
                                            >
                                                +
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => handleRemove(item.id)}
                                            style={{ border: 'none', background: 'none', color: 'var(--color-error)', cursor: 'pointer', padding: '0 0.5rem', minWidth: '40px', textAlign: 'center' }}
                                        >
                                            Xóa
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', height: 'fit-content', boxShadow: '0 16px 40px rgba(17,24,39,0.08)' }}>
                        <h3 style={{ marginBottom: '1rem' }}>Tổng tạm tính</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <span>Subtotal</span>
                            <strong>{formatCurrency(subtotal)}</strong>
                        </div>
                        <button
                            className="btn btn--primary"
                            style={{ width: '100%', padding: '12px 16px', background: 'linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))', border: 'none', borderRadius: '8px', color: 'white', cursor: selectedItemIds.size > 0 ? 'pointer' : 'not-allowed', opacity: selectedItemIds.size > 0 ? 1 : 0.6 }}
                            onClick={handleCheckout}
                            disabled={selectedItemIds.size === 0}
                        >
                            Tiến hành thanh toán ({selectedItemIds.size})
                        </button>
                    </div>
                </div>
            ) : null}
            {pendingRemoval && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="remove-cart-item-title"
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 1000,
                        background: 'rgba(17, 24, 39, 0.42)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1rem',
                    }}
                    onClick={() => setPendingRemoval(null)}
                >
                    <div
                        style={{
                            width: '100%',
                            maxWidth: '420px',
                            background: '#fff',
                            borderRadius: '12px',
                            padding: '1.5rem',
                            boxShadow: '0 24px 70px rgba(17,24,39,0.22)',
                        }}
                        onClick={(event) => event.stopPropagation()}
                    >
                        <h2 id="remove-cart-item-title" style={{ margin: 0, fontSize: '1.2rem', color: 'var(--color-black)' }}>
                            Xác nhận xóa
                        </h2>
                        <p style={{ margin: '0.75rem 0 1.5rem', color: 'var(--color-gray-600)', lineHeight: 1.6 }}>
                            Bạn có muốn xóa <strong>{pendingRemoval.productName}</strong> khỏi giỏ hàng không?
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <button
                                type="button"
                                onClick={() => setPendingRemoval(null)}
                                style={{
                                    padding: '10px 16px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--color-gray-300)',
                                    background: '#fff',
                                    color: 'var(--color-black)',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                }}
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                onClick={() => void confirmPendingRemoval()}
                                style={{
                                    padding: '10px 16px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: 'var(--color-error)',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                }}
                            >
                                Vẫn xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

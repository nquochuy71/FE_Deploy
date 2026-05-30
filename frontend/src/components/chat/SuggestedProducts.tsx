import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cartApi } from '../../api/cartApi';
import { catalogApi } from '../../api/catalogApi';
import { useCustomerId } from '../../hooks/useCustomerId';
import { useAuthStore } from '../../store/authStore';
import type { SuggestedProduct } from '../../types/ai';
import type { Product, ProductVariant } from '../../types/product';

interface SuggestedProductsProps {
  products: SuggestedProduct[];
  variant?: 'sidebar' | 'inline';
}

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

const resolvePrimaryImage = (product?: Product) => {
  if (!product?.images || product.images.length === 0) {
    return undefined;
  }
  const primary = product.images.find((image) => image.isPrimary);
  return (primary ?? product.images[0]).url;
};

const resolveDefaultVariant = (product?: Product): ProductVariant | null => {
  if (!product?.variants || product.variants.length === 0) {
    return null;
  }
  const inStock = product.variants.find((variant) => {
    if (variant.stockQuantity === undefined || variant.stockQuantity === null) {
      return true;
    }
    return variant.stockQuantity > 0;
  });
  return inStock ?? product.variants[0];
};

export const SuggestedProducts = ({ products, variant = 'sidebar' }: SuggestedProductsProps) => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { customerId } = useCustomerId();
  const [productDetails, setProductDetails] = useState<Record<string, Product>>({});
  const [loadingIds, setLoadingIds] = useState<string[]>([]);
  const [failedIds, setFailedIds] = useState<string[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number) => {
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
    const timeoutPromise = new Promise<null>((resolve) => {
      timeoutHandle = setTimeout(() => resolve(null), timeoutMs);
    });
    const result = await Promise.race([promise, timeoutPromise]);
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
    return result as T | null;
  };

  const loadProductDetail = async (productId: string) => {
    if (!productId) {
      return null;
    }
    if (productDetails[productId]) {
      return productDetails[productId];
    }
    if (loadingIds.includes(productId)) {
      return null;
    }

    setLoadingIds((prev) => [...prev, productId]);

    try {
      const product = await withTimeout(catalogApi.getProductById(productId), 6500);
      if (!product) {
        setFailedIds((prev) => Array.from(new Set([...prev, productId])));
        return null;
      }
      setProductDetails((prev) => ({
        ...prev,
        [productId]: product as Product,
      }));
      return product as Product;
    } catch {
      setFailedIds((prev) => Array.from(new Set([...prev, productId])));
      return null;
    } finally {
      setLoadingIds((prev) => prev.filter((id) => id !== productId));
    }
  };

  const productIds = useMemo(() => {
    return Array.from(
      new Set(
        products
          .map((product) => product.productId || product.id)
          .filter((value): value is string => Boolean(value))
      )
    );
  }, [products]);

  useEffect(() => {
    if (productIds.length === 0) {
      return;
    }

    const missingIds = productIds.filter(
      (id) => !productDetails[id] && !loadingIds.includes(id) && !failedIds.includes(id)
    );
    if (!missingIds.length) {
      return;
    }

    missingIds.forEach((id) => {
      void loadProductDetail(id);
    });
  }, [productIds, productDetails, loadingIds]);

  const handleAddToCart = async (productId: string, variant: ProductVariant | null) => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thêm vào giỏ hàng');
      navigate('/login');
      return;
    }
    if (!customerId) {
      toast.error('Không tìm thấy thông tin khách hàng');
      return;
    }
    const detail = variant ? null : await loadProductDetail(productId);
    const resolvedVariant = variant ?? resolveDefaultVariant(detail ?? undefined);
    if (!resolvedVariant) {
      toast.error('Chưa tải được phân loại sản phẩm');
      return;
    }

    setProcessingId(productId);
    try {
      await cartApi.addItem(customerId, {
        productVariantId: resolvedVariant.id,
        quantity: 1,
        unitPrice: resolvedVariant.price,
      });
      window.dispatchEvent(new CustomEvent('cart:updated'));
      toast.success('Đã thêm vào giỏ hàng');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Thêm vào giỏ hàng thất bại';
      toast.error(message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleBuyNow = async (productId: string, variant: ProductVariant | null) => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để mua ngay');
      navigate('/login');
      return;
    }
    if (!customerId) {
      toast.error('Không tìm thấy thông tin khách hàng');
      return;
    }
    const detail = variant ? null : await loadProductDetail(productId);
    const resolvedVariant = variant ?? resolveDefaultVariant(detail ?? undefined);
    if (!resolvedVariant) {
      toast.error('Chưa tải được phân loại sản phẩm');
      return;
    }

    setProcessingId(productId);
    try {
      await cartApi.addItem(customerId, {
        productVariantId: resolvedVariant.id,
        quantity: 1,
        unitPrice: resolvedVariant.price,
      });
      window.dispatchEvent(new CustomEvent('cart:updated'));

      const cart = await cartApi.getCartByCustomerId(customerId);
      const item = cart.items.find((entry) => entry.productVariantId === resolvedVariant.id);
      if (item) {
        window.dispatchEvent(new CustomEvent('chat:close'));
        navigate('/checkout', { state: { selectedItemIds: [item.id] } });
        return;
      }
      window.dispatchEvent(new CustomEvent('chat:close'));
      navigate('/cart');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể mua ngay';
      toast.error(message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleViewDetail = async (productId: string, slug?: string) => {
    if (!slug) {
      const detail = await loadProductDetail(productId);
      if (!detail?.slug) {
        toast.error('Chưa tải được chi tiết sản phẩm');
        return;
      }
      window.dispatchEvent(new CustomEvent('chat:close'));
      navigate(`/product/${detail.slug}`);
      return;
    }
    window.dispatchEvent(new CustomEvent('chat:close'));
    navigate(`/product/${slug}`);
  };

  if (!products.length) {
    if (variant === 'inline') return null;
    return (
      <div className="rounded-3xl border border-dashed border-[#c9a96e]/40 bg-white/80 p-6 text-sm text-[#888]">
        Sản phẩm gợi ý sẽ hiển thị khi AI đưa ra đề xuất.
      </div>
    );
  }

  return (
    <div className={variant === 'sidebar' ? "flex h-full flex-col rounded-3xl border border-[#f1e7d8] bg-white/95 p-5 shadow-[0_20px_50px_-35px_rgba(0,0,0,0.3)]" : "flex flex-col mt-3"}>
      {variant === 'sidebar' && (
        <div className="mb-3">
          <p className="text-[10px] uppercase tracking-[0.35em] text-[#b08b56]">Tuyển chọn</p>
          <h3 className="text-xl font-semibold text-[#1a1a1a]">Sản phẩm gợi ý</h3>
        </div>
      )}
      <div className={variant === 'sidebar' ? "min-h-0 flex-1 space-y-3 overflow-y-auto pr-2" : "space-y-3"}>
        {products.map((product, index) => {
          const productId = product.productId || product.id;
          const detail = productId ? productDetails[productId] : undefined;
          const variant = resolveDefaultVariant(detail);
          const imageUrl = resolvePrimaryImage(detail) ?? product.imageUrl;
          const price = variant?.price ?? detail?.minPrice ?? product.price;
          const slug = detail?.slug;
          const isFailed = productId ? failedIds.includes(productId) : false;
          const isProcessing = processingId === productId;

          return (
            <div
              key={productId || `prod-${index}`}
              className="flex flex-col gap-3 rounded-2xl border border-[#efe4d2] bg-[#fff9f1] p-4 shadow-[0_12px_30px_-24px_rgba(0,0,0,0.35)]"
            >
              <div className="flex items-start gap-3">
                <div className="h-16 w-16 overflow-hidden rounded-2xl bg-white/80">
                  {imageUrl ? (
                    <img src={imageUrl} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-[#a68b5b]">
                      Chưa có ảnh
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-semibold text-[#2d2d2d]">{detail?.name ?? product.name}</p>
                  {product.reason && (
                    <p className="mt-1 text-[11px] text-[#8a7a63]">{product.reason}</p>
                  )}
                  {price !== undefined && (
                    <p className="mt-1 text-[12px] font-semibold text-[#6b5438]">
                      {formatCurrency(price)}
                    </p>
                  )}
                  {loadingIds.includes(productId || '') && (
                    <p className="mt-1 text-[11px] text-[#b08b56]">Đang tải chi tiết...</p>
                  )}
                  {!loadingIds.includes(productId || '') && isFailed && (
                    <p className="mt-1 text-[11px] text-[#b08b56]">Không tải được chi tiết.</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleAddToCart(productId || '', variant)}
                  disabled={!productId || isProcessing}
                  className="rounded-lg border border-[#e2d3bf] bg-white px-2 py-1.5 text-[10px] font-medium text-[#6b5438] shadow-[0_6px_16px_-12px_rgba(0,0,0,0.35)] transition hover:border-[#c9a96e] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isProcessing ? 'Đang xử lý' : 'Thêm giỏ'}
                </button>
                <button
                  type="button"
                  onClick={() => handleBuyNow(productId || '', variant)}
                  disabled={!productId || isProcessing}
                  className="rounded-lg bg-[#1a1a1a] px-2 py-1.5 text-[10px] font-semibold text-[#f0e0c2] shadow-[0_12px_24px_-18px_rgba(0,0,0,0.45)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Mua ngay
                </button>
                <button
                  type="button"
                  onClick={() => handleViewDetail(productId || '', slug)}
                  disabled={!productId || isProcessing}
                  className="rounded-lg border border-transparent bg-[#f7efe4] px-2 py-1.5 text-[10px] font-medium text-[#6b5438] transition hover:border-[#e2d3bf] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Xem chi tiết
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

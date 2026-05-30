import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Copy, Package, Star, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { productApi } from '../../api/productApi';
import type { Product, ProductImage, ProductVariant } from '../../types/product';
import { ReviewSection } from '../../components/review/ReviewSection';
import { toLabel as skinTypeToLabel } from '../../utils/skinTypeUtils';

type DetailTab = 'description' | 'reviews';

type RichVariant = ProductVariant & {
  imageUrl?: string;
};

type RichProduct = Product & {
  averageRating?: number;
  totalReviews?: number;
  totalSold?: number;
  ingredients?: string;
  usageInstructions?: string;
  suitableSkinTypes?: string[];
  skinConcerns?: string[];
  isFeatured?: boolean;
  brandName?: string;
  categoryName?: string;
  brandLogoUrl?: string;
};

type AdminProductDetailProps = {
  slug?: string;
  productId?: string;
  onBack?: () => void;
};

export const AdminProductDetail: React.FC<AdminProductDetailProps> = ({ slug, productId, onBack }) => {
  const [selectedVariant, setSelectedVariant] = useState<RichVariant | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<DetailTab>('description');
  const [isLinkCopied, setIsLinkCopied] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-product', slug, productId],
    queryFn: async () => {
      if (productId) {
        return productApi.getProduct(productId);
      }

      if (!slug) {
        return null;
      }

      const bySlug = await productApi.getProductBySlug(slug);
      const hasDetailFields = Boolean(
        bySlug?.description ||
        bySlug?.images?.length ||
        bySlug?.variants?.length ||
        (bySlug as Product & { categoryId?: string; brandId?: string })?.categoryId ||
        (bySlug as Product & { categoryId?: string; brandId?: string })?.brandId
      );

      if (hasDetailFields) {
        return bySlug;
      }

      const resolvedId = bySlug?.id || bySlug?.productId;
      return resolvedId ? productApi.getProduct(resolvedId) : bySlug;
    },
    enabled: !!slug || !!productId,
  });

  const product = data as RichProduct | null;
  const actualProductId = product?.productId || product?.id;

  const galleryImages = useMemo<ProductImage[]>(() => {
    const productImages = (Array.isArray(product?.images) ? product.images : [])
      .filter((image) => Boolean(image?.url))
      .map((image, index) => ({
        id: image.id || `${product?.id || product?.productId || 'product'}-image-${index}`,
        url: image.url,
        altText: image.altText || product?.name,
        isPrimary: image.isPrimary,
      }));

    if (!productImages.length && product?.thumbnail) {
      productImages.push({
        id: `${product.id || product.productId || 'product'}-thumbnail`,
        url: product.thumbnail,
        altText: product.name,
        isPrimary: true,
      });
    }

    const existingUrls = new Set(productImages.map((image) => image.url));
    const variantImages = (product?.variants || [])
      .map((variant, index) => ({
        variant: variant as RichVariant,
        index,
      }))
      .filter(({ variant }) => Boolean(variant?.imageUrl?.trim()))
      .filter(({ variant }) => {
        const imageUrl = variant.imageUrl?.trim();
        return imageUrl ? !existingUrls.has(imageUrl) : false;
      })
      .map(({ variant, index }) => ({
        id: `${variant.id || 'variant'}-${index}`,
        url: variant.imageUrl!.trim(),
        altText: `${product?.name || 'Sản phẩm'} - ${variant.variantName || 'Biến thể'}`,
        isPrimary: false,
      }));

    return [...productImages, ...variantImages];
  }, [product]);

  const activeVariant = selectedVariant ?? ((product?.variants?.[0] as RichVariant | undefined) || null);
  const displayPrice = activeVariant?.price ?? product?.minPrice ?? 0;
  const originalPrice = activeVariant?.originalPrice ?? product?.maxPrice;
  const categoryName = product?.categoryName || product?.category?.name || 'Chưa phân loại';
  const brandName = product?.brandName || product?.brand?.name || 'Chưa xác định';
  const averageRating = product?.averageRating ?? 0;
  const totalReviews = product?.totalReviews ?? 0;
  const totalSold = product?.totalSold ?? 0;
  const mainImage = galleryImages[selectedImageIndex] || galleryImages[0] || null;
  const displayImageUrl = mainImage?.url || product?.thumbnail || '';
  const shareUrl = typeof window !== 'undefined' ? window.location.origin + (slug ? `/product/${slug}` : '') : '';

  useEffect(() => {
    setSelectedVariant(null);
    setSelectedImageIndex(0);
    setActiveTab('description');
    setIsLinkCopied(false);
  }, [product?.id]);

  useEffect(() => {
    if (selectedImageIndex >= galleryImages.length) {
      setSelectedImageIndex(0);
    }
  }, [galleryImages.length, selectedImageIndex]);

  useEffect(() => {
    if (!isLinkCopied) {
      return undefined;
    }

    const timer = window.setTimeout(() => setIsLinkCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [isLinkCopied]);

  const backButton = onBack ? (
    <button
      type="button"
      onClick={onBack}
      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
    >
      <ArrowLeft size={16} />
      Quay lại danh sách
    </button>
  ) : null;

  if (isLoading) {
    return (
      <div style={{ padding: '1.5rem' }}>
        {backButton}
        <div style={{ padding: '4rem' }}>Đang tải...</div>
      </div>
    );
  }
  if (error) {
    return (
      <div style={{ padding: '1.5rem' }}>
        {backButton}
        <div style={{ padding: '4rem', color: 'red' }}>Không thể tải chi tiết sản phẩm</div>
      </div>
    );
  }
  if (!product) {
    return (
      <div style={{ padding: '1.5rem' }}>
        {backButton}
        <div style={{ padding: '4rem' }}>Sản phẩm không tồn tại</div>
      </div>
    );
  }
  const handleCopyLink = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsLinkCopied(true);
      toast.success('Đã sao chép liên kết');
    } catch {
      toast.error('Không thể sao chép liên kết');
    }
  };

  const renderStars = (rating: number) => {
    return (
      <>
        <svg width="0" height="0" style={{ position: 'absolute' }}>
          <defs>
            <linearGradient id="admin-half-star-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="transparent" stroke="currentColor" />
            </linearGradient>
          </defs>
        </svg>

        {Array.from({ length: 5 }).map((_, index) => {
          const starValue = index + 1;
          let fillValue = 'none';

          if (rating >= starValue) {
            fillValue = 'currentColor';
          } else if (rating > starValue - 1 && rating < starValue) {
            fillValue = 'url(#admin-half-star-gradient)';
          }

          return (
            <Star
              key={`${product.id}-star-${index}`}
              size={16}
              fill={fillValue}
              strokeWidth={2}
            />
          );
        })}
      </>
    );
  };

  const goToImage = (direction: 'prev' | 'next') => {
    if (galleryImages.length <= 1) return;

    setSelectedImageIndex((current) => {
      if (direction === 'prev') {
        return current === 0 ? galleryImages.length - 1 : current - 1;
      }

      return current === galleryImages.length - 1 ? 0 : current + 1;
    });
  };

  const detailSectionStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '1.5rem',
    boxShadow: '0 18px 40px rgba(212, 175, 55, 0.08)',
    border: '1px solid rgba(212, 175, 55, 0.12)',
  };

  const tabButtonStyle = (isActive: boolean): React.CSSProperties => ({
    border: 'none',
    background: 'transparent',
    padding: '0.85rem 1.1rem',
    borderBottom: isActive ? '2px solid #D4AF37' : '2px solid transparent',
    color: isActive ? '#1f2937' : '#7a7a7a',
    fontWeight: isActive ? 700 : 600,
    cursor: 'pointer',
  });

  const handleVariantSelect = (variant: RichVariant) => {
    setSelectedVariant(variant);
    const variantImageUrl = variant.imageUrl?.trim();

    if (!variantImageUrl) return;

    const matchedIndex = galleryImages.findIndex((image) => image.url === variantImageUrl);
    if (matchedIndex >= 0) {
      setSelectedImageIndex(matchedIndex);
    }
  };

  const handleThumbnailSelect = (index: number) => {
    setSelectedImageIndex(index);
  };

  return (
    <div style={{ padding: '1.5rem', background: 'transparent' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        {backButton ? <div style={{ marginBottom: '1rem' }}>{backButton}</div> : null}
        <section
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '2rem',
            alignItems: 'flex-start',
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '24px',
            boxShadow: '0 18px 50px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div style={{ flex: '0 1 380px', maxWidth: 380, minWidth: 0 }}>
            <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '22px', background: '#f8f4eb' }}>
              {displayImageUrl ? (
                <img
                  src={displayImageUrl}
                  alt={activeVariant?.variantName ? `${product.name} - ${activeVariant.variantName}` : mainImage?.altText || product.name}
                  style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', display: 'block', maxHeight: 380 }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '1 / 1',
                    maxHeight: 380,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#9a9a9a',
                    background: '#f3efe6',
                    fontSize: '1rem',
                  }}
                >
                  Không có hình ảnh
                </div>
              )}

              {galleryImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => goToImage('prev')}
                    aria-label="Ảnh trước"
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '0.9rem',
                      transform: 'translateY(-50%)',
                      width: 42,
                      height: 42,
                      borderRadius: '50%',
                      border: 'none',
                      background: 'rgba(255,255,255,0.92)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                      display: 'grid',
                      placeItems: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => goToImage('next')}
                    aria-label="Ảnh sau"
                    style={{
                      position: 'absolute',
                      top: '50%',
                      right: '0.9rem',
                      transform: 'translateY(-50%)',
                      width: 42,
                      height: 42,
                      borderRadius: '50%',
                      border: 'none',
                      background: 'rgba(255,255,255,0.92)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                      display: 'grid',
                      placeItems: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
            </div>



            {galleryImages.length > 1 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(74px, 1fr))', gap: '0.65rem', marginTop: '0.85rem', maxWidth: 380 }}>
                {galleryImages.map((image, index) => (
                  <button
                    key={image.id || image.url || index}
                    type="button"
                    onClick={() => handleThumbnailSelect(index)}
                    style={{
                      padding: 0,
                      borderRadius: '14px',
                      overflow: 'hidden',
                      border: index === selectedImageIndex ? '2px solid #D4AF37' : '1px solid rgba(0,0,0,0.08)',
                      background: 'white',
                      cursor: 'pointer',
                    }}
                  >
                    <img src={image.url} alt={image.altText || product.name} style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', display: 'block' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ flex: '1 1 460px', minWidth: 0 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '0.35rem 0.75rem', borderRadius: 999, background: 'rgba(212,175,55,0.12)', color: '#9b7a1d', fontSize: 12, fontWeight: 700 }}>
                <Tag/>{categoryName}
              </span>
              {product.isFeatured ? (
                <span style={{ padding: '0.35rem 0.75rem', borderRadius: 999, background: 'rgba(34,197,94,0.12)', color: '#15803d', fontSize: 12, fontWeight: 700 }}>
                  Nổi bật
                </span>
              ) : null}
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '0.35rem 0.75rem', borderRadius: 999, background: 'rgba(17,24,39,0.05)', color: '#374151', fontSize: 12, fontWeight: 700 }}>
                {brandName}
              </span>
            </div>

            <h1 style={{ margin: '0 0 0.75rem 0', fontSize: 'clamp(1.9rem, 3vw, 3rem)', lineHeight: 1.1, color: '#1f2937' }}>
              {product.name}
            </h1>

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#D4AF37' }}>
                {renderStars(averageRating || 0)}
              </div>
              <span style={{ fontWeight: 700, color: '#1f2937' }}>{averageRating ? averageRating.toFixed(2) : '0.0'}</span>
              <span style={{ color: '#7a7a7a' }}>({totalReviews} đánh giá)</span>
              <span style={{ color: '#7a7a7a' }}>• {totalSold} đã bán</span>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '2rem', color: '#D4AF37', fontWeight: 800 }}>
                {displayPrice.toLocaleString('vi-VN')} đ
              </div>
              {originalPrice && originalPrice > displayPrice && (
                <div style={{ fontSize: '1rem', color: '#9ca3af', textDecoration: 'line-through' }}>
                  {originalPrice.toLocaleString('vi-VN')} đ
                </div>
              )}
            </div>

            <p style={{ margin: '0 0 1.25rem', lineHeight: 1.8, color: '#5b5b5b', fontSize: '1rem' }}>
              {product.description || 'Chưa có mô tả cho sản phẩm này.'}
            </p>

            {product.variants && product.variants.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ margin: '0 0 0.85rem', fontSize: '0.95rem', fontWeight: 700, color: '#374151' }}>
                  Chọn phân loại
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.7rem' }}>
                  {product.variants.map((variant) => {
                    const typedVariant = variant as RichVariant;
                    const isActive = activeVariant?.id === typedVariant.id;
                    return (
                      <button
                        key={typedVariant.id}
                        type="button"
                        onClick={() => handleVariantSelect(typedVariant)}
                        style={{
                          padding: '0.75rem 1rem',
                          borderRadius: '14px',
                          border: isActive ? '1px solid #D4AF37' : '1px solid rgba(0,0,0,0.08)',
                          background: isActive ? 'rgba(212,175,55,0.08)' : 'white',
                          color: '#374151',
                          fontWeight: isActive ? 700 : 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {typedVariant.variantName}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {activeVariant && (
              <div className="flex items-center gap-2 text-gray-500 text-[0.95rem] my-2">
                <Package size={16} />
                {activeVariant.stockQuantity && activeVariant.stockQuantity > 0 ? (
                  <span>Còn {activeVariant.stockQuantity} sản phẩm</span>
                ) : (
                  <span className="text-red-600">Hết hàng</span>
                )}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center justify-center gap-2 px-5 py-[0.95rem]
                          bg-white text-gray-700 text-base font-bold rounded-[14px]
                          border border-solid border-gray-900 transition-all duration-200
                          cursor-pointer hover:border-gray-900 active:scale-[0.98]"
              >
                {isLinkCopied ? (
                  <>
                    <Check size={18} className="text-green-600" />
                    <span className="text-green-600">Đã sao chép</span>
                  </>
                ) : (
                  <>
                    <Copy size={18} />
                    <span>Sao chép liên kết</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>


        <section style={{ marginTop: '1.5rem', ...detailSectionStyle }}>
          <div style={{ display: 'flex', justifyContent: 'center', borderBottom: '1px solid rgba(0,0,0,0.06)', marginBottom: '1.5rem' }}>
            {(['description', 'reviews'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                style={tabButtonStyle(activeTab === tab)}
              >
                {tab === 'description' && 'Mô tả'}
                {tab === 'reviews' && 'Đánh giá'}
              </button>
            ))}
          </div>

          {activeTab === 'description' && (
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ color: '#4b5563', lineHeight: 1.85 }}>
                {product.description || 'Chưa có mô tả cho sản phẩm này.'}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                {product.ingredients ? (
                  <div style={{ padding: '1rem', borderRadius: '16px', background: '#faf7ef', border: '1px solid rgba(212,175,55,0.14)' }}>
                    <strong style={{ display: 'block', marginBottom: 8 }}>Thành phần</strong>
                    <div style={{ color: '#5b5b5b', lineHeight: 1.75 }}>{product.ingredients}</div>
                  </div>
                ) : null}
                {product.usageInstructions ? (
                  <div style={{ padding: '1rem', borderRadius: '16px', background: '#faf7ef', border: '1px solid rgba(212,175,55,0.14)' }}>
                    <strong style={{ display: 'block', marginBottom: 8 }}>Cách dùng</strong>
                    <div style={{ color: '#5b5b5b', lineHeight: 1.75 }}>{product.usageInstructions}</div>
                  </div>
                ) : null}
              </div>

              {Array.isArray(product.suitableSkinTypes) && product.suitableSkinTypes.length > 0 ? (
                <div>
                  <strong className="text-base block mb-2.5 text-gray-900 font-semibold">
                    Loại da phù hợp
                  </strong>
                  <div className="flex flex-wrap gap-2">
                    {product.suitableSkinTypes.map((item) => (
                      <span
                        key={item}
                        className="px-3 py-1.5 text-base font-medium text-gray-700 bg-white
                                  border border-solid border-gray-300 rounded-full shadow-sm"
                      >
                        {skinTypeToLabel(item)}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {Array.isArray(product.skinConcerns) && product.skinConcerns.length > 0 ? (
                <div className="mt-4">
                  <strong className="text-base block mb-2.5 text-gray-900 font-semibold">
                    Dành cho da đang gặp vấn đề
                  </strong>
                  <div className="flex flex-wrap gap-2">
                    {product.skinConcerns.map((item) => (
                      <span
                        key={item}
                        className="px-3 py-1.5 text-base font-medium text-gray-700 bg-white
                                  border border-solid border-gray-300 rounded-full shadow-sm"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {activeTab === 'reviews' && actualProductId && (
            <ReviewSection productId={actualProductId as string} embedded />
          )}
        </section>
      </div>
    </div>
  );
};

export default AdminProductDetail;

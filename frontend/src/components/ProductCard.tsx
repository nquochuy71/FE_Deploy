import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Loader2, Star } from 'lucide-react';
import type { Product } from '../types/product';

import { useCustomerId } from '../hooks/useCustomerId';
import { useWishlistStore } from '../store/wishlistStore';

interface Props {
  product: Product;
  source?: string;
}

export const ProductCard: React.FC<Props> = ({ product, source }) => {
  const { customerId } = useCustomerId();

  const image = product.thumbnail || (product.images && product.images.length > 0 ? product.images[0].url : '');
  const activeVariant = product.variants?.[0] || null;
  const minPrice = product.minPrice ?? activeVariant?.price ?? 0;
  const maxPrice = product.maxPrice ?? activeVariant?.price ?? 0;
  const totalSold = (product as any).totalSold ?? 0;

  const { isFavorite, toggleItem, fetchWishlist, initialized } = useWishlistStore();
  const [favLoading, setFavLoading] = React.useState(false);

  const pid = product.id || product.productId;
  const favorite = pid ? isFavorite(pid) : false;

  React.useEffect(() => {
    if (customerId && !initialized) {
      fetchWishlist(customerId);
    }
  }, [customerId, initialized, fetchWishlist]);

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!customerId || !pid) {
      // Có thể thêm thông báo yêu cầu đăng nhập ở đây
      return;
    }

    setFavLoading(true);
    try {
      await toggleItem(customerId, pid);
    } catch (err) {
      console.error('toggleWishlist error', err);
    } finally {
      setFavLoading(false);
    }
  };

  return (
    <div style={{
      border: '1px solid #eee',
      borderRadius: 8,
      padding: 12,
      width: 220,
      background: 'white',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Link
        to={`/product/${product.slug || product.productId}${source ? `?source=${source}` : ''}`}
        state={{ productId: product.id || product.productId }}
        style={{ textDecoration: 'none', color: 'inherit', flex: 1, display: 'flex', flexDirection: 'column' }}
      >
        <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 4, marginBottom: 8, background: '#f7f3ea' }}>
          {image ? <img src={image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ color: '#999' }}>No image</div>}
        </div>
        <h3 style={{
          fontSize: 14,
          margin: '0 0 8px 0',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          lineHeight: '1.4',
          minHeight: '2.8em'
        }}>
          {product.name}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Star size={16} fill="currentColor" style={{ color: 'var(--color-gold)' }} />
            <span style={{ color: '#374151', fontSize: 14, fontWeight: 700 }}>
              {(product as any).averageRating ? (product as any).averageRating.toFixed(1) : '0.0'}
            </span>
            {((product as any).totalReviews ?? 0) > 0 && (
              <span style={{ color: '#6b7280', fontSize: 12 }}>
                ({(product as any).totalReviews})
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 6 }}>
          <div style={{ color: 'var(--color-gold)', fontWeight: 700 }}>
            {minPrice > 0
              ? `Chỉ từ ${minPrice.toLocaleString('vi-VN')}đ`
              : `${(minPrice || maxPrice).toLocaleString('vi-VN')}đ`}
          </div>
          {totalSold > 0 && (
            <div style={{ color: '#6b7280', fontSize: 12 }}>
              • {totalSold.toLocaleString('vi-VN')} đã bán
            </div>
          )}
        </div>
      </Link>


      <button
        onClick={handleToggleWishlist}
        disabled={favLoading}
        title={favorite ? 'Bỏ yêu thích' : 'Thêm yêu thích'}
        className={`absolute top-2 right-2 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm ${
          favorite ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-700 hover:bg-white'
        }`}
      >
        {favLoading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Heart
            size={16}
            fill={favorite ? 'currentColor' : 'transparent'}
            stroke="currentColor"
          />
        )}
      </button>
    </div>
  );
};

export default ProductCard;

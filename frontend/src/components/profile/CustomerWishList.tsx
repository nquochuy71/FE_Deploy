import React from 'react';
import { useQueries } from '@tanstack/react-query';
import { productApi } from '../../api/productApi';
import { ProductCard } from '../ProductCard';
import { Heart, Loader2, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWishlistStore } from '../../store/wishlistStore';

interface Props {
  customerId?: string;
}

export const CustomerWishList: React.FC<Props> = ({ customerId }) => {
  const { items: wishItems, loading: wishLoading, fetchWishlist, initialized } = useWishlistStore();

  React.useEffect(() => {
    if (customerId && !initialized) {
      fetchWishlist(customerId);
    }
  }, [customerId, initialized, fetchWishlist]);

  const productQueries = useQueries({
    queries: (wishItems || []).map((item) => ({
      queryKey: ['product', item.productId],
      queryFn: () => productApi.getProduct(item.productId),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const isLoadingProducts = productQueries.some(q => q.isLoading);
  const products = productQueries
    .map(q => q.data)
    .filter((p): p is NonNullable<typeof p> => !!p);

  if (wishLoading && !initialized) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl shadow-sm">
        <Loader2 className="w-10 h-10 text-gold animate-spin mb-4" />
        <p className="text-gray-500">Đang tải danh sách yêu thích...</p>
      </div>
    );
  }

  if (!wishItems || wishItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl shadow-sm px-6 text-center">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
          <Heart className="w-10 h-10 text-gray-300" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Danh sách yêu thích trống</h3>
        <p className="text-gray-500 mb-8 max-w-md">
          Bạn chưa thêm sản phẩm nào vào danh sách yêu thích. Hãy khám phá các sản phẩm tuyệt vời của chúng tôi!
        </p>
        <Link 
          to="/products" 
          className="btn btn--primary px-8 py-3 rounded-full flex items-center gap-2"
        >
          <ShoppingBag size={20} />
          MUA SẮM NGAY
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center gap-3 mb-8 border-b border-gray-100 pb-4">
        <Heart className="text-red-500" fill="currentColor" size={24} />
        <h2 className="text-2xl font-bold text-gray-800">Sản phẩm yêu thích</h2>
        <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
          {wishItems.length} sản phẩm
        </span>
      </div>

      {isLoadingProducts && products.length < wishItems.length && (
        <div className="flex items-center gap-2 text-gray-500 mb-4 italic text-sm">
          <Loader2 size={14} className="animate-spin" />
          Đang cập nhật thông tin sản phẩm...
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
        {products.map((product) => (
          <ProductCard key={product.id || product.productId} product={product} />
        ))}
      </div>
    </div>
  );
};

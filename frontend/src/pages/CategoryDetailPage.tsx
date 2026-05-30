import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { categoryApi } from '../api/categoryApi';
import { productApi } from '../api/productApi';
import { useApi } from '../hooks/useApi';
import ProductCard from '../components/ProductCard';
import {Home, ChevronRight, ChevronDown, PackageOpen } from 'lucide-react';
import type { CategoryResponse } from '../types/catalog';
import type { Product } from '../types/product';
import type { PageResponse } from '../types/api';

const MOCK_CATEGORY: CategoryResponse = {
  id: '1',
  name: 'Chăm sóc da',
  slug: 'chăm-sóc-da',
  description: 'Các sản phẩm chăm sóc da chuyên sâu cho mọi loại da',
  isActive: true,
};

export const CategoryDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  type SortOption = 'default' | 'priceAsc' | 'priceDesc';

  const getProductPrice = (product: Product): number => {
    if (typeof product.minPrice === 'number') return product.minPrice;
    if (typeof product.maxPrice === 'number') return product.maxPrice;
    if (product.variants && product.variants.length > 0) {
      return product.variants[0].price;
    }
    return 0;
  };

  if (!slug) return <div className="text-center py-12 text-gray-500 font-medium">Không tìm thấy phân loại</div>;

  const apiCall = useCallback(() => categoryApi.getCategoryBySlug(slug), [slug]);
  const { data: category, isUsingFallback, loading } = useApi(apiCall, MOCK_CATEGORY);

  const resolvedCategoryId = !isUsingFallback ? category?.id ?? '' : '';

  const [subs, setSubs] = useState<CategoryResponse[]>([]);
  const [activeSubId, setActiveSubId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('default');

  useEffect(() => {
    setActiveSubId(null);
  }, [category?.id]);

  useEffect(() => {
    if (!resolvedCategoryId) return;
    let isMounted = true;
    categoryApi
      .getChildCategories(resolvedCategoryId)
      .then((list) => {
        if (isMounted) setSubs(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (isMounted) setSubs([]);
      });
    return () => {
      isMounted = false;
    };
  }, [resolvedCategoryId]);

  useEffect(() => {
    if (!resolvedCategoryId) return;
    let isMounted = true;

    setProductsLoading(true);
    const productRequest: Promise<PageResponse<Product> | Product[]> = activeSubId
      ? productApi.getProductsByCategory(activeSubId, { size: 24 })
      : productApi.getProductsByCategoryRoot(resolvedCategoryId, { size: 24 });

    productRequest
      .then((res: PageResponse<Product> | Product[]) => {
        if (!isMounted) return;
        const list = Array.isArray(res)
          ? (res as Product[])
          : ((res as PageResponse<Product>).content ?? []);
        setProducts(list);
      })
      .catch((err: unknown) => {
        console.warn('Failed to load products by category:', err);
        if (isMounted) setProducts([]);
      })
      .finally(() => {
        if (isMounted) setProductsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [resolvedCategoryId, activeSubId]);

  const displayedProducts = useMemo(() => {
    if (sortOption === 'default') return products;

    const sorted = [...products];
    sorted.sort((a, b) => {
      const left = getProductPrice(a);
      const right = getProductPrice(b);
      return sortOption === 'priceAsc' ? left - right : right - left;
    });
    return sorted;
  }, [products, sortOption]);



  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-solid border-gray-200 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="text-center py-16 text-gray-500 font-medium">
        Không tìm thấy phân loại sản phẩm
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6F1] py-8 px-4 sm:px-6 lg:px-8 font-sans antialiased text-gray-900">
      <div className="max-w-7xl mx-auto">
        
        {/* Thanh điều hướng Breadcrumbs cao cấp */}
        <nav className="flex items-center space-x-2 text-sm font-medium text-gray-500 mb-6 overflow-x-auto whitespace-nowrap py-1 scrollbar-none">
          {/* Cấp 1: Trang chủ */}
          <Link 
            to="/" 
            className="flex items-center gap-1.5 hover:text-gray-900 transition-colors duration-150"
          >
            <Home size={15} />
            <span>Trang chủ</span>
          </Link>

          <ChevronRight size={14} className="text-gray-400 shrink-0" />

          {/* Cấp 2: Danh mục (Trang tổng hợp hoặc quay lại vị trí trước đó) */}
          <Link 
            to="/" 
            className="hover:text-gray-900 transition-colors duration-150"
          >
            Danh mục
          </Link>

          <ChevronRight size={14} className="text-gray-400 shrink-0" />

          {/* Cấp 3: Tên danh mục hiện tại (Trang hiện tại nên để chữ đậm và không bấm lại được) */}
          <span className="text-gray-900 font-semibold truncate">
            {category.name}
          </span>
        </nav>

        {isUsingFallback && (
          <div className="mb-6 p-3.5 bg-amber-50 border border-solid border-amber-200 rounded-xl text-sm text-amber-800 font-medium shadow-sm">
            Máy chủ phản hồi chậm hơn bình thường. Đang dùng dữ liệu tạm thời
          </div>
        )}

        {/* Tiêu đề trang được căn chỉnh chỉn chu */}
        <header className="mb-8 border-b border-solid border-gray-200/60 pb-6">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">{category.name}</h1>
          {category.description && (
            <p className="mt-3 text-base text-gray-600 max-w-3xl leading-relaxed">{category.description}</p>
          )}
        </header>

        {/* Danh mục con dạng Chip cuộn ngang thông minh */}
        {subs.length > 0 && (
          <div className="mb-8">
            <div className="flex gap-2 overflow-x-auto pb-3 pr-4 scrollbar-none snap-x mask-image-linear">
              <button
                onClick={() => setActiveSubId(null)}
                className={`px-5 py-2 text-sm font-semibold rounded-full border border-solid transition-all cursor-pointer snap-start shrink-0
                  ${activeSubId === null 
                    ? 'bg-gray-900 border-gray-900 text-white shadow-sm' 
                    : 'bg-white border-gray-200 text-gray-700 hover:border-gray-900 hover:text-gray-900'
                  }`}
              >
                Tất cả
              </button>
              {subs.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setActiveSubId(sub.id)}
                  className={`px-5 py-2 text-sm font-semibold rounded-full border border-solid transition-all cursor-pointer snap-start shrink-0
                    ${activeSubId === sub.id 
                      ? 'bg-gray-900 border-gray-900 text-white shadow-sm' 
                      : 'bg-white border-gray-200 text-gray-700 hover:border-gray-900 hover:text-gray-900'
                    }`}
                >
                  {sub.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Thanh công cụ bố cục hiện đại */}
        <div className="flex items-center justify-between gap-4 border-b border-solid border-gray-200/60 pb-4 mb-6">
          <span className="text-sm font-medium text-gray-500">
            Hiển thị <span className="font-semibold text-gray-900">{displayedProducts.length}</span> sản phẩm
          </span>
          
          <div className="flex items-center gap-3">

            {/* Khung sắp xếp tùy chỉnh cao cấp */}
            <div className="relative group">
              <select
                id="category-sort-select"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="appearance-none pl-4 pr-10 py-2 bg-white border border-solid border-gray-200 group-hover:border-gray-400 text-sm font-semibold rounded-xl text-gray-700 cursor-pointer transition-colors focus:outline-none focus:border-gray-900"
              >
                <option value="default">Sắp xếp: Phổ biến</option>
                <option value="priceAsc">Giá: Thấp đến Cao</option>
                <option value="priceDesc">Giá: Cao đến Thấp</option>
              </select>
              <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none group-hover:text-gray-800 transition-colors" />
            </div>
          </div>
        </div>

        {/* Khu vực danh sách sản phẩm */}
        {productsLoading ? (
          /* Trạng thái Loading giả lập khung xương (Skeleton) cao cấp */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-solid border-gray-100 space-y-4 animate-pulse">
                <div className="bg-gray-100 aspect-square rounded-xl w-full" />
                <div className="h-4 bg-gray-100 rounded w-2/3" />
                <div className="h-4 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : displayedProducts.length === 0 ? (
          /* Trạng thái trống được bổ sung hình ảnh minh họa tinh tế */
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white border border-dashed border-gray-300/80 rounded-2xl p-6">
            <div className="w-12 h-12 bg-gray-50 flex items-center justify-center rounded-xl text-gray-400 mb-4">
              <PackageOpen size={24} />
            </div>
            <h3 className="text-base font-bold text-gray-900">Không có sản phẩm nào</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-xs">Hiện tại phân loại sản phẩm này chưa được cập nhật mặt hàng nào mới.</p>
          </div>
        ) : (
          /* Lưới hiển thị sản phẩm tối ưu mật độ */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {displayedProducts.map((p) => (
              <div key={p.id} className="transition-transform duration-200 hover:-translate-y-1">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
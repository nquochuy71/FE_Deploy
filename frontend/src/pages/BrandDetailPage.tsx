import React, { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { brandApi } from '../api/brandApi';
import { productApi } from '../api/productApi';
import { useApi } from '../hooks/useApi';
import ProductCard from '../components/ProductCard';
import { Home, ChevronRight, Globe, PackageOpen, ExternalLink, ArrowDown } from 'lucide-react';
import type { BrandResponse } from '../types/catalog';
import type { Product } from '../types/product';
import type { PageResponse } from '../types/api';

const MOCK_BRAND: BrandResponse = {
  id: '1',
  name: 'Aquamarine',
  slug: 'aquamarine',
  description: 'Thương hiệu hàng đầu trong lĩnh vực chăm sóc làm đẹp',
  originCountry: 'Việt Nam',
  isActive: true,
};

const getMonogram = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const BrandDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  if (!slug) return <div className="text-center py-12 text-gray-500 font-medium">Không tìm thấy thương hiệu</div>;

  const apiCall = useCallback(() => brandApi.getBrandBySlug(slug), [slug]);
  const { data: brand, isUsingFallback, loading } = useApi(apiCall, MOCK_BRAND);

  const resolvedBrandId = !isUsingFallback ? brand?.id ?? '' : '';

  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  useEffect(() => {
    if (!resolvedBrandId) return;
    let isMounted = true;

    setProductsLoading(true);
    productApi
      .getProductsByBrand(resolvedBrandId, { size: 12 })
      .then((res) => {
        if (!isMounted) return;
        const list = Array.isArray(res)
          ? (res as Product[])
          : ((res as PageResponse<Product>).content ?? []);
        setProducts(list);
      })
      .catch((err) => {
        console.warn('Failed to load products by brand:', err);
        if (isMounted) setProducts([]);
      })
      .finally(() => {
        if (isMounted) setProductsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [resolvedBrandId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-solid border-gray-200 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!brand) {
    return <div className="text-center py-16 text-gray-500 font-medium">Không tìm thấy thương hiệu</div>;
  }

  const monogram = getMonogram(brand.name);

  const scrollToProducts = () => {
    const el = document.getElementById('brand-products');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-[#FAF6F1] py-8 px-4 sm:px-6 lg:px-8 font-sans antialiased text-gray-900">
      <div className="max-w-7xl mx-auto">
        
        {/* 1. Breadcrumbs đồng bộ hệ thống */}
        <nav className="flex items-center space-x-2 text-sm font-medium text-gray-500 mb-8 overflow-x-auto whitespace-nowrap py-1 scrollbar-none">
          <Link to="/" className="flex items-center gap-1.5 hover:text-gray-900 transition-colors">
            <Home size={15} />
            <span>Trang chủ</span>
          </Link>
          <ChevronRight size={14} className="text-gray-400 shrink-0" />
          <Link to="/" className="hover:text-gray-900 transition-colors">
            Thương hiệu
          </Link>
          <ChevronRight size={14} className="text-gray-400 shrink-0" />
          <span className="text-gray-900 font-semibold truncate">{brand.name}</span>
        </nav>

        {isUsingFallback && (
          <div className="mb-8 p-3.5 bg-amber-50 border border-solid border-amber-200 rounded-xl text-sm text-amber-800 font-medium shadow-sm">
            Máy chủ phản hồi chậm hơn bình thường. Đang dùng dữ liệu tạm thời
          </div>
        )}

        {/* 2. Khu vực HERO thiết kế cao cấp, bất đối xứng */}
        <section className="relative bg-white border border-solid border-gray-200/60 rounded-3xl p-6 sm:p-8 lg:p-12 shadow-sm overflow-hidden mb-12">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-gray-50 to-transparent rounded-bl-full pointer-events-none" />
          
          <div className="relative flex flex-col-reverse lg:flex-row items-center justify-between gap-8 lg:gap-12">
            {/* Nội dung bên trái */}
            <div className="flex-1 text-center lg:text-left space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-50 border border-solid border-gray-200 rounded-full text-xs font-bold text-gray-600 uppercase tracking-wider">
                Thương hiệu nổi bật
              </div>
              
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900">
                {brand.name}
              </h1>

              {brand.originCountry && (
                <div className="flex items-center justify-center lg:justify-start gap-1.5 text-sm font-semibold text-gray-600">
                  <Globe size={15} className="text-gray-400" />
                  <span>Xuất xứ: {brand.originCountry}</span>
                </div>
              )}
              
              {brand.description && (
                <p className="text-base sm:text-lg text-gray-600 max-w-2xl leading-relaxed">
                  {brand.description}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
                <button
                  onClick={scrollToProducts}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white text-sm font-bold rounded-[14px] shadow-md hover:bg-gray-800 transition-all cursor-pointer active:scale-[0.98]"
                >
                  <span>Khám phá sản phẩm</span>
                  <ArrowDown size={15} />
                </button>
                
                {brand.websiteUrl && (
                  <a
                    href={brand.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-5 py-3 bg-white border border-solid border-gray-300 text-gray-700 text-sm font-bold rounded-[14px] hover:bg-gray-50 hover:border-gray-400 transition-all"
                  >
                    <span>Ghé thăm website</span>
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </div>

            {/* Khối hiển thị Logo tròn lớn bên phải */}
            <div className="shrink-0">
              <div className="w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 bg-[#FAF6F1] rounded-2xl border border-solid border-gray-200 flex items-center justify-center shadow-inner overflow-hidden group">
                {brand.logoUrl ? (
                  <img 
                    src={brand.logoUrl} 
                    alt={brand.name} 
                    className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <span className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-400 tracking-wider select-none">
                    {monogram}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 3. Khu vực GIỚI THIỆU CHI TIẾT (About Us) */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mb-16 border-b border-solid border-gray-200/60 pb-12">
          <div className="lg:col-span-1">
            <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wider relative after:content-[''] after:block after:w-12 after:h-0.5 after:bg-gray-900 after:mt-2">
              Về chúng tôi
            </h2>
          </div>
          <div className="lg:col-span-2 space-y-4 text-gray-600 text-base leading-relaxed">
            <p>
              {brand.name} tự hào mang đến những giải pháp chăm sóc sắc đẹp đột phá, kết hợp hài hòa giữa các thành phần tinh túy từ tự nhiên và nền tảng khoa học kỹ thuật tiên tiến bậc nhất.
            </p>
            <p>
              Mỗi sản phẩm ra đời đều trải qua chu trình kiểm định nghiêm ngặt, hướng tới việc tôn vinh nét đẹp nguyên bản, lành tính và mang đến những thay đổi rõ rệt cho làn da của bạn.
            </p>
          </div>
        </section>

        {/* 4. Danh sách SẢN PHẨM THƯƠNG HIỆU */}
        <section id="brand-products" className="scroll-mt-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Sản phẩm của thương hiệu</h2>
            <p className="text-sm text-gray-500 mt-1">
              Hệ thống các dòng sản phẩm chính hãng phân phối độc quyền bởi {brand.name}.
            </p>
          </div>

          {productsLoading ? (
            /* Khung xương Skeleton cao cấp khi tải sản phẩm */
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-solid border-gray-100 space-y-4 animate-pulse">
                  <div className="bg-gray-100 aspect-square rounded-xl w-full" />
                  <div className="h-4 bg-gray-100 rounded w-2/3" />
                  <div className="h-4 bg-gray-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            /* Trạng thái trống tinh tế */
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white border border-dashed border-gray-300/80 rounded-2xl p-6">
              <div className="w-12 h-12 bg-gray-50 flex items-center justify-center rounded-xl text-gray-400 mb-4">
                <PackageOpen size={24} />
              </div>
              <h3 className="text-base font-bold text-gray-900">Chưa có sản phẩm</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-xs">Mặt hàng thuộc thương hiệu này hiện tại đang được cập nhật thêm.</p>
            </div>
          ) : (
            /* Lưới hiển thị danh sách sản phẩm */
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {products.map((p) => (
                <div key={p.id} className="transition-transform duration-200 hover:-translate-y-1">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
};
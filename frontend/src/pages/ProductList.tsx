import React, { useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, Star, X } from 'lucide-react';
import { productApi } from '../api/productApi';
import { toSlug as skinTypeToSlug } from '../utils/skinTypeUtils';
import ProductCard from '../components/ProductCard';
import type { Product } from '../types/product';
import type { ProductCardResponse, CategorySummaryResponse, BrandSummaryResponse } from '../types/catalog';
import type { PageResponse } from '../types/api';

type ProductListItem = ProductCardResponse;

type SelectOption = {
  id: string;
  label: string;
};

type SortBy = 'default' | 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc';

const sortParamByOption: Record<SortBy, string | undefined> = {
  default: undefined,
  'name-asc': 'name,asc',
  'name-desc': 'name,desc',
  'price-asc': 'minPrice,asc',
  'price-desc': 'minPrice,desc',
};

const skinTypeOptions = ['Da dầu', 'Da khô', 'Da hỗn hợp', 'Da thường', 'Da nhạy cảm', 'Da mụn', 'Da lão hóa', 'Da mất độ đàn hồi', 'Mọi loại da'];

export const ProductList: React.FC = () => {
  const [searchInput, setSearchInput] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');

  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>('default');

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSkinTypes, setSelectedSkinTypes] = useState<string[]>([]);
  const [selectedRatings, setSelectedRatings] = useState<number[]>([]);
  const [selectedPromotions, setSelectedPromotions] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);

  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(0);
  const [computedPriceMax, setComputedPriceMax] = useState(200);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;
  const [showAllSkinTypes, setShowAllSkinTypes] = useState(false);

  // Lazy load filter lists only when user interacts with filter area or opens drawer
  const [shouldLoadFilters, setShouldLoadFilters] = useState(false);

  React.useEffect(() => {
    // Nếu màn hình lớn hơn kích thước mobile (ví dụ 1024px), tự động bật load bộ lọc
    if (window.innerWidth >= 1024) {
      setShouldLoadFilters(true);
    }
  }, []);

  const isSearching = searchKeyword.trim().length > 0;

  const filterParams = useMemo(() => {
    const params: Record<string, unknown> = {
      page: currentPage - 1,
      size: pageSize,
    };

    const sortParam = sortParamByOption[sortBy];
    if (sortParam) {
      params.sort = sortParam;
    }

    if (searchKeyword.trim()) {
      params.keyword = searchKeyword.trim();
    }
    if (selectedCategories.length > 0) {
      params.categoryIds = selectedCategories;
    }
    if (selectedBrands.length > 0) {
      params.brandIds = selectedBrands;
    }
    if (selectedSkinTypes.length > 0) {
      params.skinTypes = selectedSkinTypes.map((s) => skinTypeToSlug(s));
    }
    if (priceMin > 0) {
      params.minPrice = priceMin;
    }
    if (priceMax > 0) {
      params.maxPrice = priceMax;
    }
    if (selectedRatings.length > 0) {
      params.rating = Math.max(...selectedRatings);
    }
    if (selectedPromotions.length > 0) {
      params.promotions = selectedPromotions;
    }

    return params;
  }, [
    currentPage,
    pageSize,
    searchKeyword,
    selectedCategories,
    selectedBrands,
    selectedSkinTypes,
    priceMin,
    priceMax,
    selectedRatings,
    selectedPromotions,
    sortBy,
  ]);

  const { data: pageData, isLoading, error } = useQuery<PageResponse<ProductListItem>>({
    queryKey: ['products', filterParams],
    queryFn: async (): Promise<PageResponse<ProductListItem>> => {
      return productApi.filterProducts(filterParams) as unknown as PageResponse<ProductListItem>;
    },
    placeholderData: keepPreviousData,
  });

  const products = (pageData?.content ?? []) as ProductListItem[];
  const cardProducts: Product[] = useMemo(
    () =>
      products.map((product) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        averageRating: product.averageRating,
        totalSold: product.totalSold,
        minPrice: product.minPrice ?? undefined,
        maxPrice: product.maxPrice ?? undefined,
        isFeatured: product.isFeatured,
        thumbnail: product.thumbnail,
      })),
    [products]
  );

  // fetch summaries lazily via productApi
  const {
    data: categoriesSummary,
    isLoading: isLoadingCategories,
  } = useQuery({
    queryKey: ['categories', 'summary'],
    queryFn: () => productApi.getCategoriesSummary().then((res) => res ?? []),
    enabled: shouldLoadFilters,
  });

  const {
    data: brandsSummary,
    isLoading: isLoadingBrands,
  } = useQuery({
    queryKey: ['brands', 'summary'],
    queryFn: () => productApi.getBrandsSummary().then((res) => res ?? []),
    enabled: shouldLoadFilters,
  });

  const categoryOptions: SelectOption[] = useMemo(() => {
    if (!shouldLoadFilters || !Array.isArray(categoriesSummary)) return [];
    return categoriesSummary.map((category: CategorySummaryResponse) => ({
      id: category.id,
      label: category.name,
    }));
  }, [categoriesSummary, shouldLoadFilters]);

  const brandOptions: SelectOption[] = useMemo(() => {
    if (!shouldLoadFilters || !Array.isArray(brandsSummary)) return [];
    return brandsSummary.map((brand: BrandSummaryResponse) => ({
      id: brand.id,
      label: brand.name,
    }));
  }, [brandsSummary, shouldLoadFilters]);

  const categoryLabelById = useMemo(() => new Map(categoryOptions.map((option) => [option.id, option.label])), [categoryOptions]);
  const brandLabelById = useMemo(() => new Map(brandOptions.map((option) => [option.id, option.label])), [brandOptions]);

  // compute global price bounds from products so default slider doesn't filter everything
  React.useEffect(() => {
    if (!products || products.length === 0) return;
    const mins = products.map((p) => Number(p.minPrice ?? 0)).filter((v) => !Number.isNaN(v));
    const maxs = products.map((p) => Number(p.maxPrice ?? 0)).filter((v) => !Number.isNaN(v));
    const globalMin = mins.length ? Math.min(...mins) : 0;
    const globalMax = maxs.length ? Math.max(...maxs) : 200;
    setComputedPriceMax(globalMax > 0 ? globalMax : 200);

    // if user hasn't adjusted price (both 0), initialize to product bounds
    if (priceMin === 0 && priceMax === 0) {
      setPriceMin(globalMin > 0 ? globalMin : 0);
      setPriceMax(globalMax > 0 ? globalMax : 200);
    }
  }, [products]);

  const totalPages = Math.max(1, pageData?.totalPages ?? 1);
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStart = products.length === 0 ? 0 : (pageData?.number ?? safeCurrentPage - 1) * (pageData?.size ?? pageSize) + 1;
  const pageEnd = products.length === 0 ? 0 : pageStart + products.length - 1;

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchKeyword]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchKeyword, selectedCategories, selectedBrands, selectedSkinTypes, selectedRatings, priceMin, priceMax, selectedPromotions, sortBy]);

  // Scroll to top of product list when user navigates pages
  React.useEffect(() => {
    try {
      const el = document.querySelector('.product-list-page');
      if (el) {
        const top = (window.scrollY || window.pageYOffset) + el.getBoundingClientRect().top - 20;
        window.scrollTo({ top, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      // fallback
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage]);

  const toggleTextFilter = (
    value: string,
    setSelected: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setSelected((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]));
  };

  const toggleRatingFilter = (rating: number) => {
    setSelectedRatings((prev) => (prev.includes(rating) ? prev.filter((item) => item !== rating) : [...prev, rating]));
  };

  const onSubmitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchKeyword(searchInput.trim());
    setCurrentPage(1);
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearchKeyword('');
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedBrands([]);
    setSelectedSkinTypes([]);
    setSelectedRatings([]);
    setSelectedPromotions([]);
    setPriceMin(0);
    setPriceMax(computedPriceMax);
    setCurrentPage(1);
  };

  const removeCategory = (value: string) => setSelectedCategories((prev) => prev.filter((v) => v !== value));
  const removeBrand = (value: string) => setSelectedBrands((prev) => prev.filter((v) => v !== value));
  const removeSkinType = (value: string) => setSelectedSkinTypes((prev) => prev.filter((v) => v !== value));
  const removeRating = (value: number) => setSelectedRatings((prev) => prev.filter((v) => v !== value));
  const removePromotion = (value: string) => setSelectedPromotions((prev) => prev.filter((v) => v !== value));

  const hasActiveFilters = React.useMemo(() => {
    return (
      isSearching ||
      priceMin !== 0 ||
      priceMax !== computedPriceMax ||
      selectedPromotions.length > 0 ||
      selectedCategories.length > 0 ||
      selectedBrands.length > 0 ||
      selectedSkinTypes.length > 0 ||
      selectedRatings.length > 0
    );
  }, [
    isSearching,
    priceMin,
    priceMax,
    computedPriceMax,
    selectedPromotions,
    selectedCategories,
    selectedBrands,
    selectedSkinTypes,
    selectedRatings,
  ]);


  const showFilterSkeleton = shouldLoadFilters && (isLoadingCategories || isLoadingBrands);

  const renderFilterSkeleton = () => (
    <div className="product-list__filter-skeleton">
      <div className="product-list__skeleton-block">
        <div className="product-list__skeleton-title" />
        <div className="product-list__skeleton-line" />
        <div className="product-list__skeleton-line" />
        <div className="product-list__skeleton-line short" />
      </div>
      <div className="product-list__skeleton-block">
        <div className="product-list__skeleton-title" />
        <div className="product-list__skeleton-line" />
        <div className="product-list__skeleton-line short" />
      </div>
      <div className="product-list__skeleton-block">
        <div className="product-list__skeleton-title" />
        <div className="product-list__skeleton-line" />
      </div>
    </div>
  );

  const formatCurrency = (value: number) => `${value.toLocaleString('vi-VN')}đ`;

  const renderFilterPanel = () => (
  <div className="flex flex-col gap-6 p-4 bg-white rounded-xl">
    {/* 1. Theo danh mục */}
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Theo danh mục</h3>
      <div className="flex flex-col gap-2.5 max-h-48 overflow-y-auto pr-1">
        {shouldLoadFilters && isLoadingCategories ? (
          <p className="text-xs text-gray-500 animate-pulse">Đang tải danh mục...</p>
        ) : categoryOptions.length > 0 ? (
          categoryOptions.map((category) => (
            <label key={category.id} className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer select-none hover:text-gray-900 transition-colors">
              <input
                type="checkbox"
                checked={selectedCategories.includes(category.id)}
                onChange={() => toggleTextFilter(category.id, setSelectedCategories)}
                className="w-4 h-4 rounded border-gray-300 text-[#D4AF37] focus:ring-[#D4AF37]/50 cursor-pointer"
              />
              <span>{category.label}</span>
            </label>
          ))
        ) : (
          <p className="text-xs text-gray-400 italic">Chưa có danh mục để hiển thị</p>
        )}
      </div>
    </div>

    <hr className="border-gray-100" />

    {/* 2. Theo thương hiệu */}
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Theo thương hiệu</h3>
      <div className="flex flex-col gap-2.5 max-h-48 overflow-y-auto pr-1">
        {shouldLoadFilters && isLoadingBrands ? (
          <p className="text-xs text-gray-500 animate-pulse">Đang tải thương hiệu...</p>
        ) : brandOptions.length > 0 ? (
          brandOptions.map((brand) => (
            <label key={brand.id} className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer select-none hover:text-gray-900 transition-colors">
              <input
                type="checkbox"
                checked={selectedBrands.includes(brand.id)}
                onChange={() => toggleTextFilter(brand.id, setSelectedBrands)}
                className="w-4 h-4 rounded border-gray-300 text-[#D4AF37] focus:ring-[#D4AF37]/50 cursor-pointer"
              />
              <span>{brand.label}</span>
            </label>
          ))
        ) : (
          <p className="text-xs text-gray-400 italic">Chưa có thương hiệu để hiển thị</p>
        )}
      </div>
    </div>

    <hr className="border-gray-100" />

    {/* 3. Theo loại da */}
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Theo loại da</h3>
      <div className="flex flex-col gap-2.5">
        {(
          showAllSkinTypes ? skinTypeOptions : skinTypeOptions.slice(0, 5)
        ).map((skinType) => (
          <label key={skinType} className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer select-none hover:text-gray-900 transition-colors">
            <input
              type="checkbox"
              checked={selectedSkinTypes.includes(skinType)}
              onChange={() => toggleTextFilter(skinType, setSelectedSkinTypes)}
              className="w-4 h-4 rounded border-gray-300 text-[#D4AF37] focus:ring-[#D4AF37]/50 cursor-pointer"
            />
            <span>{skinType}</span>
          </label>
        ))}
        {skinTypeOptions.length > 5 && (
          <button
            type="button"
            onClick={() => setShowAllSkinTypes((s) => !s)}
            className="text-sm text-gray-500 hover:text-gray-700 mt-1 self-start"
          >
            {showAllSkinTypes ? 'Thu gọn' : 'Xem thêm'}
          </button>
        )}
      </div>
    </div>

    <hr className="border-gray-100" />

    {/* 4. Khoảng giá (Dual Range Slider) */}
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Giá</h3>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between text-xs font-semibold text-gray-700 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100" style={{ marginBottom: 8, padding: '8px 12px' }}>
          <span style={{ minWidth: 80 }}>{formatCurrency(priceMin)}</span>
          <span className="text-gray-300">|</span>
          <span style={{ minWidth: 80, textAlign: 'right' }}>{formatCurrency(priceMax)}</span>
        </div>
        
        {/* Khung chứa thanh trượt kép sử dụng Pointer Events */}
        <div className="relative w-full h-2 bg-gray-100 rounded-full" style={{ padding: '0 12px', boxSizing: 'border-box', width: '100%' }}>
          {/* ĐƯỜNG NỐI MÀU VÀNG GIỮA MIN VÀ MAX */}
          <div 
            className="absolute h-2 bg-[#D4AF37] rounded-full z-10"
            style={{
              left: `${(priceMin / (computedPriceMax || 1)) * 100}%`,
              width: `${((priceMax - priceMin) / (computedPriceMax || 1)) * 100}%`
            }}
          />
          {/* Thanh trượt MIN */}
          <input
            type="range"
            min={0}
            max={computedPriceMax}
            value={priceMin}
            onChange={(e) => setPriceMin(Math.min(Number(e.target.value), priceMax))}
            style={{ left: 12, width: `calc(100% - 24px)` }}
            className="absolute h-2 bg-transparent appearance-none top-0 z-20
                      pointer-events-none accent-[#D4AF37]
                      [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-30
                      [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:relative [&::-moz-range-thumb]:z-30"
          />
          
          {/* Thanh trượt MAX */}
          <input
            type="range"
            min={0}
            max={computedPriceMax}
            value={priceMax}
            onChange={(e) => setPriceMax(Math.max(Number(e.target.value), priceMin))}
            style={{ left: 12, width: `calc(100% - 24px)` }}
            className="absolute h-2 bg-transparent appearance-none top-0 z-20
                      pointer-events-none accent-[#D4AF37]
                      [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-30
                      [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:relative [&::-moz-range-thumb]:z-30"
          />
        </div>
      </div>
    </div>

    <hr className="border-gray-100" />

    {/* 5. Đánh giá */}
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Đánh giá</h3>
      <div className="flex flex-col gap-1.5">
        {[4, 3, 2, 1].map((rating) => {
          const isActive = selectedRatings.includes(rating);
          return (
            <button
              key={rating}
              type="button"
              onClick={() => toggleRatingFilter(rating)}
              className={`flex items-center gap-2.5 px-2.5 py-2 w-full rounded-lg text-sm font-medium transition-all text-left cursor-pointer
                ${isActive 
                  ? 'bg-[#D4AF37]/10 text-[#D4AF37] border border-solid border-[#D4AF37]/30' 
                  : 'bg-transparent text-gray-600 hover:bg-gray-50 border border-solid border-transparent'
                }`}
            >
              <span className={`flex items-center gap-0.5 ${isActive ? 'text-[#D4AF37]' : 'text-amber-400'}`} aria-hidden>
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star 
                    key={`${rating}-${index}`} 
                    size={14} 
                    fill={index < rating ? 'currentColor' : 'none'} 
                    strokeWidth={2}
                  />
                ))}
              </span>
              <span>&gt;={rating} sao</span>
            </button>
          );
        })}
      </div>
    </div>

  </div>
);

  return (
    <section className="product-list-page">
      <div className="container">
        <header className="flex items-center justify-between w-full gap-4 mb-6">
          {/* Nút bấm Filter hiển thị trên Mobile. 
            Nếu trên Desktop (lg) thì ẩn đi vì đã có Sidebar.
          */}
          <button
            type="button"
            className="lg:hidden flex items-center gap-2 px-4 h-11 bg-white border border-solid border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            onClick={() => {
              setShouldLoadFilters(true);
              setIsFilterDrawerOpen(true);
            }}
          >
            <SlidersHorizontal size={16} />
            <span>Filters</span>
          </button>

          {/* Thành phần trống đẩy Thanh Search về bên phải trên màn hình lớn.
            Trên mobile nếu nút filter ẩn thì thanh search tự động giãn rộng 100%.
          */}
          <div className="hidden lg:block flex-1" />

          {/* THANH TÌM KIẾM ĐÃ CẢI THIỆN */}
          <form 
            className="relative flex items-center w-full max-w-lg h-11 bg-[#FAF6F1] border border-solid border-[#CCDFE3] rounded-full px-4 gap-3 transition-all duration-200 focus-within:bg-white focus-within:border-[#2B6377] focus-within:shadow-[0_0_0_4px_rgba(43,99,119,0.08)]" 
            onSubmit={onSubmitSearch}
          >
            {/* Icon kính lúp - Đổi màu nhẹ khi người dùng tập trung nhập liệu */}
            <Search className="text-gray-400 transition-colors duration-200 group-focus-within:text-[#2B6377] shrink-0" size={18} aria-hidden />
            
            {/* Ô nhập liệu văn bản sạch sẽ, loại bỏ outline mặc định */}
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Tìm theo tên sản phẩm..."
              className="w-full h-full bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-0 border-none p-0"
              aria-label="Tìm sản phẩm"
            />
            
            {/* Nút xóa nhanh ký tự (Xuất hiện ngay khi người dùng bắt đầu gõ) */}
            {searchInput && (
              <button
                type="button"
                onClick={clearSearch}
                className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-500 hover:text-gray-700 transition-colors shrink-0"
                aria-label="Xóa tìm kiếm"
                title="Xóa tìm kiếm"
              >
                <X size={12} />
              </button>
            )}
          </form>
        </header>

        <div className="product-list__active-filters">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2B6377] animate-pulse" />
            Bộ lọc đang chọn
          </div>
          {isSearching && (
            <span className="chip">
              Từ khóa: {searchKeyword}
              <button type="button" className="chip__close" onClick={clearSearch} aria-label="Xóa từ khóa">
                <X size={12} />
              </button>
            </span>
          )}

          {priceMin !== 0 || priceMax !== computedPriceMax ? (
            <span className="chip">
              Giá: {priceMin.toLocaleString('vi-VN')}đ - {priceMax.toLocaleString('vi-VN')}đ
              <button
                type="button"
                className="chip__close"
                onClick={() => {
                  setPriceMin(0);
                  setPriceMax(computedPriceMax);
                }}
                aria-label="Xóa bộ lọc giá"
              >
                <X size={12} />
              </button>
            </span>
          ) : null}


          {selectedPromotions.map((p) => (
            <span key={`promo-${p}`} className="chip">
              {p}
              <button type="button" className="chip__close" onClick={() => removePromotion(p)} aria-label={`Xóa ${p}`}>
                <X size={12} />
              </button>
            </span>
          ))}

          {selectedCategories.map((c) => (
            <span key={`cat-${c}`} className="chip">
              {categoryLabelById.get(c) ?? c}
              <button type="button" className="chip__close" onClick={() => removeCategory(c)} aria-label={`Xóa ${categoryLabelById.get(c) ?? c}`}>
                <X size={12} />
              </button>
            </span>
          ))}

          {selectedBrands.map((b) => (
            <span key={`brand-${b}`} className="chip">
              {brandLabelById.get(b) ?? b}
              <button type="button" className="chip__close" onClick={() => removeBrand(b)} aria-label={`Xóa ${brandLabelById.get(b) ?? b}`}>
                <X size={12} />
              </button>
            </span>
          ))}

          {selectedSkinTypes.map((s) => (
            <span key={`skin-${s}`} className="chip">
              {s}
              <button type="button" className="chip__close" onClick={() => removeSkinType(s)} aria-label={`Xóa ${s}`}>
                <X size={12} />
              </button>
            </span>
          ))}

          {selectedRatings.map((r) => (
            <span key={`rating-${r}`} className="chip">
              {r} sao
              <button type="button" className="chip__close" onClick={() => removeRating(r)} aria-label={`Xóa ${r} sao`}>
                <X size={12} />
              </button>
            </span>
          ))}

          {hasActiveFilters && (
            <div style={{ marginLeft: 'auto' }}>
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-sm text-gray-500 hover:text-red-600 hover:underline"
                aria-label="Xóa tất cả bộ lọc"
              >
                Xóa tất cả
              </button>
            </div>
          )}
        </div>

        <div className="product-list__meta-row">
          <p>
            Đang hiển thị {pageStart}-{pageEnd} / {pageData?.totalElements ?? 0} sản phẩm
          </p>
          <label className="product-list__sort">
            <span>Sắp xếp</span>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortBy)}>
              <option value="default">Mặc định</option>
              <option value="name-asc">Tên: A-Z</option>
              <option value="name-desc">Tên: Z-A</option>
              <option value="price-asc">Giá: Thấp đến cao</option>
              <option value="price-desc">Giá: Cao đến thấp</option>
            </select>
          </label>
        </div>

        {isLoading && <p className="product-list__status">Đang tải sản phẩm...</p>}
        {error && <p className="product-list__status is-error">Không thể tải sản phẩm</p>}

        <div className="product-list__layout">
          <aside className="product-list__sidebar">
            {showFilterSkeleton ? (
              renderFilterSkeleton()
            ) : shouldLoadFilters ? (
              renderFilterPanel()
            ) : (
              <div className="product-list__filter-placeholder">Nhấn vào đây để tải bộ lọc</div>
            )}
          </aside>

          <div className="product-list__grid">
            {cardProducts.map((p) => (
              <div key={p.id} className="product-list__grid-item">
                <ProductCard product={p} source="CATEGORY_LIST" />
              </div>
            ))}
            {!isLoading && products.length === 0 && (
              <div className="product-list__empty">Không có sản phẩm phù hợp.</div>
            )}
          </div>
        </div>

        {pageData?.totalElements && totalPages > 1 && (
          <nav className="product-list__pagination" aria-label="Product pagination">
            <button
              type="button"
              className="product-list__pagination-btn"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={safeCurrentPage === 1}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button
                key={page}
                type="button"
                className={`product-list__pagination-btn${page === safeCurrentPage ? ' is-active' : ''}`}
                onClick={() => setCurrentPage(page)}
                aria-current={page === safeCurrentPage ? 'page' : undefined}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              className="product-list__pagination-btn"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={safeCurrentPage === totalPages}
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </nav>
        )}

        {isFilterDrawerOpen && (
          <div className="product-list__drawer-overlay" role="presentation" onClick={() => setIsFilterDrawerOpen(false)}>
            <aside
              className="product-list__drawer"
              role="dialog"
              aria-label="Filter options"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="product-list__drawer-head">
                <h2>Filters</h2>
                <button type="button" onClick={() => setIsFilterDrawerOpen(false)} aria-label="Close filters">
                  <X size={18} />
                </button>
              </div>
              {renderFilterPanel()}
            </aside>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductList;
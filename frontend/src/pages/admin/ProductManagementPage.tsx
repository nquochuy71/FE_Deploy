import { useEffect, useMemo, useRef, useState, type FormEvent, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  Edit2,
  Eye,
  EyeOff,
  Layers3,
  LayoutGrid,
  Package2,
  Plus,
  Search,
  X,
  Users,
  LayoutTemplate
} from 'lucide-react';
import { uploadSingleMedia } from '../../api/uploadApi';
// @ts-ignore - optional dependency, install `react-select` + `react-select-country-list` to enable enhanced selects
import Select from 'react-select';
// @ts-ignore - optional dependency
import countryList from 'react-select-country-list';
import { toast } from 'sonner';
import { productManagementApi, type ProductOverviewResponse } from '../../api/admin/productManagementApi';
import { brandApi } from '../../api/brandApi';
import { categoryApi } from '../../api/categoryApi';
import { AdminProductDetail } from './AdminProductDetail';
import type {
  BrandRequest,
  BrandResponse,
  BrandStatusRequest,
  BrandSummaryResponse,
  CategoryRequest,
  CategoryResponse,
  CategoryStatusRequest,
  CategorySummaryResponse,
} from '../../types/catalog';

type ProductCardRow = {
  id: string;
  name: string;
  slug: string;
  minPrice?: number | null;
  maxPrice?: number | null;
  averageRating?: number;
  totalSold?: number;
  totalStock?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  thumbnail?: string;
};

type AdminTab = 'products' | 'categories' | 'brands';
type PanelMode = 'create' | 'edit' | 'view';

type CategoryFormState = {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  parentId: string;
  isActive: boolean;
};

type BrandFormState = {
  name: string;
  slug: string;
  description: string;
  logoUrl: string;
  originCountry: string;
  websiteUrl: string;
  isActive: boolean;
};

type BrandFormErrors = {
  name?: string;
  logo?: string;
};

type CategoryFormErrors = {
  name?: string;
  image?: string;
};

const emptyCategoryForm = (): CategoryFormState => ({
  name: '',
  slug: '',
  description: '',
  imageUrl: '',
  parentId: '',
  isActive: true,
});

const emptyBrandForm = (): BrandFormState => ({
  name: '',
  slug: '',
  description: '',
  logoUrl: '',
  originCountry: '',
  websiteUrl: '',
  isActive: true,
});

const formatCurrency = (value?: number | null) => {
  if (value === null || value === undefined) {
    return 'Liên hệ';
  }

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
};

// slugify removed — creation now handled via modal or server-side
const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const trimOrUndefined = (value: string) => {
  const normalized = value.trim();
  return normalized ? normalized : undefined;
};

const getProductImage = (product: ProductCardRow) => {
  return product.thumbnail || '';
};

const getPriceLabel = (product: ProductCardRow) => {
  if (product.minPrice !== undefined && product.minPrice !== null) {
    if (product.maxPrice !== undefined && product.maxPrice !== null && product.maxPrice !== product.minPrice) {
      return `${formatCurrency(product.minPrice)} - ${formatCurrency(product.maxPrice)}`;
    }

    return formatCurrency(product.minPrice);
  }

  return 'Liên hệ';
};

const statusTone = (isActive?: boolean) => {
  if (isActive) {
    return {
      className: 'bg-emerald-100 text-emerald-700',
      label: 'Đang bán',
    };
  }

  return {
    className: 'bg-slate-100 text-slate-600',
    label: 'Ngưng bán',
  };
};

const getStockStatus = (stockQuantity?: number) => {
  if (!stockQuantity || stockQuantity === 0) {
    return { className: 'text-red-600 font-semibold', label: 'Hết hàng' };
  }
  if (stockQuantity < 20) {
    return { className: 'text-amber-600 font-semibold', label: 'Low stock' };
  }
  return { className: 'text-emerald-600 font-semibold', label: 'In stock' };
};

const formatDateTime = (value?: string) => {
  if (!value) {
    return 'Chưa có';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed);
};

const tabStyles = (active: boolean) =>
  active
    ? 'bg-[#222222] text-[#c8ab76] shadow-sm'
    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50';

const resourceCardStyles = (active: boolean) =>
  active
    ? 'border-amber-200 bg-amber-50/40 shadow-sm'
    : 'border-slate-200 bg-white shadow-sm';

const FieldLabel = ({ children }: { children: string }) => (
  <label className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-slate-500">{children}</label>
);

const SectionTitle = ({
  title,
  description,
}: {
  title: string;
  description?: string;
}) => (
  <div className="flex flex-wrap items-start justify-between gap-4">
    <div>
      <h2 className="m-0 mt-2 text-2xl font-extrabold tracking-tight text-slate-900">{title}</h2>
      {description ? <p className="m-0 mt-2 max-w-3xl text-sm leading-6 text-slate-500">{description}</p> : null}
    </div>
  </div>
);

const StatCard = ({ label, value, tone }: { label: string; value: string | number; tone: string }) => (
  <article className={`rounded-lg border px-4 py-4 shadow-sm ${tone}`}>
    <p className="m-0 text-[0.72rem] font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
    <p className="m-0 mt-2 text-3xl font-extrabold tracking-tight text-slate-900">{value}</p>
  </article>
);

const ProductStats = ({
  overview,
  products,
}: {
  overview: ProductOverviewResponse | null;
  products: ProductCardRow[];
}) => {
  const stats = overview ?? {
    totalProducts: products.length,
    activeProducts: products.filter((product) => product.isActive).length,
    featuredProducts: products.filter((product) => product.isFeatured).length,
    outOfStockProducts: products.filter((product) => (product.totalStock ?? 0) === 0).length,
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Tổng sản phẩm" value={stats.totalProducts} tone="bg-gradient-to-br from-blue-50 to-white border-blue-100" />
      <StatCard label="Đang bán" value={stats.activeProducts} tone="bg-gradient-to-br from-emerald-50 to-white border-emerald-100" />
      <StatCard label="Sản phẩm tiêu biểu" value={stats.featuredProducts} tone="bg-gradient-to-br from-amber-50 to-white border-amber-100" />
      <StatCard label="Hết hàng" value={stats.outOfStockProducts} tone="bg-gradient-to-br from-rose-50 to-white border-rose-100" />
    </div>
  );
};

const buildVisiblePages = (totalPages: number, currentPage: number, maxVisible = 5) => {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, index) => index);
  }

  const half = Math.floor(maxVisible / 2);
  const start = Math.max(0, Math.min(currentPage - half, totalPages - maxVisible));

  return Array.from({ length: maxVisible }, (_, index) => start + index);
};

const ProductsTab = ({
  products,
  overview,
  loading,
  error,
  currentPage,
  totalPages,
  totalElements,
  searchValue,
  brandOptions,
  categoryOptions,
  selectedBrandId,
  selectedCategoryId,
  selectedSort,
  statusUpdatingProductId,
  onBrandChange,
  onCategoryChange,
  onSortChange,
  onSearchChange,
  onApplyFilters,
  onClearFilters,
  onPageChange,
  onToggleStatus,
  onView,
}: {
  products: ProductCardRow[];
  overview: ProductOverviewResponse | null;
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalElements: number;
  searchValue: string;
  brandOptions: BrandSummaryResponse[];
  categoryOptions: CategorySummaryResponse[];
  selectedBrandId: string;
  selectedCategoryId: string;
  selectedSort: string;
  statusUpdatingProductId: string | null;
  onBrandChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  onPageChange: (page: number) => void;
  onToggleStatus: (product: ProductCardRow) => void;
  onView: (product: ProductCardRow) => void;
}) => {
  const visiblePages = buildVisiblePages(totalPages, currentPage);
  const isUpdatingStatus = Boolean(statusUpdatingProductId);

  return (
    <div className="grid gap-6">
      {isUpdatingStatus ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 backdrop-blur-[1px]">
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-2xl">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-amber-600" />
            <p className="m-0 text-sm font-semibold text-slate-700">Đang cập nhật trạng thái sản phẩm...</p>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-6">
        <div>
          <h2 className="m-0 mt-1 text-2xl font-bold text-slate-900">Quản lý sản phẩm</h2>
        </div>

        <Link
          to="/admin/products/new"
          className="inline-flex items-center gap-2 rounded-lg bg-[#c8ab76] px-6 py-3 font-bold text-[#222222] shadow transition hover:opacity-90 hover:shadow-lg">
          <Plus size={16} />
          Thêm sản phẩm
        </Link>
      </div>

      <ProductStats overview={overview} products={products} />

      <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <form className="grid gap-3 xl:grid-cols-[1.8fr_1fr_1fr_1fr_auto_auto]" onSubmit={(event) => {
          event.preventDefault();
          onApplyFilters();
        }}>
          <label className="flex items-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-600 transition hover:bg-slate-50">
            <Search size={18} />
            <input
              type="text"
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Tìm theo tên, slug, sku..."
              className="w-full border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
          </label>

          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-600 transition hover:bg-slate-50">
            <span className="whitespace-nowrap text-sm">Danh mục</span>
            <select
              value={selectedCategoryId}
              onChange={(event) => onCategoryChange(event.target.value)}
              className="flex-1 cursor-pointer bg-transparent text-sm font-semibold text-slate-900 outline-none"
            >
              <option value="">Tất cả</option>
              {categoryOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-600 transition hover:bg-slate-50">
            <span className="whitespace-nowrap text-sm">Brand</span>
            <select
              value={selectedBrandId}
              onChange={(event) => onBrandChange(event.target.value)}
              className="flex-1 cursor-pointer bg-transparent text-sm font-semibold text-slate-900 outline-none"
            >
              <option value="">Tất cả</option>
              {brandOptions.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-600 transition hover:bg-slate-50">
            <span className="whitespace-nowrap text-sm">Sắp xếp</span>
            <select
              value={selectedSort}
              onChange={(event) => onSortChange(event.target.value)}
              className="flex-1 cursor-pointer bg-transparent text-sm font-semibold text-slate-900 outline-none"
            >
              <option value="createdAt,desc">Mới nhất</option>
              <option value="createdAt,asc">Cũ nhất</option>
              <option value="name,asc">Tên A-Z</option>
              <option value="name,desc">Tên Z-A</option>
            </select>
          </label>

          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            Lọc
          </button>

          {(selectedBrandId || selectedCategoryId || searchValue.trim()) ? (
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-5 py-3 text-sm font-bold text-red-700 transition hover:bg-red-100"
            >
              Xóa bộ lọc
            </button>
          ) : null}
        </form>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
        <p className="m-0">
          Đang hiển thị {products.length} / {totalElements} sản phẩm
        </p>
        <p className="m-0">
          Trang {totalPages > 0 ? currentPage + 1 : 0} / {totalPages}
        </p>
      </div>

      {loading ? (
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
          {Array.from({ length: 12 }).map((_, index) => (
            <article key={index} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="aspect-video animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200" />
              <div className="space-y-2 p-3">
                <div className="h-3 w-2/5 animate-pulse rounded-full bg-slate-200" />
                <div className="h-4 w-3/4 animate-pulse rounded-full bg-slate-200" />
                <div className="h-3 w-full animate-pulse rounded-full bg-slate-100" />
                <div className="mt-2 h-8 animate-pulse rounded-lg bg-slate-100" />
              </div>
            </article>
          ))}
        </section>
      ) : error ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-amber-900">
          <h3 className="m-0 font-bold">Không thể tải sản phẩm</h3>
          <p className="m-0 mt-2 text-sm">{error}</p>
        </section>
      ) : products.length === 0 ? (
        <section className="rounded-lg border border-slate-200 bg-white p-5 text-slate-500">
          Chưa có sản phẩm nào để hiển thị.
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
          {products.map((product) => {
            const imageUrl = getProductImage(product);
            const tone = statusTone(product.isActive);
            const displayPrice = getPriceLabel(product);
            const totalStock = product.totalStock ?? 0;
            const stockStatus = getStockStatus(totalStock);

            return (
              <article
                key={product.id}
                className={`group grid cursor-pointer overflow-hidden rounded-lg border border-slate-200 bg-white shadow-md transition-all duration-200 hover:border-slate-300 hover:shadow-lg ${
                  product.isActive ? '' : 'opacity-60 grayscale'
                }`}
              >
                <div
                  className="relative aspect-video overflow-hidden bg-slate-100"
                  style={{
                    backgroundImage: imageUrl
                      ? `linear-gradient(180deg, rgba(15, 23, 42, 0.05), rgba(15, 23, 42, 0.15)), url("${imageUrl}")`
                      : 'linear-gradient(135deg, #dbeafe, #e0f2fe)',
                    backgroundPosition: 'center',
                    backgroundSize: 'cover',
                    backgroundRepeat: 'no-repeat',
                  }}
                >
                  <div
                    className={`absolute inset-0 transition duration-200 group-hover:bg-black/20 ${
                      product.isActive ? 'bg-black/0' : 'bg-white/35'
                    }`}
                  />

                  <div className="absolute left-2 top-2 flex flex-wrap gap-2">
                    <span className={`rounded-full px-2 py-1 text-xs font-bold ${tone.className}`}>{tone.label}</span>
                  </div>

                  {product.isFeatured ? (
                    <span className="absolute right-2 top-2 rounded-full bg-gradient-to-r from-amber-300 to-amber-400 px-3 py-1 text-xs font-bold text-amber-900 shadow-md">
                      ⭐ Nổi bật
                    </span>
                  ) : null}

                  <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 transition duration-200 group-hover:opacity-100">
                    <button
                      type="button"
                      className="rounded-full bg-white p-2.5 shadow-lg transition hover:bg-slate-50"
                      title="Xem chi tiết"
                      onClick={() => onView(product)}
                    >
                      <Eye size={16} className="text-slate-700" />
                    </button>
                    <Link to={`/admin/products/${product.id}/edit`} className="rounded-full bg-white p-2.5 shadow-lg transition hover:bg-slate-50" title="Chỉnh sửa">
                      <Edit2 size={16} className="text-slate-700" />
                    </Link>
                    <button
                      type="button"
                      title={product.isActive ? 'Ẩn sản phẩm' : 'Hiển thị sản phẩm'}
                      disabled={isUpdatingStatus}
                      onClick={() => onToggleStatus(product)}
                      className="flex items-center rounded-full bg-white p-1 shadow-lg transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <div
                        className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 ${
                          product.isActive ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                            product.isActive ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </div>
                    </button>
                  </div>
                </div>

                <div className="grid gap-2 p-3">
                  <div className="min-w-0">
                    <h3 className="m-0 mt-1 line-clamp-2 text-sm font-bold text-slate-900">{product.name}</h3>
                  </div>

                  <div className="space-y-1">
                    <strong className="block text-sm font-bold text-slate-900">{displayPrice}</strong>
                  </div>

                  <div className="grid gap-2 text-xs">
                    <div className="rounded-lg bg-slate-50 p-1.5">
                      <p className="font-semibold text-slate-500">Tồn kho</p>
                      <p className={`font-bold ${stockStatus.className}`}>{totalStock}</p>
                    </div>
                  </div>

                </div>
              </article>
            );
          })}
        </section>
      )}

      {!loading && !error && totalPages > 1 ? (
        <nav className="flex flex-wrap items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm" aria-label="Product pagination">
          <button
            type="button"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => onPageChange(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            aria-label="Trang trước"
          >
            &lt;
          </button>

          {visiblePages.map((page) => (
            <button
              key={page}
              type="button"
              className={`rounded-lg border px-3 py-2 text-sm font-bold transition ${
                page === currentPage
                  ? 'border-amber-500 bg-amber-500 text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
              onClick={() => onPageChange(page)}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page + 1}
            </button>
          ))}

          <button
            type="button"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage >= totalPages - 1}
            aria-label="Trang sau"
          >
            &gt;
          </button>
        </nav>
      ) : null}
    </div>
  );
};

const ResourceListItem = ({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) => (
  <article
    onClick={onClick}
    className={`relative rounded-lg border p-4 transition cursor-pointer hover:border-amber-300 hover:bg-amber-50/30 ${resourceCardStyles(active)}`}
    style={{ overflow: 'visible' }}
  >
    {children}
  </article>
);

const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
    <p className="m-0 text-[0.72rem] font-bold uppercase tracking-[0.18em] text-slate-500">{label}</p>
    <div className="mt-2 text-sm font-medium text-slate-900">{value}</div>
  </div>
);

const ImagePreview = ({ src, alt }: { src?: string; alt: string }) => {
  if (!src) {
    return (
      <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-400">
        Chưa có hình ảnh
      </div>
    );
  }

  return <img src={src} alt={alt} className="h-32 w-full rounded-lg border border-slate-200 object-cover" />;
};

const CategoryPanel = ({
  categories,
  loading,
  error,
  search,
  setSearch,
  filteredCategories,
  selectedCategory,
  panelMode,
  searchActive,
  searchLoading,
  onSearchSubmit,
  onSearchClear,
  onCreateNew,
  onEdit,
  onView,
  onCloseView,
  onToggleStatus,
  statusUpdatingId,
}: {
  categories: CategoryResponse[];
  loading: boolean;
  error: string | null;
  search: string;
  setSearch: (value: string) => void;
  filteredCategories: CategoryResponse[];
  selectedCategory: CategoryResponse | null;
  panelMode: PanelMode;
  searchActive: boolean;
  searchLoading: boolean;
  onSearchSubmit: () => void;
  onSearchClear: () => void;
  onCreateNew: () => void;
  onEdit: (category: CategoryResponse) => void;
  onView: (category: CategoryResponse) => void;
  onCloseView: () => void;
  onToggleStatus: (category: CategoryResponse) => void;
  statusUpdatingId?: string | null;
}) => {
  const isViewing = panelMode === 'view' && Boolean(selectedCategory);
  const [parentCategoryName, setParentCategoryName] = useState<string | null>(null);
  const [parentCategoryLoading, setParentCategoryLoading] = useState(false);

  useEffect(() => {
    const parentId = selectedCategory?.parentId;
    if (!parentId) {
      setParentCategoryName(null);
      setParentCategoryLoading(false);
      return;
    }

    let cancelled = false;
    setParentCategoryLoading(true);
    setParentCategoryName(null);
    categoryApi
      .getCategoryById(parentId)
      .then((parent) => {
        if (!cancelled) {
          setParentCategoryName(parent?.name || null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setParentCategoryName(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setParentCategoryLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCategory?.parentId]);

  return (
    <section className="grid gap-6 rounded-[32px] border border-slate-200 bg-[#f8f9fa] p-4 shadow-[0_20px_55px_rgba(15,23,42,0.06)] lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <SectionTitle
          title="Quản lý danh mục"
          description="Thêm mới, cập nhật thông tin hoặc chuyển trạng thái danh mục nhanh chóng."
        />
        <button
          type="button"
          onClick={onCreateNew}
          className="inline-flex items-center gap-2 rounded-lg bg-[#c8ab76] px-4 py-2.5 text-sm font-bold text-[#222222] shadow transition hover:opacity-90 hover:shadow-lg"
          >
          <Plus size={16} />
          Thêm category
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-4">

          <form
            onSubmit={(event) => {
              event.preventDefault();
              onSearchSubmit();
            }}
            className="flex flex-wrap items-stretch gap-2"
          >
            <label className="flex flex-1 min-w-[240px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition focus-within:border-amber-300 focus-within:ring-4 focus-within:ring-amber-100">
              <Search size={18} className="text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm theo từ khóa..."
                className="w-full border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
              {search ? (
                <button
                  type="button"
                  onClick={onSearchClear}
                  aria-label="Xóa tìm kiếm"
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <X size={14} />
                </button>
              ) : null}
            </label>
            <button
              type="submit"
              disabled={searchLoading}
              className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {searchLoading ? 'Đang tìm...' : 'Tìm'}
            </button>
          </form>

          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Tổng danh mục" value={categories.length} tone="bg-white border-slate-200" />
            <StatCard label="Đang hoạt động" value={categories.filter((item) => item.isActive).length} tone="bg-white border-slate-200" />
            <StatCard label="Danh mục cha" value={categories.filter((item) => !item.parentId).length} tone="bg-white border-slate-200" />
          </div>

          {loading ? (
            <div className="grid gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-amber-900">
              <p className="m-0 font-bold">Không thể tải category</p>
              <p className="m-0 mt-2 text-sm">{error}</p>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white p-5 text-slate-500">
              {searchActive ? 'Không tìm thấy danh mục nào với từ khóa này.' : 'Chưa có category nào phù hợp.'}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredCategories.map((category) => {
                const active = selectedCategory?.id === category.id;

                return (
                  <ResourceListItem key={category.id} active={active} onClick={() => onView(category)}>
                      <div className="relative">
                        <div className="flex min-w-0 items-start gap-3 pr-28">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                            {category.imageUrl ? (
                              <img src={category.imageUrl} alt={category.name} className="h-full w-full object-cover" />
                            ) : (
                              <Layers3 size={18} className="text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="m-0 text-base font-bold text-slate-900 truncate">{category.name}</h3>
                              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${category.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                {category.isActive ? 'Đang hoạt động' : 'Đã ẩn'}
                              </span>
                            </div>
                            <p className="m-0 mt-1 text-sm text-slate-500">{category.slug}</p>
                            <p className="m-0 mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                              {category.description || 'Chưa có mô tả'}
                            </p>
                          </div>
                        </div>

                        <div
                          className="absolute right-4 top-4 flex flex-wrap gap-2"
                          onClick={(event) => event.stopPropagation()}
                        >
                          
                          <button
                            type="button"
                            onClick={() => onToggleStatus(category)}
                            disabled={statusUpdatingId === category.id}
                            className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold transition ${
                              category.isActive
                                ? 'border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                                : 'border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                            } ${statusUpdatingId === category.id ? 'opacity-60 cursor-not-allowed' : ''}`}
                          >
                            <EyeOff size={14} />
                            {statusUpdatingId === category.id ? 'Đang...' : (category.isActive ? 'Ẩn' : 'Hiện')}
                          </button>
                        </div>
                      </div>
                    </ResourceListItem>
                );
              })}
            </div>
          )}
        </div>

        <aside className="sticky top-5 h-fit rounded-lg border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
        {isViewing && selectedCategory ? (
          <div className="grid gap-6">
            {/* Header với Status Badge */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                    selectedCategory.isActive
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      : 'bg-rose-50 text-rose-600 border-rose-100'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${selectedCategory.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    {selectedCategory.isActive ? 'Active' : 'Hidden'}
                  </span>
                </div>
                <h3 className="m-0 text-xl font-extrabold text-slate-900">{selectedCategory.name}</h3>
                <p className="m-0 text-xs text-slate-400 font-mono mt-1">slug: {selectedCategory.slug}</p>
              </div>

              <div className="flex flex-shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => onEdit(selectedCategory)}
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-[#232323] transition "
                >
                  <Edit2 size={14} />
                </button>
                <button
                  type="button"
                  onClick={onCloseView}
                  aria-label="Đóng"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            <ImagePreview src={selectedCategory.imageUrl} alt={selectedCategory.name} />

            {/* Thông tin chi tiết */}
            <div className="grid gap-3 pt-2">
              <DetailRow
                label="Danh mục cha"
                value={
                  selectedCategory.parentId
                    ? parentCategoryLoading
                      ? 'Đang tải...'
                      : parentCategoryName || 'Không xác định'
                    : 'Danh mục gốc'
                }
              />
              <DetailRow label="Mô tả" value={selectedCategory.description || 'Chưa có mô tả'} />
              <DetailRow label="Ngày tạo" value={formatDateTime(selectedCategory.createdAt)} />
            </div>
          </div>
        ) : (
          /* Empty State chuyên nghiệp */
          <div className="flex h-[300px] flex-col items-center justify-center p-8 text-center text-slate-400">
            <LayoutTemplate size={48} className="mb-4 opacity-20" />
            <h4 className="text-sm font-bold text-slate-900">Chưa chọn danh mục</h4>
            <p className="mt-1 text-xs text-slate-500 max-w-[200px]">
              Chọn một category từ danh sách để xem chi tiết hoặc tạo danh mục mới.
            </p>
            <button 
              type="button" 
              onClick={onCreateNew} 
              className="mt-6 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Tạo category mới
            </button>
          </div>
        )}
      </aside>
      </div>
    </section>
  );
};

const BrandPanel = ({
  brands,
  loading,
  error,
  search,
  setSearch,
  filteredBrands,
  selectedBrand,
  panelMode,
  searchActive,
  searchLoading,
  onSearchSubmit,
  onSearchClear,
  onCreateNew,
  onEdit,
  onView,
  onCloseView,
  onToggleStatus,
  statusUpdatingId,
}: {
  brands: BrandResponse[];
  loading: boolean;
  error: string | null;
  search: string;
  setSearch: (value: string) => void;
  filteredBrands: BrandResponse[];
  selectedBrand: BrandResponse | null;
  panelMode: PanelMode;
  searchActive: boolean;
  searchLoading: boolean;
  onSearchSubmit: () => void;
  onSearchClear: () => void;
  onCreateNew: () => void;
  onEdit: (brand: BrandResponse) => void;
  onView: (brand: BrandResponse) => void;
  onCloseView: () => void;
  onToggleStatus: (brand: BrandResponse) => void;
  statusUpdatingId?: string | null;
}) => {
  const isViewing = panelMode === 'view' && Boolean(selectedBrand);

  return (
    <section className="grid gap-6 rounded-[32px] border border-slate-200 bg-[#f8f9fa] p-4 shadow-[0_20px_55px_rgba(15,23,42,0.06)] lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <SectionTitle
          title="Quản lý brand"
          description="Tạo mới, cập nhật và chuyển trạng thái thương hiệu nhanh chóng."
        />
        <button
          type="button"
          onClick={onCreateNew}
          className="inline-flex items-center gap-2 rounded-lg bg-[#c8ab76] px-4 py-2.5 text-sm font-bold text-[#222222] shadow transition hover:opacity-90 hover:shadow-lg"
        >
          <Plus size={16} />
          Thêm brand
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-4">
          
          <form
            onSubmit={(event) => {
              event.preventDefault();
              onSearchSubmit();
            }}
            className="flex flex-wrap items-stretch gap-2"
          >
            <label className="flex flex-1 min-w-[240px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-100">
              <Search size={18} className="text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm theo từ khóa..."
                className="w-full border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
              {search ? (
                <button
                  type="button"
                  onClick={onSearchClear}
                  aria-label="Xóa tìm kiếm"
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <X size={14} />
                </button>
              ) : null}
            </label>
            <button
              type="submit"
              disabled={searchLoading}
              className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {searchLoading ? 'Đang tìm...' : 'Tìm'}
            </button>
          </form>

          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard 
                label="Tổng nhãn hàng" 
                value={brands.length} 
                tone="bg-white border-slate-300" 
            />
            <StatCard 
                label="Đang hoạt động" 
                value={brands.filter((item) => item.isActive).length} 
                tone="bg-white border-slate-300" 
            />
            <StatCard 
                label="Đã ẩn" 
                value={brands.filter((item) => !item.isActive).length} 
                tone="bg-white border-slate-300" 
            />
            </div>

          {loading ? (
            <div className="grid gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-amber-900">
              <p className="m-0 font-bold">Không thể tải brand</p>
              <p className="m-0 mt-2 text-sm">{error}</p>
            </div>
          ) : filteredBrands.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-500">
              {searchActive ? 'Không tìm thấy brand nào với từ khóa này.' : 'Chưa có brand nào phù hợp.'}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredBrands.map((brand) => {
                const active = selectedBrand?.id === brand.id;

                return (
                  <ResourceListItem key={brand.id} active={active} onClick={() => onView(brand)}>
                      <div className="relative">
                        <div className="flex min-w-0 items-start gap-3 pr-28">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                            {brand.logoUrl ? (
                              <img src={brand.logoUrl} alt={brand.name} className="h-full w-full object-cover" />
                            ) : (
                              <Users size={18} className="text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="m-0 text-base font-bold text-slate-900">{brand.name}</h3>
                              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${brand.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                {brand.isActive ? 'Đang hoạt động' : 'Đã ẩn'}
                              </span>
                            </div>
                            <p className="m-0 mt-1 text-sm text-slate-500">{brand.slug}</p>
                            <p className="m-0 mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                              {brand.description || 'Chưa có mô tả'}
                            </p>
                          </div>
                        </div>

                        <div
                          className="absolute right-4 top-4 flex flex-wrap gap-2"
                          onClick={(event) => event.stopPropagation()}
                        >
                          
                          <button
                            type="button"
                            onClick={() => onToggleStatus(brand)}
                            disabled={statusUpdatingId === brand.id}
                            className={`inline-flex flex-none items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold transition ${
                              brand.isActive
                                ? 'border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                                : 'border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                            } ${statusUpdatingId === brand.id ? 'opacity-60 cursor-not-allowed' : ''}`}
                          >
                            <EyeOff size={14} />
                            {statusUpdatingId === brand.id ? 'Đang...' : (brand.isActive ? 'Ẩn' : 'Hiện')}
                          </button>
                        </div>
                      </div>
                    </ResourceListItem>
                );
              })}
            </div>
          )}
        </div>

        <aside className="sticky top-5 h-fit rounded-lg border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          {isViewing && selectedBrand ? (
            <div className="grid gap-6">
              {/* Header với Status Badge */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                      selectedBrand.isActive
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        : 'bg-rose-50 text-rose-600 border-rose-100'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${selectedBrand.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      {selectedBrand.isActive ? 'Active' : 'Hidden'}
                    </span>
                  </div>
                  <h3 className="m-0 text-xl font-extrabold text-slate-900">{selectedBrand.name}</h3>
                  <p className="m-0 text-xs text-slate-400 font-mono mt-1">slug: {selectedBrand.slug}</p>
                </div>

                <div className="flex flex-shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(selectedBrand)}
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-[#232323] transition hover:bg-slate-50"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={onCloseView}
                    aria-label="Đóng"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              <ImagePreview src={selectedBrand.logoUrl} alt={selectedBrand.name} />

              {/* Thông tin chi tiết */}
              <div className="grid gap-3 pt-2">
                <DetailRow label="Mô tả" value={selectedBrand.description || 'Chưa có mô tả'} />
                <DetailRow label="Quốc gia" value={selectedBrand.originCountry || 'Chưa xác định'} />
                <DetailRow label="Website" value={selectedBrand.websiteUrl || 'Chưa có'} />
                <DetailRow label="Ngày tạo" value={formatDateTime(selectedBrand.createdAt)} />
              </div>
            </div>
          ) : (
            /* Empty State chuyên nghiệp */
            <div className="flex h-[300px] flex-col items-center justify-center p-8 text-center text-slate-400">
              <LayoutTemplate size={48} className="mb-4 opacity-20" />
              <h4 className="text-sm font-bold text-slate-900">Chưa chọn brand</h4>
              <p className="mt-1 text-xs text-slate-500 max-w-[200px]">
                Chọn một brand từ danh sách để xem chi tiết hoặc tạo brand mới.
              </p>
              <button 
                type="button" 
                onClick={onCreateNew} 
                className="mt-6 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Tạo brand mới
              </button>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
};

export const ProductManagement = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('products');

  const [products, setProducts] = useState<ProductCardRow[]>([]);
  const [productLoading, setProductLoading] = useState(true);
  const [productError, setProductError] = useState<string | null>(null);
  const [productPage, setProductPage] = useState(0);
  const [productTotalPages, setProductTotalPages] = useState(0);
  const [productTotalElements, setProductTotalElements] = useState(0);
  const [productOverview, setProductOverview] = useState<ProductOverviewResponse | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [statusUpdatingProductId, setStatusUpdatingProductId] = useState<string | null>(null);
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedSort, setSelectedSort] = useState('createdAt,desc');
  const [appliedBrandId, setAppliedBrandId] = useState('');
  const [appliedCategoryId, setAppliedCategoryId] = useState('');
  const [appliedSort, setAppliedSort] = useState('createdAt,desc');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [brandSummaries, setBrandSummaries] = useState<BrandSummaryResponse[]>([]);
  const [categorySummaries, setCategorySummaries] = useState<CategorySummaryResponse[]>([]);
  const [viewingProduct, setViewingProduct] = useState<{ slug: string; productId: string } | null>(null);

  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryPanelMode, setCategoryPanelMode] = useState<PanelMode>('create');
  const [categorySelected, setCategorySelected] = useState<CategoryResponse | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(emptyCategoryForm());
  const [categoryImageFile, setCategoryImageFile] = useState<File | null>(null);
  const [categoryImagePreviewUrl, setCategoryImagePreviewUrl] = useState<string | null>(null);
  

  const [brands, setBrands] = useState<BrandResponse[]>([]);
  const [brandLoading, setBrandLoading] = useState(false);
  const [brandError, setBrandError] = useState<string | null>(null);
  const [brandSearch, setBrandSearch] = useState('');
  const [brandPanelMode, setBrandPanelMode] = useState<PanelMode>('create');
  const [brandSelected, setBrandSelected] = useState<BrandResponse | null>(null);
  const [brandForm, setBrandForm] = useState<BrandFormState>(emptyBrandForm());
  const [brandImageFile, setBrandImageFile] = useState<File | null>(null);
  const [brandImagePreviewUrl, setBrandImagePreviewUrl] = useState<string | null>(null);
  
  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const brandFileInputRef = useRef<HTMLInputElement | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const categoryFileInputRef = useRef<HTMLInputElement | null>(null);

  const [brandFormErrors, setBrandFormErrors] = useState<BrandFormErrors>({});
  const [categoryFormErrors, setCategoryFormErrors] = useState<CategoryFormErrors>({});
  const [brandSaving, setBrandSaving] = useState(false);
  const [categorySaving, setCategorySaving] = useState(false);
  const [brandStatusUpdatingId, setBrandStatusUpdatingId] = useState<string | null>(null);
  const [categoryStatusUpdatingId, setCategoryStatusUpdatingId] = useState<string | null>(null);

  const [categorySearchActive, setCategorySearchActive] = useState(false);
  const [categorySearchResults, setCategorySearchResults] = useState<CategoryResponse[]>([]);
  const [categorySearchLoading, setCategorySearchLoading] = useState(false);

  const [brandSearchActive, setBrandSearchActive] = useState(false);
  const [brandSearchResults, setBrandSearchResults] = useState<BrandResponse[]>([]);
  const [brandSearchLoading, setBrandSearchLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (brandImagePreviewUrl) {
        URL.revokeObjectURL(brandImagePreviewUrl);
      }
    };
  }, [brandImagePreviewUrl]);

  useEffect(() => {
    return () => {
      if (categoryImagePreviewUrl) {
        URL.revokeObjectURL(categoryImagePreviewUrl);
      }
    };
  }, [categoryImagePreviewUrl]);
useEffect(() => {
    if (brandModalOpen || categoryModalOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }

    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [brandModalOpen, categoryModalOpen]);

  const resetBrandImageDraft = () => {
    setBrandImageFile(null);
    setBrandImagePreviewUrl(null);
    if (brandFileInputRef.current) {
      brandFileInputRef.current.value = '';
    }
  };

  const resetCategoryImageDraft = () => {
    setCategoryImageFile(null);
    setCategoryImagePreviewUrl(null);
    if (categoryFileInputRef.current) {
      categoryFileInputRef.current.value = '';
    }
  };

  const clearBrandImage = () => {
    resetBrandImageDraft();
    setBrandForm((current) => ({ ...current, logoUrl: '' }));
  };

  const clearCategoryImage = () => {
    resetCategoryImageDraft();
    setCategoryForm((current) => ({ ...current, imageUrl: '' }));
  };

  const selectBrandImage = (file: File | null) => {
    if (!file) {
      return;
    }

    setBrandImageFile(file);
    setBrandImagePreviewUrl(URL.createObjectURL(file));
    setBrandFormErrors((current) => ({ ...current, logo: undefined }));
  };

  const selectCategoryImage = (file: File | null) => {
    if (!file) {
      return;
    }

    setCategoryImageFile(file);
    setCategoryImagePreviewUrl(URL.createObjectURL(file));
    setCategoryFormErrors((current) => ({ ...current, image: undefined }));
  };

  const getBrandImageSource = () => brandImagePreviewUrl || brandForm.logoUrl;

  const getCategoryImageSource = () => categoryImagePreviewUrl || (categoryForm as CategoryFormState).imageUrl;

  const loadProducts = async (
    page = productPage,
    brandId = appliedBrandId,
    categoryId = appliedCategoryId,
    sort = appliedSort,
    keyword = appliedSearch,
  ) => {
    try {
      setProductLoading(true);
      setProductError(null);

      const params: Record<string, unknown> = {
        page,
        size: 12,
        sort,
      };

      if (brandId) {
        params.brandId = brandId;
      }

      if (categoryId) {
        params.categoryId = categoryId;
      }

      const trimmedKeyword = keyword.trim();
      if (trimmedKeyword) {
        params.keyword = trimmedKeyword;
      }

      const response = await productManagementApi.getAllProducts(params);
      setProducts((response.content || []) as ProductCardRow[]);
      setProductTotalPages(response.totalPages || 0);
      setProductTotalElements(response.totalElements || 0);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Không thể tải danh sách sản phẩm.';
      setProductError(message);
    } finally {
      setProductLoading(false);
    }
  };

  const loadProductOverview = async () => {
    try {
      const response = await productManagementApi.getProductOverview();
      setProductOverview(response);
    } catch (requestError) {
      setProductOverview(null);
    }
  };

  const loadCategories = async () => {
    try {
      setCategoryLoading(true);
      setCategoryError(null);

      const response = await categoryApi.getCategoryPage({ page: 0, size: 100, sort: 'name,asc' });
      setCategories(response.content || []);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Không thể tải danh sách category.';
      setCategoryError(message);
    } finally {
      setCategoryLoading(false);
    }
  };

  const loadBrands = async () => {
    try {
      setBrandLoading(true);
      setBrandError(null);

      const response = await brandApi.getBrandPage({ page: 0, size: 100, sort: 'name,asc' });
      setBrands(response.content || []);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Không thể tải danh sách brand.';
      setBrandError(message);
    } finally {
      setBrandLoading(false);
    }
  };

  const loadBrandSummaries = async () => {
    try {
      const response = await brandApi.getBrandSummaries();
      setBrandSummaries(response || []);
    } catch (requestError) {
      setBrandSummaries([]);
    }
  };

  const loadCategorySummaries = async () => {
    try {
      const response = await categoryApi.getCategorySummaries();
      setCategorySummaries(response || []);
    } catch (requestError) {
      setCategorySummaries([]);
    }
  };

  useEffect(() => {
    void loadBrandSummaries();
    void loadCategorySummaries();
    void loadProductOverview();
  }, []);

  useEffect(() => {
    if (activeTab === 'categories' && categories.length === 0 && !categoryLoading) {
      void loadCategories();
    }
    if (activeTab === 'brands' && brands.length === 0 && !brandLoading) {
      void loadBrands();
    }
  }, [activeTab, categories.length, brands.length, categoryLoading, brandLoading]);

  useEffect(() => {
    void loadProducts(productPage, appliedBrandId, appliedCategoryId, appliedSort, appliedSearch);
  }, [productPage, appliedBrandId, appliedCategoryId, appliedSort, appliedSearch]);

  const openCreateCategory = () => {
    setCategoryPanelMode('create');
    setCategorySelected(null);
    setCategoryForm(emptyCategoryForm());
    resetCategoryImageDraft();
    setCategoryFormErrors({});
    setCategoryModalOpen(true);
  };

  const openCategoryView = (category: CategoryResponse) => {
    setCategoryPanelMode('view');
    setCategorySelected(category);
    setCategoryForm({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      imageUrl: category.imageUrl || '',
      parentId: category.parentId || '',
      isActive: category.isActive,
    });
    resetCategoryImageDraft();
  };

  const openCategoryEdit = (category: CategoryResponse) => {
    setCategoryPanelMode('edit');
    setCategorySelected(category);
    setCategoryForm({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      imageUrl: category.imageUrl || '',
      parentId: category.parentId || '',
      isActive: category.isActive,
    });
    resetCategoryImageDraft();
    setCategoryFormErrors({});
    setCategoryModalOpen(true);
  };

  const openCreateBrand = () => {
    setBrandPanelMode('create');
    setBrandSelected(null);
    setBrandForm(emptyBrandForm());
    resetBrandImageDraft();
    setBrandFormErrors({});
    setBrandModalOpen(true);
  };

  const openBrandView = (brand: BrandResponse) => {
    setBrandPanelMode('view');
    setBrandSelected(brand);
    setBrandForm({
      name: brand.name,
      slug: brand.slug,
      description: brand.description || '',
      logoUrl: brand.logoUrl || '',
      originCountry: brand.originCountry || '',
      websiteUrl: brand.websiteUrl || '',
      isActive: brand.isActive,
    });
    resetBrandImageDraft();
  };

  const openBrandEdit = (brand: BrandResponse) => {
    setBrandPanelMode('edit');
    setBrandSelected(brand);
    setBrandForm({
      name: brand.name,
      slug: brand.slug,
      description: brand.description || '',
      logoUrl: brand.logoUrl || '',
      originCountry: brand.originCountry || '',
      websiteUrl: brand.websiteUrl || '',
      isActive: brand.isActive,
    });
    resetBrandImageDraft();
    setBrandFormErrors({});
    setBrandModalOpen(true);
  };

  const closeCategoryView = () => {
    setCategoryPanelMode('create');
    setCategorySelected(null);
    setCategoryForm(emptyCategoryForm());
    resetCategoryImageDraft();
    setCategoryFormErrors({});
  };

  const closeBrandView = () => {
    setBrandPanelMode('create');
    setBrandSelected(null);
    setBrandForm(emptyBrandForm());
    resetBrandImageDraft();
    setBrandFormErrors({});
  };

  

  const submitBrand = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const errors: BrandFormErrors = {};
    if (!brandForm.name.trim()) {
      errors.name = 'Tên brand không được để trống.';
    }
    const hasBrandImage = Boolean(brandImageFile) || Boolean(trimOrUndefined(brandForm.logoUrl));
    if (!hasBrandImage) {
      errors.logo = 'Vui lòng tải logo brand.';
    }
    if (errors.name || errors.logo) {
      setBrandFormErrors(errors);
      toast.error(errors.name || errors.logo || 'Vui lòng kiểm tra thông tin.');
      return;
    }
    setBrandFormErrors({});

    try {
      setBrandSaving(true);
      const resolvedLogoUrl = brandImageFile
        ? (await uploadSingleMedia(brandImageFile, 'AVATAR')).url
        : trimOrUndefined(brandForm.logoUrl);

      const payload: BrandRequest = {
        name: brandForm.name.trim(),
        slug: brandForm.slug.trim(),
        description: trimOrUndefined(brandForm.description),
        logoUrl: resolvedLogoUrl,
        originCountry: trimOrUndefined(brandForm.originCountry),
        websiteUrl: trimOrUndefined(brandForm.websiteUrl),
        isActive: brandForm.isActive,
      };

      if (brandPanelMode === 'edit' && brandSelected) {
        const updated = await brandApi.updateBrand(brandSelected.id, payload);
        setBrands((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        setBrandSelected(updated);
        setBrandForm({
          name: updated.name,
          slug: updated.slug,
          description: updated.description || '',
          logoUrl: updated.logoUrl || '',
          originCountry: updated.originCountry || '',
          websiteUrl: updated.websiteUrl || '',
          isActive: updated.isActive,
        });
        resetBrandImageDraft();
        setBrandPanelMode('view');
        toast.success('Đã cập nhật brand.');
        if (brandModalOpen) setBrandModalOpen(false);
      } else {
        const created = await brandApi.createBrand(payload);
        setBrands((current) => [created, ...current]);
        setBrandSelected(created);
        setBrandForm({
          name: created.name,
          slug: created.slug,
          description: created.description || '',
          logoUrl: created.logoUrl || '',
          originCountry: created.originCountry || '',
          websiteUrl: created.websiteUrl || '',
          isActive: created.isActive,
        });
        resetBrandImageDraft();
        setBrandPanelMode('view');
        toast.success('Đã tạo brand mới.');
        if (brandModalOpen) setBrandModalOpen(false);
      }
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Không thể lưu brand.';
      toast.error(message);
    } finally {
      setBrandSaving(false);
    }
  };

  const submitCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const errors: CategoryFormErrors = {};
    if (!(categoryForm as CategoryFormState).name.trim()) {
      errors.name = 'Tên danh mục không được để trống.';
    }
    const hasCategoryImage =
      Boolean(categoryImageFile) || Boolean(trimOrUndefined((categoryForm as CategoryFormState).imageUrl));
    if (!hasCategoryImage) {
      errors.image = 'Vui lòng tải ảnh danh mục.';
    }
    if (errors.name || errors.image) {
      setCategoryFormErrors(errors);
      toast.error(errors.name || errors.image || 'Vui lòng kiểm tra thông tin.');
      return;
    }
    setCategoryFormErrors({});

    try {
      setCategorySaving(true);
      const resolvedImageUrl = categoryImageFile
        ? (await uploadSingleMedia(categoryImageFile, 'PRODUCT')).url
        : trimOrUndefined((categoryForm as CategoryFormState).imageUrl);

      const payload = {
        name: (categoryForm as CategoryFormState).name.trim(),
        slug: (categoryForm as CategoryFormState).slug.trim(),
        description: trimOrUndefined((categoryForm as CategoryFormState).description),
        imageUrl: resolvedImageUrl,
        parentId: (categoryForm as CategoryFormState).parentId || undefined,
        isActive: (categoryForm as CategoryFormState).isActive,
      } satisfies CategoryRequest;

      if (categoryPanelMode === 'edit' && categorySelected) {
        const updated = await categoryApi.updateCategory(categorySelected.id, payload);
        setCategories((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        setCategorySelected(updated);
        setCategoryForm({
          name: updated.name,
          slug: updated.slug,
          description: updated.description || '',
          imageUrl: updated.imageUrl || '',
          parentId: updated.parentId || '',
          isActive: updated.isActive,
        });
        resetCategoryImageDraft();
        setCategoryPanelMode('view');
        toast.success('Đã cập nhật category.');
        if (categoryModalOpen) setCategoryModalOpen(false);
      } else {
        const created = await categoryApi.createCategory(payload);
        setCategories((current) => [created, ...current]);
        setCategorySelected(created);
        setCategoryForm({
          name: created.name,
          slug: created.slug,
          description: created.description || '',
          imageUrl: created.imageUrl || '',
          parentId: created.parentId || '',
          isActive: created.isActive,
        });
        resetCategoryImageDraft();
        setCategoryPanelMode('view');
        toast.success('Đã tạo category mới.');
        if (categoryModalOpen) setCategoryModalOpen(false);
      }
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Không thể lưu category.';
      toast.error(message);
    } finally {
      setCategorySaving(false);
    }
  };

  const toggleCategoryStatus = async (category: CategoryResponse) => {
    const payload: CategoryStatusRequest = { isActive: !category.isActive };

    try {
      setCategoryStatusUpdatingId(category.id);
      await categoryApi.updateCategoryStatus(category.id, payload);
      const updated = { ...category, isActive: payload.isActive };
      setCategories((current) => current.map((item) => (item.id === category.id ? updated : item)));
      if (categorySelected?.id === category.id) {
        setCategorySelected(updated);
        setCategoryForm((current) => ({ ...current, isActive: payload.isActive }));
      }
      toast.success(payload.isActive ? 'Đã hiển thị category.' : 'Đã ẩn category.');
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Không thể thay đổi trạng thái category.';
      toast.error(message);
    } finally {
      setCategoryStatusUpdatingId(null);
    }
  };

  const toggleBrandStatus = async (brand: BrandResponse) => {
    const payload: BrandStatusRequest = { isActive: !brand.isActive };

    try {
      setBrandStatusUpdatingId(brand.id);
      const updated = await brandApi.updateBrandStatus(brand.id, payload);
      setBrands((current) => current.map((item) => (item.id === brand.id ? updated : item)));
      if (brandSelected?.id === brand.id) {
        setBrandSelected(updated);
        setBrandForm((current) => ({ ...current, isActive: updated.isActive }));
      }
      toast.success(payload.isActive ? 'Đã hiển thị brand.' : 'Đã ẩn brand.');
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Không thể thay đổi trạng thái brand.';
      toast.error(message);
    } finally {
      setBrandStatusUpdatingId(null);
    }
  };

  const toggleProductStatus = async (product: ProductCardRow) => {
    const payload = { isActive: !product.isActive };

    try {
      setStatusUpdatingProductId(product.id);
      const updated = await productManagementApi.changeProductStatus(product.id, payload);
      setProducts((current) => current.map((item) => (item.id === updated.id ? { ...item, isActive: updated.isActive } : item)));
      void loadProductOverview();
      toast.success(updated.isActive ? 'Đã hiển thị product.' : 'Đã ẩn product.');
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Không thể thay đổi trạng thái product.';
      toast.error(message);
    } finally {
      setStatusUpdatingProductId(null);
    }
  };

  const onBrandFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    selectBrandImage(file);
    event.target.value = '';
  };



  const openBrandFilePicker = () => brandFileInputRef.current?.click();
  const openCategoryFilePicker = () => categoryFileInputRef.current?.click();

  const handleBrandFilterChange = (value: string) => {
    setSelectedBrandId(value);
  };

  const handleCategoryFilterChange = (value: string) => {
    setSelectedCategoryId(value);
  };

  const handleSortChange = (value: string) => {
    setSelectedSort(value);
  };

  const handleSearchChange = (value: string) => {
    setProductSearch(value);
  };

  const handleApplyFilters = () => {
    setAppliedBrandId(selectedBrandId);
    setAppliedCategoryId(selectedCategoryId);
    setAppliedSort(selectedSort);
    setAppliedSearch(productSearch.trim());
    setProductPage(0);
  };

  const handleClearFilters = () => {
    setSelectedBrandId('');
    setSelectedCategoryId('');
    setSelectedSort('createdAt,desc');
    setProductSearch('');
    setAppliedBrandId('');
    setAppliedCategoryId('');
    setAppliedSort('createdAt,desc');
    setAppliedSearch('');
    setProductPage(0);
  };

  const handlePageChange = (page: number) => {
    setProductPage(page);
  };

  const handleCategorySearchSubmit = async () => {
    const keyword = categorySearch.trim();
    if (!keyword) {
      setCategorySearchActive(false);
      setCategorySearchResults([]);
      return;
    }

    try {
      setCategorySearchLoading(true);
      const results = await categoryApi.searchCategories(keyword);
      setCategorySearchResults(Array.isArray(results) ? results : []);
      setCategorySearchActive(true);
    } catch (requestError) {
      setCategorySearchResults([]);
      setCategorySearchActive(true);
    } finally {
      setCategorySearchLoading(false);
    }
  };

  const handleCategorySearchClear = () => {
    setCategorySearch('');
    setCategorySearchActive(false);
    setCategorySearchResults([]);
  };

  const handleBrandSearchSubmit = async () => {
    const keyword = brandSearch.trim();
    if (!keyword) {
      setBrandSearchActive(false);
      setBrandSearchResults([]);
      return;
    }

    try {
      setBrandSearchLoading(true);
      const results = await brandApi.searchBrands(keyword);
      setBrandSearchResults(Array.isArray(results) ? results : []);
      setBrandSearchActive(true);
    } catch (requestError) {
      setBrandSearchResults([]);
      setBrandSearchActive(true);
    } finally {
      setBrandSearchLoading(false);
    }
  };

  const handleBrandSearchClear = () => {
    setBrandSearch('');
    setBrandSearchActive(false);
    setBrandSearchResults([]);
  };

  const filteredCategories = useMemo(
    () => (categorySearchActive ? categorySearchResults : categories),
    [categories, categorySearchActive, categorySearchResults],
  );

  const filteredBrands = useMemo(
    () => (brandSearchActive ? brandSearchResults : brands),
    [brands, brandSearchActive, brandSearchResults],
  );

  // react-select country options for brand origin
  const countryOptions = useMemo(() => {
    try {
      return countryList().getData();
    } catch (err) {
      return [] as { value: string; label: string }[];
    }
  }, []);

  const parentCategoryOptions = useMemo(() => {
    return categories.map((c) => ({ value: c.id, label: c.name }));
  }, [categories]);

  const reactSelectStyles = useMemo(() => ({
    control: (base: any) => ({
      ...base,
      borderRadius: 8,
      borderColor: '#cbd5e1', // slate-300
      minHeight: 44,
      paddingLeft: 8,
      paddingRight: 8,
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#f59e0b', // amber-500
      },
    }),
    menu: (base: any) => ({ ...base, zIndex: 60 }),
    singleValue: (base: any) => ({ ...base, color: '#0f172a' }),
  }), []);

  

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[32px] border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <h1 className="m-0 mt-2 text-2xl font-extrabold tracking-tight text-slate-900">Quản lý thông tin sản phẩm, danh mục, thương hiệu</h1>
        </div>

        <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2">
          <button type="button" onClick={() => { setActiveTab('products'); setViewingProduct(null); }}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${tabStyles(activeTab === 'products')}`}>
            <Package2 size={16} />
            Sản phẩm
          </button>
          <button type="button" onClick={() => { setActiveTab('categories'); setViewingProduct(null); }}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${tabStyles(activeTab === 'categories')}`}>
            <LayoutGrid size={16} />
            Danh mục
          </button>
          <button type="button" onClick={() => { setActiveTab('brands'); setViewingProduct(null); }}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${tabStyles(activeTab === 'brands')}`}>
            <BadgeCheck size={16} />
            Thương hiệu
          </button>
        </div>
      </div>

      {activeTab === 'products' ? (
        viewingProduct ? (
          <AdminProductDetail
            slug={viewingProduct.slug}
            productId={viewingProduct.productId}
            onBack={() => setViewingProduct(null)}
          />
        ) : (
          <ProductsTab
            products={products}
            overview={productOverview}
            loading={productLoading}
            error={productError}
            currentPage={productPage}
            totalPages={productTotalPages}
            totalElements={productTotalElements}
            searchValue={productSearch}
            brandOptions={brandSummaries}
            categoryOptions={categorySummaries}
            selectedBrandId={selectedBrandId}
            selectedCategoryId={selectedCategoryId}
            selectedSort={selectedSort}
            statusUpdatingProductId={statusUpdatingProductId}
            onBrandChange={handleBrandFilterChange}
            onCategoryChange={handleCategoryFilterChange}
            onSortChange={handleSortChange}
            onSearchChange={handleSearchChange}
            onApplyFilters={handleApplyFilters}
            onClearFilters={handleClearFilters}
            onPageChange={handlePageChange}
            onToggleStatus={toggleProductStatus}
            onView={(product) => setViewingProduct({ slug: product.slug, productId: product.id })}
          />
        )
      ) : null}

      {activeTab === 'categories' ? (
        <CategoryPanel
          categories={categories}
          loading={categoryLoading}
          error={categoryError}
          search={categorySearch}
          setSearch={setCategorySearch}
          filteredCategories={filteredCategories}
          selectedCategory={categorySelected}
          panelMode={categoryPanelMode}
          searchActive={categorySearchActive}
          searchLoading={categorySearchLoading}
          onSearchSubmit={handleCategorySearchSubmit}
          onSearchClear={handleCategorySearchClear}
          onCreateNew={openCreateCategory}
          onEdit={openCategoryEdit}
          onView={openCategoryView}
          onCloseView={closeCategoryView}
          onToggleStatus={toggleCategoryStatus}
          statusUpdatingId={categoryStatusUpdatingId}
        />
      ) : null}

      {activeTab === 'brands' ? (
        <BrandPanel
          brands={brands}
          loading={brandLoading}
          error={brandError}
          search={brandSearch}
          setSearch={setBrandSearch}
          filteredBrands={filteredBrands}
          selectedBrand={brandSelected}
          panelMode={brandPanelMode}
          searchActive={brandSearchActive}
          searchLoading={brandSearchLoading}
          onSearchSubmit={handleBrandSearchSubmit}
          onSearchClear={handleBrandSearchClear}
          onCreateNew={openCreateBrand}
          onEdit={openBrandEdit}
          onView={openBrandView}
          onCloseView={closeBrandView}
          onToggleStatus={toggleBrandStatus}
          statusUpdatingId={brandStatusUpdatingId}
        />
      ) : null}
      {/* ================= MODAL BRAND ================= */}
      {brandModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="relative mx-4 w-full max-w-4xl rounded-xl bg-white p-6 shadow-2xl">
            {/* Nút đóng dấu X lớn bo tròn ở góc phải trên */}
            <button 
              type="button" 
              onClick={() => setBrandModalOpen(false)} 
              aria-label="Đóng"
              className="absolute -top-3 -right-3 z-50 inline-flex h-8 w-8 items-center justify-center rounded-full bg-rose-600 text-white transition hover:bg-rose-700 active:scale-95 shadow-md border border-rose-500"
            >
              <X size={16} strokeWidth={3} />
            </button>

            <form onSubmit={submitBrand} className="grid grid-cols-1 md:grid-cols-12 gap-8">
              
              {/* CỘT TRÁI: Logo Brand */}
              <div className="md:col-span-5 grid gap-6 content-start">
                <div>
                 
                  <h3 className="m-0 mt-1 text-xl font-extrabold text-slate-900">
                    {brandPanelMode === 'edit' ? 'Chỉnh sửa brand' : 'Tạo brand'}
                  </h3>
                </div>
                
                <div className="w-full aspect-square">
                  
                  <div className="relative mt-2 h-[calc(100%-28px)] w-full">
                    <input ref={brandFileInputRef} type="file" accept="image/*" onChange={onBrandFileInput} className="hidden" />
                    {getBrandImageSource() ? (
                      <div className={`group relative h-full w-full overflow-hidden rounded-lg border bg-slate-50 ${brandFormErrors.logo ? 'border-rose-500' : 'border-slate-300'}`}>
                        <img src={getBrandImageSource()} alt="logo" className="h-full w-full object-contain p-4" />
                        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                          <button type="button" onClick={openBrandFilePicker} className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-slate-900 shadow-sm">Thay đổi</button>
                          <button type="button" onClick={clearBrandImage} className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm">Xóa</button>
                        </div>
                      </div>
                    ) : (
                      <div onClick={openBrandFilePicker} className={`flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-slate-50 p-4 text-center transition ${brandFormErrors.logo ? 'border-rose-500 hover:border-rose-600' : 'border-slate-400 hover:border-amber-500'}`}>
                        <p className="text-sm text-slate-500">Tải logo lên</p>
                      </div>
                    )}
                  </div>
                  {brandFormErrors.logo ? (
                    <p className="mt-2 text-xs font-semibold text-rose-600">{brandFormErrors.logo}</p>
                  ) : null}
                </div>
              </div>

              {/* CỘT PHẢI: Thông tin nhập liệu Brand */}
              <div className="md:col-span-7 grid gap-5">
                <div className="grid gap-2">
                  <FieldLabel>Tên brand</FieldLabel>
                  <input
                    placeholder="Ví dụ: L'Oréal Paris"
                    value={brandForm.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setBrandForm((c) => ({ ...c, name, slug: brandPanelMode === 'create' ? slugify(name) : c.slug }));
                      if (brandFormErrors.name) {
                        setBrandFormErrors((current) => ({ ...current, name: undefined }));
                      }
                    }}
                    style={{ border: brandFormErrors.name ? '1px solid #f43f5e' : '1px solid black' }}
                    className={`w-full rounded-lg border p-3 text-sm outline-none transition placeholder:text-slate-400 ${brandFormErrors.name ? '!border-rose-500 focus:border-rose-600 focus:ring-1 focus:ring-rose-500' : '!border-black focus:border-amber-600 focus:ring-1 focus:ring-amber-600'}`}
                  />
                  {brandFormErrors.name ? (
                    <p className="m-0 text-xs font-semibold text-rose-600">{brandFormErrors.name}</p>
                  ) : null}
                </div>

                <div className="grid gap-2">
                  <FieldLabel>Slug (tự động)</FieldLabel>
                  <div className="w-full rounded-lg border border-slate-300 bg-slate-100 p-3 text-sm text-slate-600 font-mono">
                    {brandForm.slug || <span className="italic text-slate-400">Tự động sinh...</span>}
                  </div>
                </div>

                <div className="grid gap-2">
                  <FieldLabel>Mô tả</FieldLabel>
                  <textarea 
                    rows={3} 
                    value={brandForm.description} 
                    onChange={(e) => setBrandForm((c) => ({ ...c, description: e.target.value }))} 
                    style={{ border: '1px solid black' }}
                    className="w-full rounded-lg border border-slate-400 p-3 text-sm focus:border-amber-600 focus:ring-1 focus:ring-amber-600 outline-none transition" 
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <FieldLabel>Quốc gia</FieldLabel>
                    <Select
                      options={countryOptions}
                      value={countryOptions.find((o: any) => o.label === brandForm.originCountry) || null}
                      onChange={(opt: any) => setBrandForm((c) => ({ ...c, originCountry: opt?.label || '' }))}
                      isClearable
                      placeholder="Chọn quốc gia"
                      styles={{
                        ...reactSelectStyles,
                        control: (base: any) => ({ ...base, borderColor: '#94a3b8', padding: '4px' })
                      }}
                      className="w-full"
                    />
                  </div>

                  <div className="grid gap-2">
                    <FieldLabel>Website</FieldLabel>
                    <input 
                      value={brandForm.websiteUrl} 
                      onChange={(e) => setBrandForm((c) => ({ ...c, websiteUrl: e.target.value }))} 
                      placeholder="https://example.com" 
                      style={{ border: '1px solid black' }}
                      className="w-full rounded-lg border border-slate-400 p-3 text-sm focus:border-amber-600 focus:ring-1 focus:ring-amber-600 outline-none transition placeholder:text-slate-400" 
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setBrandModalOpen(false)} disabled={brandSaving} className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800">Hủy</button>
                  <button type="submit" disabled={brandSaving} className="bg-amber-600 hover:bg-amber-700 px-6 py-2.5 rounded-lg text-sm font-bold text-white transition disabled:opacity-60 disabled:cursor-not-allowed">
                    {brandSaving ? 'Đang lưu...' : (brandPanelMode === 'edit' ? 'Lưu thay đổi' : 'Tạo brand')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}


      {/* ================= MODAL CATEGORY ================= */}
      {categoryModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="relative mx-4 w-full max-w-4xl rounded-xl bg-white p-6 shadow-2xl"> 
            {/* Nút đóng dấu X lớn bo tròn ở góc phải trên */}
            <button 
              type="button" 
              onClick={() => setCategoryModalOpen(false)} 
              aria-label="Đóng"
              className="absolute -top-3 -right-3 z-50 inline-flex h-8 w-8 items-center justify-center rounded-full bg-rose-600 text-white transition hover:bg-rose-700 active:scale-95 shadow-md border border-rose-500"
            >
              <X size={16} strokeWidth={3} />
            </button>

            <form onSubmit={submitCategory}  className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              
              {/* CỘT TRÁI: Ảnh & Trạng thái */}
              <div className="md:col-span-5 grid gap-6 content-start">
                <div>
                  <h3 className="m-0 mt-1 text-xl font-extrabold text-slate-900">
                    {categoryPanelMode === 'edit' ? 'Chỉnh sửa' : 'Tạo mới'}
                  </h3>
                </div>
                
                <div className="w-full ">
                  <div className="relative h-full w-full">
                    <input ref={categoryFileInputRef} type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0] || null; selectCategoryImage(file); e.target.value = ''; }} className="hidden" />
                    {getCategoryImageSource() ? (
                      <div className={`group relative h-full w-full overflow-hidden rounded-lg border bg-slate-50 ${categoryFormErrors.image ? 'border-rose-500' : 'border-slate-300'}`}>
                        <img src={getCategoryImageSource()} alt="category" className="h-full w-full object-contain p-2" />
                        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                          <button type="button" onClick={openCategoryFilePicker} className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-slate-900 shadow-sm">Thay đổi</button>
                          <button type="button" onClick={clearCategoryImage} className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm">Xóa</button>
                        </div>
                      </div>
                    ) : (
                      <div onClick={openCategoryFilePicker} className={`flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-slate-50 p-4 text-center transition ${categoryFormErrors.image ? 'border-rose-500 hover:border-rose-600' : 'border-slate-400 hover:border-amber-500'}`}>
                        <p className="text-sm text-slate-500">Tải ảnh lên</p>
                      </div>
                    )}
                  </div>
                  {categoryFormErrors.image ? (
                    <p className="mt-2 text-xs font-semibold text-rose-600">{categoryFormErrors.image}</p>
                  ) : null}
                </div>
              </div>

              {/* CỘT PHẢI: Thông tin nhập liệu Category */}
              <div className="md:col-span-7 grid gap-5">
                <div className="grid gap-2">
                  <FieldLabel>Tên danh mục</FieldLabel>
                  <input
                    value={(categoryForm as CategoryFormState).name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setCategoryForm((c) => ({ ...(c as CategoryFormState), name, slug: categoryPanelMode === 'create' ? slugify(name) : (c as CategoryFormState).slug }));
                      if (categoryFormErrors.name) {
                        setCategoryFormErrors((current) => ({ ...current, name: undefined }));
                      }
                    }}
                    style={{ border: categoryFormErrors.name ? '1px solid #f43f5e' : '1px solid black' }}
                    className={`w-full rounded-lg border p-3 text-sm outline-none transition ${categoryFormErrors.name ? '!border-rose-500 focus:border-rose-600 focus:ring-1 focus:ring-rose-500' : '!border-black focus:border-amber-600 focus:ring-1 focus:ring-amber-600'}`}
                  />
                  {categoryFormErrors.name ? (
                    <p className="m-0 text-xs font-semibold text-rose-600">{categoryFormErrors.name}</p>
                  ) : null}
                </div>

                <div className="grid gap-2">
                  <FieldLabel>Slug</FieldLabel>
                  <div className="w-full rounded-lg border border-slate-300 bg-slate-100 p-3 text-sm text-slate-600 font-mono">
                    {(categoryForm as CategoryFormState).slug || <span className="italic text-slate-400">Tự động sinh...</span>}
                  </div>
                </div>

                <div className="grid gap-2">
                  <FieldLabel>Mô tả</FieldLabel>
                  <textarea 
                    rows={3} 
                    value={(categoryForm as CategoryFormState).description} 
                    onChange={(e) => setCategoryForm((c) => ({ ...(c as CategoryFormState), description: e.target.value }))}
                    style={{ border: '1px solid black' }}
                    className="w-full rounded-lg border border-slate-400 p-3 text-sm focus:border-amber-600 focus:ring-1 focus:ring-amber-600 outline-none transition" 
                  />
                </div>

                <div className="grid gap-2">
                  <FieldLabel>Danh mục cha</FieldLabel>
                  <Select 
                    options={parentCategoryOptions}
                    value={parentCategoryOptions.find((o: any) => o.value === (categoryForm as CategoryFormState).parentId) || null}
                    onChange={(opt: any) => setCategoryForm((c) => ({ ...(c as CategoryFormState), parentId: opt?.value || '' }))}
                    isClearable
                    styles={{
                      ...reactSelectStyles,
                      control: (base: any) => ({ ...base, borderColor: '#94a3b8', padding: '4px' })
                    }}
                    placeholder="Chọn danh mục cha (nếu có)"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setCategoryModalOpen(false)} disabled={categorySaving} className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800">Hủy</button>
                  <button type="submit" disabled={categorySaving} className="bg-amber-600 hover:bg-amber-700 px-6 py-2.5 rounded-lg text-sm font-bold text-white transition disabled:opacity-60 disabled:cursor-not-allowed">{categorySaving ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}

    </div>
  );
};
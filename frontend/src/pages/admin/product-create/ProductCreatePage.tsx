import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Flame, Leaf } from 'lucide-react';
import { Controller, FormProvider, useForm, useWatch, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { skinConcernSuggestions, skinTypeSuggestions } from './productCreate.constants';
import { productCreateSchema, type ProductCreateFormValues } from './productCreate.schema';
import { SectionCard } from './components/SectionCard';
import { FieldShell } from './components/FieldShell';
import { TagInput } from './components/TagInput';
import { ProductVariantEditor } from './components/ProductVariantEditor';
import { ProductImageEditor } from './components/ProductImageEditor';
import { AutoGrowTextarea } from './components/AutoGrowTextarea';
import { productManagementApi } from '../../../api/admin/productManagementApi';
import { resolveMediaSourceUrl } from '../../../api/uploadApi';
import type { CatalogProductCreateRequest } from '../../../types/catalog';
import { brandApi } from '../../../api/brandApi';
import { categoryApi } from '../../../api/categoryApi';
import type { BrandSummaryResponse, CategorySummaryResponse } from '../../../types/catalog';

const inputClassName =
  'w-full h-11 box-border rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100';

const initialValues: ProductCreateFormValues = {
  name: '',
  slug: '',
  categoryId: '',
  brandId: '',
  description: '',
  ingredients: '',
  usageInstructions: '',
  suitableSkinTypes: [],
  skinConcerns: [],
  isActive: true,
  isFeatured: false,
  variants: [
    {
      sku: '',
      variantName: '',
      price: '',
      originalPrice: '',
      stockQuantity: '',
      imageUrl: '',
      isActive: true,
    },
  ],
  images: [],
};

const formatCurrency = (value: string) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 'Liên hệ';
  }

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(parsed);
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const toNumber = (value: string, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toOptionalNumber = (value: string) => {
  if (!value || !value.trim()) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const ProductCreatePage = () => {
  const navigate = useNavigate();
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<CategorySummaryResponse[]>([]);
  const [brandOptions, setBrandOptions] = useState<BrandSummaryResponse[]>([]);
  const [isCatalogOptionsLoading, setIsCatalogOptionsLoading] = useState(false);

  const form = useForm<ProductCreateFormValues>({
    resolver: zodResolver(productCreateSchema),
    defaultValues: initialValues,
    mode: 'onChange',
  });

  useEffect(() => {
    let active = true;

    const loadCatalogOptions = async () => {
      setIsCatalogOptionsLoading(true);

      try {
        const [categorySummaries, brandSummaries] = await Promise.all([
          categoryApi.getCategorySummaries(),
          brandApi.getBrandSummaries(),
        ]);

        if (!active) {
          return;
        }

        setCategoryOptions(categorySummaries);
        setBrandOptions(brandSummaries);
      } catch (error) {
        if (active) {
          toast.error('Không thể tải danh mục hoặc thương hiệu thật từ hệ thống.');
        }
      } finally {
        if (active) {
          setIsCatalogOptionsLoading(false);
        }
      }
    };

    void loadCatalogOptions();

    return () => {
      active = false;
    };
  }, []);

  const watchedValues = useWatch({ control: form.control });

  useEffect(() => {
    if (isSlugManuallyEdited) {
      return;
    }

    const autoSlug = slugify(watchedValues.name || '');
    form.setValue('slug', autoSlug, { shouldDirty: false, shouldValidate: true });
  }, [form, isSlugManuallyEdited, watchedValues.name]);

  const selectedCategory = useMemo(
    () => categoryOptions.find((item) => item.id === watchedValues.categoryId),
    [categoryOptions, watchedValues.categoryId],
  );

  const selectedBrand = useMemo(
    () => brandOptions.find((item) => item.id === watchedValues.brandId),
    [brandOptions, watchedValues.brandId],
  );

  const variantPrices = (watchedValues.variants || [])
    .map((variant) => Number(variant.price))
    .filter((price) => Number.isFinite(price) && price > 0);

  const minPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : null;
  const maxPrice = variantPrices.length > 0 ? Math.max(...variantPrices) : null;
  const primaryImage = watchedValues.images?.find((item) => item.isPrimary) || watchedValues.images?.[0];

  const onSubmit: SubmitHandler<ProductCreateFormValues> = async (values) => {
    try {
      const [uploadedImages, uploadedVariants] = await Promise.all([
        Promise.all(
          values.images.map(async (image, index) => {
            const imageSource = image.url.trim();
            const resolvedImage = await resolveMediaSourceUrl(imageSource, 'PRODUCT', `${values.name}-image-${index + 1}`);

            return {
              url: resolvedImage.url,
              publicId: resolvedImage.key,
              altText: image.altText?.trim() || undefined,
              displayOrder: toNumber(image.displayOrder, index),
              isPrimary: image.isPrimary,
            };
          }),
        ),
        Promise.all(
          values.variants.map(async (variant, index) => {
            const imageSource = variant.imageUrl?.trim() || '';
            const resolvedVariantImage = imageSource
              ? await resolveMediaSourceUrl(imageSource, 'PRODUCT', `${values.name}-variant-${index + 1}`)
              : null;

            return {
              sku: variant.sku.trim(),
              variantName: variant.variantName.trim(),
              price: toNumber(variant.price),
              originalPrice: toOptionalNumber(variant.originalPrice),
              stockQuantity: toNumber(variant.stockQuantity),
              imageUrl: resolvedVariantImage?.url,
              isActive: variant.isActive,
            };
          }),
        ),
      ]);

      const payload: CatalogProductCreateRequest = {
        name: values.name.trim(),
        slug: values.slug.trim() || undefined,
        description: values.description.trim() || undefined,
        ingredients: values.ingredients.trim() || undefined,
        usageInstructions: values.usageInstructions.trim() || undefined,
        suitableSkinTypes: values.suitableSkinTypes.map((item) => item.trim()).filter(Boolean),
        skinConcerns: values.skinConcerns.map((item) => item.trim()).filter(Boolean),
        variants: uploadedVariants,
        images: uploadedImages,
        categoryId: values.categoryId,
        brandId: values.brandId,
        isActive: values.isActive,
        isFeatured: values.isFeatured,
      };

      await productManagementApi.createProduct(payload);

      toast.success('Đã thêm sản phẩm mới thành công.');
      navigate('/admin/products');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể thêm sản phẩm. Vui lòng thử lại.';
      toast.error(message);
    }
  };

  const variantCount = watchedValues.variants?.length || 0;
  const formChecklist = [
    { label: 'Tên sản phẩm', done: Boolean(watchedValues.name?.trim()) },
    { label: 'Danh mục', done: Boolean(selectedCategory) },
    { label: 'Thương hiệu', done: Boolean(selectedBrand) },
    { label: 'Ảnh đại diện', done: Boolean(primaryImage) },
    { label: 'Biến thể', done: variantCount > 0 },
  ];

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="relative grid gap-6 rounded-[32px] border border-slate-200 bg-[#f8f9fa] p-4 pb-28 shadow-[0_20px_55px_rgba(15,23,42,0.06)] lg:p-6 lg:pb-28">
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[32px]">
          <div className="absolute -left-20 top-16 h-52 w-52 rounded-full bg-amber-200/20 blur-3xl" />
          <div className="absolute right-[-40px] top-28 h-64 w-64 rounded-full bg-indigo-200/15 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-rose-200/15 blur-3xl" />
        </div>

        <header className="relative z-10 grid gap-4 rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_12px_30px_rgba(201,169,110,0.08)] lg:flex lg:items-end lg:justify-between">
          <div className="grid gap-3">
            <Link to="/admin/products" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900">
              <ArrowLeft size={16} />
              Quay lại danh sách sản phẩm
            </Link>

            <div>
              <h1 className="m-0 text-3xl font-bold text-slate-950" style={{ fontFamily: 'var(--font-display)' }}>
                Thêm sản phẩm mới
              </h1>
            </div>
          </div>

        </header>

        <div className="relative z-10 grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.8fr)]">
          <div className="grid gap-6">
            <SectionCard title="Thông tin cốt lõi">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="grid gap-5">
                  <FieldShell label="Tên sản phẩm" error={form.formState.errors.name?.message}>
                    <input style={{ border: '1px solid #8691a2' }} {...form.register('name')} className={inputClassName} placeholder="Nhập tên sản phẩm mới" />
                  </FieldShell>

                  <FieldShell
                    label="Slug"
                    error={form.formState.errors.slug?.message}
                    action={
                      isSlugManuallyEdited ? (
                        <button
                          type="button"
                          onClick={() => {
                            setIsSlugManuallyEdited(false);
                            form.setValue('slug', slugify(form.getValues('name')), { shouldDirty: true, shouldValidate: true });
                          }}
                          className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
                        >
                          Dùng slug tự động
                        </button>
                      ) : null
                    }
                  >
                    <input
                      {...form.register('slug', {
                        onChange: () => {
                          setIsSlugManuallyEdited(true);
                        },
                      })}
                      className={inputClassName}
                      placeholder="ten-san-pham-cua-ban"
                    />
                  </FieldShell>
                </div>

                <div className="grid gap-5">
                  <FieldShell label="Danh mục" error={form.formState.errors.categoryId?.message}>
                    <select style={{ border: '1px solid #8691a2' }} {...form.register('categoryId')} className={inputClassName} disabled={isCatalogOptionsLoading}>
                      <option value="">{isCatalogOptionsLoading ? 'Đang tải danh mục...' : 'Chọn danh mục từ hệ thống'}</option>
                      {categoryOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  </FieldShell>

                  <FieldShell label="Thương hiệu" error={form.formState.errors.brandId?.message}>
                    <select style={{ border: '1px solid #8691a2' }} {...form.register('brandId')} className={inputClassName} disabled={isCatalogOptionsLoading}>
                      <option value="">{isCatalogOptionsLoading ? 'Đang tải thương hiệu...' : 'Chọn thương hiệu từ hệ thống'}</option>
                      {brandOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  </FieldShell>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="inline-flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <input  {...form.register('isActive')} type="checkbox" className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                  <span>
                    <span className="block text-sm font-semibold text-slate-900">Đang kinh doanh</span>
                  </span>
                </label>

                <label className="inline-flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <input {...form.register('isFeatured')} type="checkbox" className="mt-1 h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500" />
                  <span>
                    <span className="block text-sm font-semibold text-slate-900">Sản phẩm nổi bật</span>
                  </span>
                </label>
              </div>
            </SectionCard>

            <SectionCard title="Mô tả và nội dung">
              <div className="grid gap-5">
                <FieldShell label="Mô tả" error={form.formState.errors.description?.message}>
                  <Controller
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <AutoGrowTextarea  style={{ border: '1px solid #8691a2' }}
                        {...field}
                        minHeight={140}
                        maxHeight={300}
                        className={inputClassName}
                        placeholder="Nhập mô tả sản phẩm"
                      />
                    )}
                  />
                </FieldShell>

                <FieldShell label="Thành phần" error={form.formState.errors.ingredients?.message}>
                  <Controller
                    control={form.control}
                    name="ingredients"
                    render={({ field }) => (
                      <AutoGrowTextarea  style={{ border: '1px solid #8691a2' }}
                        {...field}
                        minHeight={120}
                        maxHeight={280}
                        className={inputClassName}
                        placeholder="Nhập thành phần hoặc hoạt chất"
                      />
                    )}
                  />
                </FieldShell>

                <FieldShell label="Hướng dẫn sử dụng" error={form.formState.errors.usageInstructions?.message}>
                  <Controller
                  style={{ border: '1px solid #8691a2' }}
                    control={form.control}
                    name="usageInstructions" 
                    render={({ field }) => (
                      <AutoGrowTextarea  style={{ border: '1px solid black' }}
                        {...field}
                        minHeight={120}
                        maxHeight={280}
                        className={inputClassName}
                        placeholder="Nhập hướng dẫn sử dụng"
                      />
                    )}
                  />
                </FieldShell>
              </div>
            </SectionCard>

            <SectionCard title="Phân loại AI">
              <div className="grid gap-5" >
                <TagInput 
                  name="suitableSkinTypes"
                  label="Loại da phù hợp"
                  hint="Tối đa 8 mục, click chip để xoá"
                  placeholder="Ví dụ: Da dầu"
                  suggestions={skinTypeSuggestions}
                />

                <TagInput
                  name="skinConcerns"
                  label="Vấn đề da"
                  hint="Tối đa 8 mục, dùng để gợi ý AI"
                  placeholder="Ví dụ: Mụn"
                  suggestions={skinConcernSuggestions}
                />
              </div>
            </SectionCard>

            <ProductVariantEditor
              brandSource={selectedBrand?.slug || selectedBrand?.name || ''}
              lineSource={selectedCategory?.slug || selectedCategory?.name || ''}
            />
          </div>

          <aside className="grid gap-6 lg:sticky lg:top-6 lg:self-start">
            <SectionCard title="Ảnh sản phẩm">
              <ProductImageEditor />
            </SectionCard>

            <SectionCard title="Tổng quan giá">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="m-0 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Giá từ</p>
                  <p className="m-0 mt-1 text-lg font-bold text-slate-900">{minPrice !== null ? formatCurrency(String(minPrice)) : 'Liên hệ'}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="m-0 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Giá đến</p>
                  <p className="m-0 mt-1 text-lg font-bold text-slate-900">{maxPrice !== null ? formatCurrency(String(maxPrice)) : 'Liên hệ'}</p>
                </div>
              </div>

              
            </SectionCard>

            <SectionCard title="Danh sách kiểm tra">
              <div className="grid gap-3">
                {formChecklist.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <span className="text-sm font-medium text-slate-700">{item.label}</span>
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                        item.done ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {item.done ? <CheckCircle2 size={12} /> : <Leaf size={12} />}
                      {item.done ? 'Đã đủ' : 'Chưa đủ'}
                    </span>
                  </div>
                ))}
              </div>
            </SectionCard>

            

          </aside>
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur lg:left-[280px]">
          <div className="mx-auto flex max-w-[1800px] flex-wrap items-center justify-between gap-3 px-4 py-3 lg:px-8">
            <p className="m-0 text-sm text-slate-500">
              {form.formState.isValid ? 'Biểu mẫu hợp lệ, có thể lưu ngay.' : 'Biểu mẫu còn lỗi, kiểm tra các trường được tô đỏ.'}
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  form.reset(initialValues);
                  setIsSlugManuallyEdited(false);
                }}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Hủy thay đổi
              </button>

              <button
                type="submit"
                disabled={!form.formState.isValid || form.formState.isSubmitting}
                className="rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
              >
                {form.formState.isSubmitting ? 'Đang lưu...' : 'Thêm sản phẩm'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </FormProvider>
  );
};

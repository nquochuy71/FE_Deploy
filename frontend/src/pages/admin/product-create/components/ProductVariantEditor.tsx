import { useEffect, useRef } from 'react';
import { ImagePlus, Plus, Trash2 } from 'lucide-react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { FieldShell } from './FieldShell';
import type { ProductCreateFormValues } from '../productCreate.schema';

const inputClassName =
  'w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100';

const slugify = (value?: unknown) => {
  const str = typeof value === 'string' ? value : String(value ?? '');
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const compactToken = (value: string, fallback: string, length: number) => {
  const token = slugify(value).replace(/-/g, '').toUpperCase();
  return (token || fallback).slice(0, length);
};

const hashSeed = (value: string) => {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash.toString(36).toUpperCase();
};

const extractSizeCode = (value: string) => {
  const normalized = value.toUpperCase();
  const match = normalized.match(/(\d{1,4})(ML|G|T|P)\b/);

  return match ? `${match[1]}${match[2]}` : '00';
};

const generateSku = (brandSource: string, lineSource: string, productName: string, variantName: string, rowSeed: string) => {
  const brandCode = compactToken(brandSource, 'BR', 2);
  const lineCode = compactToken(lineSource, 'LN', 2);
  const typeCode = compactToken(productName, 'PR', 2);
  const variantCode = `${compactToken(variantName, 'VR', 3)}${hashSeed(rowSeed).slice(-3)}`.slice(0, 6);
  const sizeCode = extractSizeCode(variantName);

  return [brandCode, lineCode, typeCode, variantCode, sizeCode].join('-').toUpperCase().slice(0, 25);
};

type ProductVariantEditorProps = {
  brandSource: string;
  lineSource: string;
};

export const ProductVariantEditor = ({ brandSource, lineSource }: ProductVariantEditorProps) => {
  const fileRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const { control, register, formState, setValue } = useFormContext<ProductCreateFormValues>();
  const productName = useWatch({ control, name: 'name' }) || '';
  const variantValues = useWatch({ control, name: 'variants' }) || [];
  const { fields, append, remove } = useFieldArray({ control, name: 'variants' });
  const variantError = (formState.errors.variants as { message?: string } | undefined)?.message;

  useEffect(() => {
    fields.forEach((field, index) => {
      const variantName = variantValues[index]?.variantName || '';
      const nextSku = generateSku(brandSource, lineSource, productName, variantName, field.id);

      if (variantValues[index]?.sku !== nextSku) {
        setValue(`variants.${index}.sku`, nextSku, {
          shouldDirty: false,
          shouldValidate: true,
        });
      }
    });
  }, [brandSource, fields, lineSource, productName, setValue, variantValues]);

  const setVariantImage = (index: number, file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setValue(`variants.${index}.imageUrl`, previewUrl, { shouldDirty: true, shouldValidate: true });
  };

  return (
    <FieldShell
      label="Biến thể sản phẩm"
      error={variantError}
      action={
        <button
          type="button"
          onClick={() => {
            const nextIndex = fields.length;
            append({
              sku: generateSku(brandSource, lineSource, productName, '', `${productName}-${nextIndex + 1}`),
              variantName: '',
              price: '',
              originalPrice: '',
              stockQuantity: '',
              imageUrl: '',
              isActive: true,
            });
          }}
          className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
        >
          <Plus size={14} />
          Thêm biến thể
        </button>
      }
    >
      <div className="grid gap-4">
        {fields.map((field, index) => {
          const isRemovable = fields.length > 1;
          const variantItemError = formState.errors.variants?.[index];
          const variantImage = variantValues[index]?.imageUrl;

          return (
            <article key={field.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="m-0 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Biến thể {index + 1}</p>
                  <h4 className="m-0 mt-1 text-base font-bold text-slate-900">Thông tin biến thể</h4>
                </div>

                <button
                  type="button"
                  onClick={() => remove(index)}
                  disabled={!isRemovable}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  Xóa
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <FieldShell label="Tên biến thể" error={variantItemError?.variantName?.message}>
                  <input {...register(`variants.${index}.variantName`)} className={inputClassName} placeholder="Ví dụ: 30ml" />
                </FieldShell>

                <FieldShell
                  label="SKU"
                  hint="Tự sinh theo quy tắc hệ thống, chỉ hiển thị"
                  error={variantItemError?.sku?.message}
                >
                  <input {...register(`variants.${index}.sku`)} readOnly className={inputClassName} placeholder="SKU tự sinh" />
                </FieldShell>

                <FieldShell label="Tồn kho" error={variantItemError?.stockQuantity?.message}>
                  <input
                    {...register(`variants.${index}.stockQuantity`)}
                    type="text"
                    inputMode="numeric"
                    className={inputClassName}
                    placeholder="Nhập số lượng tồn kho"
                  />
                </FieldShell>

                <FieldShell label="Giá bán" error={variantItemError?.price?.message}>
                  <input
                    {...register(`variants.${index}.price`)}
                    type="text"
                    inputMode="decimal"
                    className={inputClassName}
                    placeholder="Nhập giá bán"
                  />
                </FieldShell>

                <FieldShell label="Giá gốc" error={variantItemError?.originalPrice?.message}>
                  <input
                    {...register(`variants.${index}.originalPrice`)}
                    type="text"
                    inputMode="decimal"
                    className={inputClassName}
                    placeholder="Nhập giá gốc nếu có"
                  />
                </FieldShell>

                <FieldShell label="Ảnh minh họa biến thể" error={variantItemError?.imageUrl?.message}>
                  <div className="grid gap-3">
                    <input
                      ref={(element) => {
                        fileRefs.current[index] = element;
                      }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (!file) {
                          return;
                        }
                        setVariantImage(index, file);
                        event.target.value = '';
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => fileRefs.current[index]?.click()}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        event.preventDefault();
                        const file = event.dataTransfer.files?.[0];
                        if (!file) {
                          return;
                        }
                        setVariantImage(index, file);
                      }}
                      className="group grid min-h-[116px] place-items-center rounded-2xl border-2 border-dashed border-slate-300 bg-white px-4 py-4 text-center transition hover:border-amber-300 hover:bg-amber-50"
                    >
                      <div className="grid place-items-center gap-2 text-slate-500">
                        <ImagePlus size={18} className="text-amber-700" />
                        <p className="m-0 text-xs font-semibold text-slate-700">Kéo thả ảnh hoặc bấm để tải lên</p>
                      </div>
                    </button>

                    {variantImage ? (
                      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                        <img src={variantImage} alt={`Ảnh biến thể ${index + 1}`} className="h-28 w-full object-cover" />
                      </div>
                    ) : null}
                  </div>
                </FieldShell>
              </div>

              <label className="mt-4 inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                <input {...register(`variants.${index}.isActive`)} type="checkbox" className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                Kích hoạt biến thể này
              </label>
            </article>
          );
        })}
      </div>
    </FieldShell>
  );
};

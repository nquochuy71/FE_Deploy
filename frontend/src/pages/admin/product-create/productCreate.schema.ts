import { z } from 'zod';

const requiredText = (label: string, max = 500) =>
  z.string().trim().min(1, `${label} là bắt buộc`).max(max, `${label} không được vượt quá ${max} ký tự`);

const optionalText = (max = 5000) => z.string().trim().max(max, `Không được vượt quá ${max} ký tự`);

const optionalSlug = z.union([
  z.literal(''),
  z
    .string()
    .trim()
    .max(500, 'Slug không được vượt quá 500 ký tự')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug chỉ được dùng chữ thường, số và dấu gạch ngang'),
]);

const positiveNumberText = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} là bắt buộc`)
    .refine((value) => Number.isFinite(Number(value)) && Number(value) > 0, `${label} phải lớn hơn 0`);

const nonNegativeIntegerText = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} là bắt buộc`)
    .refine((value) => Number.isFinite(Number(value)) && Number.isInteger(Number(value)) && Number(value) >= 0, `${label} phải là số nguyên không âm`);

const optionalUrlText = z.union([z.literal(''), z.string().trim().url('Đường dẫn hình ảnh không hợp lệ')]);

export const productVariantSchema = z.object({
  sku: requiredText('SKU', 100),
  variantName: requiredText('Tên biến thể', 255),
  price: positiveNumberText('Giá bán'),
  originalPrice: z.union([
    z.literal(''),
    z.string().trim().refine((value) => Number.isFinite(Number(value)) && Number(value) > 0, 'Giá gốc phải lớn hơn 0'),
  ]),
  stockQuantity: nonNegativeIntegerText('Tồn kho'),
  imageUrl: optionalUrlText,
  isActive: z.boolean(),
});

export const productImageSchema = z.object({
  url: requiredText('URL ảnh', 500).url('URL ảnh không hợp lệ'),
  altText: optionalText(500),
  displayOrder: nonNegativeIntegerText('Thứ tự hiển thị'),
  isPrimary: z.boolean(),
});

export const productCreateSchema = z
  .object({
    name: requiredText('Tên sản phẩm', 500),
    slug: optionalSlug,
    categoryId: z.string().uuid('Danh mục không hợp lệ'),
    brandId: z.string().uuid('Thương hiệu không hợp lệ'),
    description: optionalText(5000),
    ingredients: optionalText(3000),
    usageInstructions: optionalText(3000),
    suitableSkinTypes: z.array(requiredText('Loại da', 60)).max(8, 'Tối đa 8 loại da'),
    skinConcerns: z.array(requiredText('Vấn đề da', 60)).max(8, 'Tối đa 8 vấn đề da'),
    isActive: z.boolean(),
    isFeatured: z.boolean(),
    variants: z.array(productVariantSchema).min(1, 'Cần ít nhất 1 biến thể sản phẩm'),
    images: z
      .array(productImageSchema)
      .min(1, 'Cần ít nhất 1 ảnh sản phẩm')
      .refine((items) => items.some((item) => item.isPrimary), 'Chọn ít nhất 1 ảnh đại diện')
      .refine((items) => items.filter((item) => item.isPrimary).length <= 1, 'Chỉ được chọn 1 ảnh đại diện'),
  })
  .superRefine((value, context) => {
    if (value.slug && value.slug.length > 500) {
      context.addIssue({ code: 'custom', path: ['slug'], message: 'Slug không được vượt quá 500 ký tự' });
    }
  });

export type ProductCreateFormValues = z.infer<typeof productCreateSchema>;

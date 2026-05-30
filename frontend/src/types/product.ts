export interface ProductImage {
  id: string;
  url: string;
  altText?: string;
  isPrimary?: boolean;
}

export interface ProductVariant {
  id: string;
  sku: string;
  variantName: string;
  price: number;
  originalPrice?: number;
  stockQuantity?: number;
}

export interface Brand {
  id: string;
  name: string;
  slug?: string;
}

export interface Category {
  id: string;
  name: string;
  slug?: string;
}

export interface Product {
  id: string;          // Chuẩn mới từ nhánh develop
  productId?: string;  // Giữ lại từ nhánh HEAD dạng optional để fallback
  name: string;
  slug: string;
  description?: string;
  minPrice?: number;
  maxPrice?: number;
  thumbnail?: string;
  images?: ProductImage[];
  variants?: ProductVariant[];
  brand?: Brand;
  category?: Category;
  createdAt?: string;
}
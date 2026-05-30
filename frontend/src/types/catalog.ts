export interface CategoryResponse {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  displayOrder?: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BrandResponse {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  originCountry?: string;
  websiteUrl?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category extends CategoryResponse {}
export interface Brand extends BrandResponse {}

export interface CategoryRequest {
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: string | null;
  isActive: boolean;
}

export interface CategoryStatusRequest {
  isActive: boolean;
}

export interface BrandRequest {
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  originCountry?: string;
  websiteUrl?: string;
  isActive: boolean;
}

export interface BrandStatusRequest {
  isActive: boolean;
}

export interface ProductStatusRequest {
  isActive: boolean;
}

export interface ProductCardResponse {
  id: string;
  name: string;
  slug: string;
  averageRating?: number;
  totalSold?: number;
  totalStock?: number;
  minPrice?: number | null;
  maxPrice?: number | null;
  isFeatured?: boolean;
  thumbnail?: string;
}

// Lightweight projections returned by /summary endpoints
export interface BrandSummaryResponse {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
}

export interface CategorySummaryResponse {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
}

export interface CatalogProductPage {
  content: CatalogProduct[];
  totalElements?: number;
  totalPages?: number;
  number?: number;
  size?: number;
}

export interface CatalogProduct {
  id: string;
  name: string;
  slug: string;
  description?: string;
  minPrice?: number;
  maxPrice?: number;
  averageRating?: number;
  totalReviews?: number;
  totalSold?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  categoryName?: string;
  brandName?: string;
  brandLogoUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  images?: CatalogProductImage[];
  variants?: CatalogProductVariant[];
}

export interface CatalogProductImage {
  id?: string;
  url: string;
  altText?: string;
  isPrimary?: boolean;
}

export interface CatalogProductVariant {
  id: string;
  productId: string;
  sku?: string;
  variantName?: string;
  price: number;
  originalPrice?: number;
  stockQuantity?: number;
  sold?: number;
  imageUrl?: string;
  isActive?: boolean;
}

export interface CatalogProductCreateImage {
  url: string;
  publicId?: string;
  altText?: string;
  displayOrder?: number;
  isPrimary?: boolean;
}

export interface CatalogProductCreateVariant {
  sku: string;
  variantName: string;
  price: number;
  originalPrice?: number;
  stockQuantity: number;
  imageUrl?: string;
  isActive?: boolean;
}

export interface CatalogProductCreateRequest {
  name: string;
  slug?: string;
  description?: string;
  ingredients?: string;
  usageInstructions?: string;
  suitableSkinTypes?: string[];
  skinConcerns?: string[];
  variants: CatalogProductCreateVariant[];
  images: CatalogProductCreateImage[];
  categoryId: string;
  brandId: string;
  isActive?: boolean;
  isFeatured?: boolean;
}

export interface CatalogProductDetail {
  id: string;
  name: string;
  slug: string;
  description?: string;
  ingredients?: string;
  usageInstructions?: string;
  suitableSkinTypes?: string[];
  skinConcerns?: string[];
  averageRating?: number;
  totalReviews?: number;
  totalSold?: number;
  minPrice?: number;
  maxPrice?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  categoryId?: string;
  categoryName?: string;
  brandId?: string;
  brandName?: string;
  brandLogoUrl?: string;
  images?: CatalogProductImage[];
  variants?: CatalogProductVariant[];
  createdAt?: string;
  updatedAt?: string;
}

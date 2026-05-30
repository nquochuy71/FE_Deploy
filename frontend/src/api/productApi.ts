import { axiosClient } from './axiosClient';
import type { Product } from '../types/product';
import type { PageResponse } from '../types/api';
import type { ProductCardResponse, CategorySummaryResponse, BrandSummaryResponse } from '../types/catalog';


const catalogProductsPath = '/catalog/products';

const serializeParams = (params: Record<string, unknown>) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item === undefined || item === null || item === '') {
          return;
        }
        searchParams.append(key, String(item));
      });
      return;
    }

    const stringValue = String(value);
    if (stringValue.trim() === '') {
      return;
    }

    searchParams.append(key, stringValue);
  });

  return searchParams.toString();
};

export const productApi = {
  // GET /api/v1/catalog/products (list with pagination)
  getProducts: (params?: Record<string, unknown>) => {
    return axiosClient.get<unknown, PageResponse<Product>>(catalogProductsPath, { params });
  },

  // GET /api/v1/catalog/products/:id (by UUID)
  getProduct: (id: string) => {
    return axiosClient.get<unknown, Product>(`${catalogProductsPath}/${id}`);
  },

  // GET /api/v1/catalog/products/slug/:slug (by slug - SEO friendly)
  getProductBySlug: (slug: string) => {
    return axiosClient.get<unknown, Product>(`${catalogProductsPath}/slug/${slug}`);
  },

  // GET /api/v1/catalog/products/search?keyword=...
  searchProducts: (keyword: string, params?: Record<string, unknown>) => {
    return axiosClient.get<unknown, PageResponse<Product>>(`${catalogProductsPath}/search`, {
      params: { keyword, ...params },
    });
  },

  // GET /api/v1/catalog/products/filter?keyword=...&categoryIds=...&brandIds=...
  filterProducts: (params?: Record<string, unknown>) => {
    return axiosClient.get<unknown, PageResponse<ProductCardResponse>>(`${catalogProductsPath}/filter`, {
      params,
      paramsSerializer: (serializedParams) => serializeParams(serializedParams as Record<string, unknown>),
    });
  },

  // GET /api/v1/catalog/products/brand/:brandId
  getProductsByBrand: (brandId: string, params?: Record<string, unknown>) => {
    return axiosClient.get<unknown, PageResponse<Product> | Product[]>(
      `${catalogProductsPath}/brand/${brandId}`,
      { params }
    );
  },

  // GET /api/v1/catalog/products/category/root/:categoryId
  getProductsByCategoryRoot: (categoryId: string, params?: Record<string, unknown>) => {
    return axiosClient.get<unknown, PageResponse<Product> | Product[]>(
      `${catalogProductsPath}/category/root/${categoryId}`,
      { params }
    );
  },

  // GET /api/v1/catalog/products/category/:categoryId
  getProductsByCategory: (categoryId: string, params?: Record<string, unknown>) => {
    return axiosClient.get<unknown, PageResponse<Product> | Product[]>(
      `${catalogProductsPath}/category/${categoryId}`,
      { params }
    );
  },

  // GET /api/v1/catalog/categories/summary
  getCategoriesSummary: () => {
    return axiosClient.get<unknown, CategorySummaryResponse[]>('/catalog/categories/summary');
  },

  // GET /api/v1/catalog/brands/summary
  getBrandsSummary: () => {
    return axiosClient.get<unknown, BrandSummaryResponse[]>('/catalog/brands/summary');
  },

  // GET /api/v1/catalog/products/best-selling
  getBestSellingProducts: (params?: Record<string, unknown>) => {
    return axiosClient.get<unknown, PageResponse<ProductCardResponse>>(`${catalogProductsPath}/best-selling`, {
      params,
    });
  },
};

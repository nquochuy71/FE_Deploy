import { axiosClient } from '../axiosClient';
import { resolveBaseUrl, serviceBase } from '../serviceBase';
import type { PageResponse } from '../../types/api';
import type { CatalogProduct, CatalogProductCreateRequest, CatalogProductDetail, ProductCardResponse, ProductStatusRequest } from '../../types/catalog';

export interface ProductOverviewResponse {
  totalProducts: number;
  activeProducts: number;
  featuredProducts: number;
  outOfStockProducts: number;
}

export interface UpdateProductPayload {
  name?: string;
  description?: string;
  categoryId?: string;
  brandId?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'DRAFT';
}

const catalogProductsPath = '/catalog/products';

export const productManagementApi = {
  createProduct: (payload: CatalogProductCreateRequest) => {
    return axiosClient.post<unknown, CatalogProductDetail>(catalogProductsPath, payload, {
      baseURL: resolveBaseUrl(serviceBase.catalog),
    });
  },

  getProducts: (params?: Record<string, unknown>) => {
    return axiosClient.get<unknown, PageResponse<CatalogProduct>>(catalogProductsPath, {
      baseURL: resolveBaseUrl(serviceBase.catalog),
      params,
    });
  },

  getAllProducts: (params?: Record<string, unknown>) => {
    return axiosClient.get<unknown, PageResponse<ProductCardResponse>>(`${catalogProductsPath}/admin`, {
      baseURL: resolveBaseUrl(serviceBase.catalog),
      params,
    });
  },

  getProductOverview: () => {
    return axiosClient.get<unknown, ProductOverviewResponse>(`${catalogProductsPath}/admin/overview`, {
      baseURL: resolveBaseUrl(serviceBase.catalog),
    });
  },

  getBestSellingProducts: (params?: Record<string, unknown>) => {
    return axiosClient.get<unknown, PageResponse<CatalogProduct>>(`${catalogProductsPath}/best-selling`, {
      baseURL: resolveBaseUrl(serviceBase.catalog),
      params,
    });
  },

  getTopRatedProducts: (params?: Record<string, unknown>) => {
    return axiosClient.get<unknown, PageResponse<CatalogProduct>>(`${catalogProductsPath}/top-rated`, {
      baseURL: resolveBaseUrl(serviceBase.catalog),
      params,
    });
  },

  updateProduct: (productId: string, payload: CatalogProductCreateRequest) => {
    return axiosClient.put<unknown, CatalogProductDetail>(`${catalogProductsPath}/${productId}`, payload, {
      baseURL: resolveBaseUrl(serviceBase.catalog),
    });
  },

  changeProductStatus: (productId: string, payload: ProductStatusRequest) => {
    return axiosClient.patch<unknown, CatalogProduct>(`${catalogProductsPath}/${productId}/status`, payload, {
      baseURL: resolveBaseUrl(serviceBase.catalog),
    });
  },
};
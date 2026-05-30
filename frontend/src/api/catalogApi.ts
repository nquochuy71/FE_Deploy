import { axiosClient } from './axiosClient';
import { resolveBaseUrl, serviceBase } from './serviceBase';
import type { CatalogProduct, CatalogProductPage, CatalogProductVariant } from '../types/catalog';

export const catalogApi = {
  getProducts: (page = 0, size = 12) => {
    return axiosClient.get<unknown, CatalogProductPage>('/catalog/products', {
      baseURL: resolveBaseUrl(serviceBase.catalog),
      params: { page, size },
    });
  },

  getProductBySlug: (slug: string) => {
    return axiosClient.get<unknown, CatalogProduct>(`/catalog/products/slug/${slug}`, {
      baseURL: resolveBaseUrl(serviceBase.catalog),
    });
  },

  getProductById: (id: string) => {
    return axiosClient.get<unknown, CatalogProduct>(`/catalog/products/${id}`, {
      baseURL: resolveBaseUrl(serviceBase.catalog),
    });
  },

  getVariantById: (variantId: string) => {
    return axiosClient.get<unknown, CatalogProductVariant>(`/catalog/variants/${variantId}`, {
      baseURL: resolveBaseUrl(serviceBase.catalog),
    });
  },
};

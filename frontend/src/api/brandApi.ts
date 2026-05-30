import { axiosClient } from './axiosClient';
import type { PageResponse } from '../types/api';
import type { BrandRequest, BrandResponse, BrandStatusRequest, BrandSummaryResponse } from '../types/catalog';

const normalizePage = <T,>(response: unknown): PageResponse<T> => {
  const payload = response as PageResponse<T>;

  return {
    content: Array.isArray(payload?.content) ? payload.content : [],
    totalElements: payload?.totalElements,
    totalPages: payload?.totalPages,
    size: payload?.size,
    number: payload?.number,
  };
};

export const brandApi = {
  // Get all active brands (full payload)
  getActiveBrands: async (): Promise<BrandResponse[]> => {
    try {
      const response = await axiosClient.get<BrandResponse[]>('/catalog/brands/active');
      const payload = response as unknown as BrandResponse[];
      return Array.isArray(payload) ? payload : [];
    } catch (error) {
      console.error('Error fetching active brands:', error);
      throw error;
    }
  },

  // Get lightweight summaries of active brands (id, name, slug, logoUrl)
  getBrandSummaries: async (): Promise<BrandSummaryResponse[]> => {
    try {
      const response = await axiosClient.get<BrandSummaryResponse[]>('/catalog/brands/summary');
      const payload = response as unknown as BrandSummaryResponse[];
      return Array.isArray(payload) ? payload : [];
    } catch (error) {
      console.error('Error fetching brand summaries:', error);
      throw error;
    }
  },

  // Get brand by slug
  getBrandBySlug: async (slug: string): Promise<BrandResponse> => {
    try {
      const response = await axiosClient.get<BrandResponse>(`/catalog/brands/slug/${slug}`);
      return response as unknown as BrandResponse;
    } catch (error) {
      console.error('Error fetching brand by slug:', error);
      throw error;
    }
  },

  // Get all brands with pagination
  getAllBrands: async (page = 0, size = 20): Promise<{ content: BrandResponse[] }> => {
    try {
      const response = await axiosClient.get(`/catalog/brands`, {
        params: { page, size },
      });
      return response as unknown as { content: BrandResponse[] };
    } catch (error) {
      console.error('Error fetching all brands:', error);
      throw error;
    }
  },

  getBrandPage: async (params?: Record<string, unknown>): Promise<PageResponse<BrandResponse>> => {
    try {
      const response = await axiosClient.get('/catalog/brands', {
        params,
      });
      return normalizePage<BrandResponse>(response);
    } catch (error) {
      console.error('Error fetching brand page:', error);
      throw error;
    }
  },

  getBrandById: async (id: string): Promise<BrandResponse> => {
    try {
      const response = await axiosClient.get<BrandResponse>(`/catalog/brands/${id}`);
      return response as unknown as BrandResponse;
    } catch (error) {
      console.error('Error fetching brand by id:', error);
      throw error;
    }
  },

  searchBrands: async (keyword: string): Promise<BrandResponse[]> => {
    try {
      const response = await axiosClient.get<BrandResponse[]>(`/catalog/brands/search`, {
        params: { keyword },
      });
      const payload = response as unknown as BrandResponse[];
      return Array.isArray(payload) ? payload : [];
    } catch (error) {
      console.error('Error searching brands:', error);
      throw error;
    }
  },

  createBrand: async (payload: BrandRequest): Promise<BrandResponse> => {
    try {
      const response = await axiosClient.post<unknown, BrandResponse>('/catalog/brands', payload);
      return response as unknown as BrandResponse;
    } catch (error) {
      console.error('Error creating brand:', error);
      throw error;
    }
  },

  updateBrand: async (id: string, payload: BrandRequest): Promise<BrandResponse> => {
    try {
      const response = await axiosClient.put<unknown, BrandResponse>(`/catalog/brands/${id}`, payload);
      return response as unknown as BrandResponse;
    } catch (error) {
      console.error('Error updating brand:', error);
      throw error;
    }
  },

  updateBrandStatus: async (id: string, payload: BrandStatusRequest): Promise<BrandResponse> => {
    try {
      const response = await axiosClient.patch<unknown, BrandResponse>(`/catalog/brands/${id}/status`, payload);
      return response as unknown as BrandResponse;
    } catch (error) {
      console.error('Error updating brand status:', error);
      throw error;
    }
  },
};

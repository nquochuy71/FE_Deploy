import { axiosClient } from './axiosClient';
import type { PageResponse } from '../types/api';
import type { CategoryRequest, CategoryResponse, CategoryStatusRequest, CategorySummaryResponse } from '../types/catalog';

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

export const categoryApi = {
  // Get all active categories (full payload)
  getActiveCategories: async (): Promise<CategoryResponse[]> => {
    try {
      const response = await axiosClient.get<CategoryResponse[]>('/catalog/categories/active');
      const payload = response as unknown as CategoryResponse[];
      return Array.isArray(payload) ? payload : [];
    } catch (error) {
      console.error('Error fetching active categories:', error);
      throw error;
    }
  },

  // Get lightweight summaries of active categories (id, name, slug, imageUrl)
  getCategorySummaries: async (): Promise<CategorySummaryResponse[]> => {
    try {
      const response = await axiosClient.get<CategorySummaryResponse[]>('/catalog/categories/summary');
      const payload = response as unknown as CategorySummaryResponse[];
      return Array.isArray(payload) ? payload : [];
    } catch (error) {
      console.error('Error fetching category summaries:', error);
      throw error;
    }
  },

  // Get lightweight summaries of root active categories (parentId = null)
  getRootCategorySummaries: async (): Promise<CategorySummaryResponse[]> => {
    try {
      const response = await axiosClient.get<CategorySummaryResponse[]>('/catalog/categories/summary/root');
      const payload = response as unknown as CategorySummaryResponse[];
      return Array.isArray(payload) ? payload : [];
    } catch (error) {
      console.error('Error fetching root category summaries:', error);
      throw error;
    }
  },

  // Get category by slug
  getCategoryBySlug: async (slug: string): Promise<CategoryResponse> => {
    try {
      const response = await axiosClient.get<CategoryResponse>(`/catalog/categories/slug/${slug}`);
      return response as unknown as CategoryResponse;
    } catch (error) {
      console.error('Error fetching category by slug:', error);
      throw error;
    }
  },

  // Get root categories
  getRootCategories: async (): Promise<CategoryResponse[]> => {
    try {
      const response = await axiosClient.get<CategoryResponse[]>('/catalog/categories/root');
      const payload = response as unknown as CategoryResponse[];
      return Array.isArray(payload) ? payload : [];
    } catch (error) {
      console.error('Error fetching root categories:', error);
      throw error;
    }
  },

  // Get child categories
  getChildCategories: async (parentId: string): Promise<CategoryResponse[]> => {
    try {
      const response = await axiosClient.get<CategoryResponse[]>(`/catalog/categories/children/${parentId}`);
      const payload = response as unknown as CategoryResponse[];
      return Array.isArray(payload) ? payload : [];
    } catch (error) {
      console.error('Error fetching child categories:', error);
      throw error;
    }
  },

  getCategoryPage: async (params?: Record<string, unknown>): Promise<PageResponse<CategoryResponse>> => {
    try {
      const response = await axiosClient.get('/catalog/categories', {
        params,
      });
      return normalizePage<CategoryResponse>(response);
    } catch (error) {
      console.error('Error fetching category page:', error);
      throw error;
    }
  },

  getCategoryById: async (id: string): Promise<CategoryResponse> => {
    try {
      const response = await axiosClient.get<CategoryResponse>(`/catalog/categories/${id}`);
      return response as unknown as CategoryResponse;
    } catch (error) {
      console.error('Error fetching category by id:', error);
      throw error;
    }
  },

  searchCategories: async (keyword: string): Promise<CategoryResponse[]> => {
    try {
      const response = await axiosClient.get<CategoryResponse[]>(`/catalog/categories/search`, {
        params: { keyword },
      });
      const payload = response as unknown as CategoryResponse[];
      return Array.isArray(payload) ? payload : [];
    } catch (error) {
      console.error('Error searching categories:', error);
      throw error;
    }
  },

  createCategory: async (payload: CategoryRequest): Promise<CategoryResponse> => {
    try {
      const response = await axiosClient.post<unknown, CategoryResponse>('/catalog/categories', payload);
      return response as unknown as CategoryResponse;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  },

  updateCategory: async (id: string, payload: CategoryRequest): Promise<CategoryResponse> => {
    try {
      const response = await axiosClient.put<unknown, CategoryResponse>(`/catalog/categories/${id}`, payload);
      return response as unknown as CategoryResponse;
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  },

  updateCategoryStatus: async (id: string, payload: CategoryStatusRequest): Promise<void> => {
    try {
      await axiosClient.patch(`/catalog/categories/${id}/status`, payload);
    } catch (error) {
      console.error('Error updating category status:', error);
      throw error;
    }
  },
};

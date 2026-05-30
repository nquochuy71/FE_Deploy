import { axiosClient } from './axiosClient';
import { resolveBaseUrl, serviceBase } from './serviceBase';
import type { ApiResponse, WishItem } from '../types/api';

export const wishlistApi = {
  getWishlist: (customerId: string) => {
    return axiosClient.get<unknown, ApiResponse<WishItem[]>>(`/user/customers/${customerId}/wishlist`, {
      baseURL: resolveBaseUrl(serviceBase.user),
    });
  },

  addToWishlist: (customerId: string, productId: string) => {
    return axiosClient.post<unknown, ApiResponse<WishItem>>(`/user/customers/${customerId}/wishlist/${productId}`, {}, {
      baseURL: resolveBaseUrl(serviceBase.user),
    });
  },

  removeFromWishlist: (customerId: string, productId: string) => {
    return axiosClient.delete<unknown, ApiResponse<void>>(`/user/customers/${customerId}/wishlist/${productId}`, {
      baseURL: resolveBaseUrl(serviceBase.user),
    });
  },
};

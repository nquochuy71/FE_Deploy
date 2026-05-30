import { axiosClient } from './axiosClient';
import { resolveBaseUrl, serviceBase } from './serviceBase';
import type { CartResponse } from '../types/cart';

export interface AddCartItemRequest {
  productVariantId: string;
  quantity: number;
  unitPrice: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export const cartApi = {
  getCartByCustomerId: (customerId: string) => {
    return axiosClient.get<unknown, CartResponse>(`/carts/${customerId}`, {
      baseURL: resolveBaseUrl(serviceBase.cart),
    });
  },

  getCartByAccountId: (accountId: string) => {
    return axiosClient.get<unknown, CartResponse>(`/carts/account/${accountId}`, {
      baseURL: resolveBaseUrl(serviceBase.cart),
    });
  },

  addItem: (customerId: string, payload: AddCartItemRequest) => {
    return axiosClient.post<unknown, CartResponse>(`/carts/${customerId}/items`, payload, {
      baseURL: resolveBaseUrl(serviceBase.cart),
    });
  },

  updateItemQuantity: (customerId: string, itemId: string, payload: UpdateCartItemRequest) => {
    return axiosClient.put<unknown, CartResponse>(`/carts/${customerId}/items/${itemId}`, payload, {
      baseURL: resolveBaseUrl(serviceBase.cart),
    });
  },

  removeItem: (customerId: string, itemId: string) => {
    return axiosClient.delete<unknown, CartResponse>(`/carts/${customerId}/items/${itemId}`, {
      baseURL: resolveBaseUrl(serviceBase.cart),
    });
  },

  clearCart: (customerId: string) => {
    return axiosClient.delete<unknown, void>(`/carts/${customerId}`, {
      baseURL: resolveBaseUrl(serviceBase.cart),
    });
  },
};

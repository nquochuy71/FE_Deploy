import { axiosClient } from './axiosClient';
import { resolveBaseUrl, serviceBase } from './serviceBase';
import type {
  CreateOrderRequest,
  CreateGuestOrderRequest,
  UpdateOrderStatusRequest,
  OrderResponse,
  VoucherResponse,
  VoucherValidationRequest,
  VoucherValidationResponse,
} from '../types/order';

export const orderApi = {
  createOrder: (payload: CreateOrderRequest) => {
    return axiosClient.post<unknown, OrderResponse>('/orders', payload, {
      baseURL: resolveBaseUrl(serviceBase.order),
    });
  },

  createGuestOrder: (payload: CreateGuestOrderRequest) => {
    return axiosClient.post<unknown, OrderResponse>('/orders/guest', payload, {
      baseURL: resolveBaseUrl(serviceBase.order),
    });
  },

  getOrderById: (orderId: string) => {
    return axiosClient.get<unknown, OrderResponse>(`/orders/${orderId}`, {
      baseURL: resolveBaseUrl(serviceBase.order),
    });
  },

  getOrdersByCustomerId: (customerId: string) => {
    return axiosClient.get<unknown, OrderResponse[]>(`/orders/customer/${customerId}`, {
      baseURL: resolveBaseUrl(serviceBase.order),
    });
  },

  getAllOrders: () => {
    return axiosClient.get<unknown, OrderResponse[]>('/orders', {
      baseURL: resolveBaseUrl(serviceBase.order),
    });
  },

  updateOrderStatus: (orderId: string, payload: UpdateOrderStatusRequest) => {
    return axiosClient.put<unknown, OrderResponse>(`/orders/${orderId}/status`, payload, {
      baseURL: resolveBaseUrl(serviceBase.order),
       });
  },
  
  lookupOrder: (orderCode: string, email: string) => {
    return axiosClient.get<unknown, OrderResponse>('/orders/lookup', {
      baseURL: resolveBaseUrl(serviceBase.order),
      params: { orderCode, email },
    });
  },

  getVouchers: () => {
    return axiosClient.get<unknown, VoucherResponse[]>('/orders/vouchers', {
      baseURL: resolveBaseUrl(serviceBase.order),
    });
  },

  validateVoucher: (voucherId: string, payload: VoucherValidationRequest) => {
    return axiosClient.post<unknown, VoucherValidationResponse>(`/orders/vouchers/${voucherId}/validate`, payload, {
      baseURL: resolveBaseUrl(serviceBase.order),
    });
  },
};

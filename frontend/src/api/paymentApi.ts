import { axiosClient } from './axiosClient';
import { resolveBaseUrl, serviceBase } from './serviceBase';

export interface CreatePaymentRequest {
  orderId: string;
}

export interface PaymentResponse {
  paymentUrl: string;
}

export interface PaymentStatusResponse {
  orderId: string;
  status: string;
  transactionId?: string | null;
}

export const paymentApi = {
  createPayment: (payload: CreatePaymentRequest) => {
    return axiosClient.post<unknown, PaymentResponse>('/payment/create-payment', payload, {
      baseURL: resolveBaseUrl(serviceBase.payment),
    });
  },

  getPaymentStatus: (orderId: string) => {
    return axiosClient.get<unknown, PaymentStatusResponse>(`/payment/status/${orderId}`, {
      baseURL: resolveBaseUrl(serviceBase.payment),
    });
  },
};

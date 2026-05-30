import { axiosClient } from '../axiosClient';
import { resolveBaseUrl, serviceBase } from '../serviceBase';
import type { Voucher } from '../../pages/admin/voucher-management/types';

const vouchersPath = '/orders/vouchers';

export const voucherApi = {
  getVouchers: (params?: Record<string, unknown>) => {
    return axiosClient.get<unknown, Voucher[]>(vouchersPath, {
      baseURL: resolveBaseUrl(serviceBase.order),
      params,
    });
  },

  getVoucher: (id: string) => {
    return axiosClient.get<unknown, Voucher>(`${vouchersPath}/${id}`, {
      baseURL: resolveBaseUrl(serviceBase.order),
    });
  },

  createVoucher: (payload: unknown) => {
    return axiosClient.post<unknown, Voucher>(vouchersPath, payload, {
      baseURL: resolveBaseUrl(serviceBase.order),
    });
  },

  updateVoucher: (id: string, payload: unknown) => {
    return axiosClient.put<unknown, Voucher>(`${vouchersPath}/${id}`, payload, {
      baseURL: resolveBaseUrl(serviceBase.order),
    });
  },

  changeStatus: (id: string, status: string) => {
    return axiosClient.patch<unknown, Voucher>(`${vouchersPath}/${id}/status`, { status }, {
      baseURL: resolveBaseUrl(serviceBase.order),
    });
  },

  deleteVoucher: (id: string) => {
    return axiosClient.delete<unknown, void>(`${vouchersPath}/${id}`, {
      baseURL: resolveBaseUrl(serviceBase.order),
    });
  },
};

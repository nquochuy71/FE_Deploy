import { axiosClient } from './axiosClient';
import { resolveBaseUrl, serviceBase } from './serviceBase';
import type { Address } from '../types/address';

export const addressApi = {
  getAddressesByCustomerId: (customerId: string) => {
    return axiosClient.get<unknown, Address[]>(`/user/addresses/customer/${customerId}`, {
      baseURL: resolveBaseUrl(serviceBase.user),
    });
  },

  getDefaultAddress: (customerId: string) => {
    return axiosClient.get<unknown, Address>(`user/addresses/default/${customerId}`, {
      baseURL: resolveBaseUrl(serviceBase.user),
    });
  },
};

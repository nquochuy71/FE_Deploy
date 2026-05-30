import { axiosClient } from './axiosClient';
import type { ApiResponse, CustomerAccountInfo, EmployeeAccountInfo, EmployeeAccountUpdateRequest } from '../types/api';

export const accountApi = {
  getCustomerAccounts: () => {
    return axiosClient.get<unknown, ApiResponse<CustomerAccountInfo[]>>('/auth/accounts/customers');
  },

  getEmployeeAccounts: () => {
    return axiosClient.get<unknown, ApiResponse<EmployeeAccountInfo[]>>('/auth/accounts/employees');
  },

  toggleAccountStatus: (accountId: string) => {
    return axiosClient.put<unknown, ApiResponse<unknown>>(`/auth/accounts/active/${accountId}`);
  },

  updateEmployeeAccount: (accountId: string, data: EmployeeAccountUpdateRequest) => {
    return axiosClient.put<unknown, ApiResponse<unknown>>(`/auth/accounts/employee/${accountId}`, data);
  },
};
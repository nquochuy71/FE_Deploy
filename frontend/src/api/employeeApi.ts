import { axiosClient } from './axiosClient';
import { resolveBaseUrl, serviceBase } from './serviceBase';
import type { ApiResponse, EmployeeCreateRequest, EmployeeProfileInfo, EmployeeUpdateRequest } from '../types/api';

export const employeeApi = {
  getEmployeeByAccountId: (accountId: string) => {
    return axiosClient.get<unknown, ApiResponse<EmployeeProfileInfo>>(`/user/employees/account/${accountId}`, {
      baseURL: resolveBaseUrl(serviceBase.user),
    });
  },

  updateEmployee: (employeeId: string, data: EmployeeUpdateRequest) => {
    return axiosClient.put<unknown, ApiResponse<void>>(`/user/employees/${employeeId}`, data, {
      baseURL: resolveBaseUrl(serviceBase.user),
    });
  },

  createEmployee: (data: EmployeeCreateRequest) => {
    return axiosClient.post<unknown, ApiResponse<void>>('/user/employees', data, {
      baseURL: resolveBaseUrl(serviceBase.user),
    });
  },
};
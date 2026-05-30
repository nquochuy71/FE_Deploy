import { axiosClient } from '../axiosClient';
import type { Product } from '../../types/product';

export interface AdminDashboardSummary {
  totalProducts: number;
  totalUsers: number;
  totalOrders: number;
  revenue: number;
}

export interface AdminDashboardResponse {
  summary: AdminDashboardSummary;
  recentProducts: Product[];
}

export const dashboardApi = {
  getSummary: () => {
    return axiosClient.get<unknown, AdminDashboardResponse>('/admin/dashboard');
  },
};
import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';
import type { ApiResponse, AuthTokenResponse, ApiError } from '../types/api';

const baseURL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_AUTH_API_URL || 'http://localhost:8081';

// Main axios instance for general API requests
export const axiosClient = axios.create({
  baseURL,
  withCredentials: true, // Crucial for sending and receiving the HttpOnly refresh token cookie
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// A basic instance just for refreshing token to avoid interceptor loops
const rawAxios = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Flag to indicate if a refresh is currently in progress
let isRefreshing = false;

// Queue of subscribers waiting for the new token
let failedQueue: {
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // --- ADDED: Block non-deployed services (only auth, user, notification are live) ---
    const allowedServices = ['/auth', '/user', '/notification'];
    const isAllowed = config.url && allowedServices.some(service => config.url?.includes(service));
    if (!isAllowed) {
      return Promise.reject(new Error('SERVICE_NOT_DEPLOYED'));
    }
    // ---------------------------------------------------------------------------------

    // Allow unauthenticated access only for public catalog GET endpoints.
    const method = config.method?.toLowerCase() || 'get';
    const isCatalogPath =
      config.url?.includes('/catalog/categories') ||
      config.url?.includes('/catalog/brands') ||
      config.url?.includes('/catalog/products');
    const isAdminCatalogGet = config.url?.includes('/catalog/products/admin');

    if (method === 'get' && isCatalogPath && !isAdminCatalogGet) {
      return config;
    }

      const isAuthEndpoint =
      config.url?.includes('/auth/login') ||
      config.url?.includes('/auth/register') ||
      config.url?.includes('/auth/refresh') ||
      config.url?.includes('/auth/google') ||
      config.url?.includes('/auth/verify-email') ||
      config.url?.includes('/auth/forgot-password') ||
      config.url?.includes('/auth/reset-password');

    const token =
      useAuthStore.getState().accessToken ||
      (typeof window !== 'undefined'
        ? window.localStorage.getItem('auth-access-token')
        : null);

    if (token && config.headers && !isAuthEndpoint) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

axiosClient.interceptors.response.use(
  (response) => {
    // Unwrap the Axios container to return the actual Backend ApiResponse payload
    return response.data;
  },
  async (error: AxiosError<ApiError>) => {
    // --- ADDED: Silence blocked (non-deployed) services quietly ---
    if (error instanceof Error && error.message === 'SERVICE_NOT_DEPLOYED') {
      return Promise.reject(error);
    }
    // ---------------------------------------------------------------

    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Normalize Error: Nếu sập mạng hoặc không có response, chuẩn hóa nó thành form ApiError
    const normalizedError: ApiError = error.response?.data || {
      code: error.response?.status || 500,
      message: error.message || 'Network error or server is down',
      timestamp: new Date().toISOString(),
    };

    // Định vị các Endpoint gốc liên quan tới Auth để không chặn lỗi hay trigger Refresh
    const isAuthEndpoint = originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/register');
    const isRefreshEndpoint = originalRequest.url?.includes('/auth/refresh');

    // Đảm bảo chỉ refresh nếu request gốc có mang theo Token (nghĩa là đang trong session)
    const hasAuthHeader = !!originalRequest.headers?.Authorization;

    // 401 Unauthorized
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      hasAuthHeader &&
      !isAuthEndpoint &&
      !isRefreshEndpoint
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest._retry = true; // Thêm guard tránh retry loop sâu cho các request trong queue
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return axiosClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await rawAxios.post<ApiResponse<AuthTokenResponse>>('/auth/refresh');
        const newAccessToken = response.data.data.accessToken;

        // Đảo processQueue lên trước setAccessToken để queue chạy ngay trước khi Component trigger re-render
        processQueue(null, newAccessToken);
        useAuthStore.getState().setAccessToken(newAccessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return axiosClient(originalRequest);
      } catch (err) {
        processQueue(err, null);
        useAuthStore.getState().logout();

        const refreshError: ApiError = (err as AxiosError<ApiError>).response?.data || {
          code: 401,
          message: 'Session expired. Please login again.',
        };
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Return the perfectly formatted normalizedError for any other case or failed refresh
    return Promise.reject(normalizedError);
  }
);

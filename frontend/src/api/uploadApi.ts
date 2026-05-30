import axios, { AxiosError } from 'axios';
import { useAuthStore } from '../store/authStore';
import { serviceBase } from './serviceBase';
import type { ApiError } from '../types/api';
export const uploadApi = {
  uploadFile: async (file: File): Promise<string> => {
    // Delegate to uploadSingleMedia with purpose COMMENT
    // uploadSingleMedia returns MediaUploadResult through the interceptor
    const result: any = await uploadSingleMedia(file, 'COMMENT');
    return result.url;
  }
};

export type MediaUploadPurpose = 'AVATAR' | 'COMMENT' | 'PRODUCT';

export interface MediaUploadResult {
  url: string;
  key: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  purpose: MediaUploadPurpose;
  uploadedAt: number;
}

const uploadPathPrefix = '/upload';

const uploadClient = axios.create({
  baseURL: serviceBase.upload,
  headers: {
    Accept: 'application/json',
  },
});

uploadClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

uploadClient.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError<ApiError>) => {
    const normalizedError: ApiError = error.response?.data || {
      code: error.response?.status || 500,
      message: error.message || 'Upload service is unavailable',
      timestamp: new Date().toISOString(),
    };

    return Promise.reject(normalizedError);
  },
);

const extensionFromMimeType = (mimeType?: string) => {
  switch (mimeType) {
    case 'image/jpeg':
    case 'image/jpg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    case 'image/gif':
      return '.gif';
    default:
      return '';
  }
};

const normalizeFileName = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'upload-file';

const blobSourceToFile = async (source: string, fallbackName: string) => {
  const response = await fetch(source);
  const blob = await response.blob();
  const fileName = `${normalizeFileName(fallbackName)}${extensionFromMimeType(blob.type)}`;
  return new File([blob], fileName, { type: blob.type || 'application/octet-stream' });
};

export const uploadSingleMedia = async (file: File, purpose: MediaUploadPurpose = 'PRODUCT') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('purpose', purpose);

  return uploadClient.post<unknown, MediaUploadResult>(`${uploadPathPrefix}/single`, formData);
};

export const resolveMediaSourceUrl = async (
  sourceUrl: string,
  purpose: MediaUploadPurpose,
  fallbackName: string,
) => {
  if (!sourceUrl.startsWith('blob:') && !sourceUrl.startsWith('data:')) {
    return {
      url: sourceUrl,
      key: undefined,
    };
  }

  const file = await blobSourceToFile(sourceUrl, fallbackName);
  const uploaded = await uploadSingleMedia(file, purpose);

  return {
    url: uploaded.url,
    key: uploaded.key,
  };
};
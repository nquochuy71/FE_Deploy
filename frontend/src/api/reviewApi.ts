import { axiosClient } from './axiosClient';
import type { ReviewResponse, ReviewRequest, PageResponse } from '../types/review';

export const reviewApi = {
  getReviewsByProductId: (productId: string, page = 0, size = 5) => {
    return axiosClient.get<unknown, PageResponse<ReviewResponse>>(`/review/product/${productId}`, {
      params: { page, size }
    });
  },

  createReview: (request: ReviewRequest) => {
    return axiosClient.post<unknown, ReviewResponse>('/review', request);
  },

  getReviewsByCustomerId: (customerId: string) => {
    return axiosClient.get<unknown, ReviewResponse[]>(`/review/customer/${customerId}`);
  },

  updateReview: (reviewId: string, request: ReviewRequest) => {
    return axiosClient.put<unknown, ReviewResponse>(`/review/${reviewId}`, request);
  }
};

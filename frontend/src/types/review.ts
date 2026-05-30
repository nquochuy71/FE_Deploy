export interface ReviewResponse {
  id: string;
  productId: string;
  customerId: string;
  customerName: string;
  orderItemId: string;
  rating: number;
  comment: string;
  imageUrls: string[];
  isEdited: boolean;
  createdAt: string;
}

export interface ReviewRequest {
  productId?: string;
  customerId: string;
  orderItemId: string;
  rating: number;
  comment: string;
  imageUrls: string[];
}

export interface PageResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

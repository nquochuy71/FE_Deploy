export interface CartResponse {
  id: string;
  customerId: string;
  updatedAt?: string;
  items: CartItemResponse[];
}

export interface CartItemResponse {
  id: string;
  productVariantId: string;
  quantity: number;
  unitPrice: number;
  addedAt?: string;
}

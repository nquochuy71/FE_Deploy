export type VoucherType = 'PERCENT' | 'AMOUNT' | 'FREE_SHIPPING';

export type VoucherStatus = 'ACTIVE' | 'UPCOMING' | 'EXPIRED' | 'DISABLED';

export type StatusFilter = VoucherStatus | 'ALL';

export type ModalMode = 'create' | 'edit' | null;

export type Voucher = {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: VoucherType;
  discountValue: number;
  maxDiscountAmount?: number | null;
  minOrderAmount: number;
  quantity: number;
  maxUsagePerUser?: number | null;
  status: VoucherStatus;
  startDate: string;
  endDate: string;
  createdAt: string;
};

export type VoucherFormState = {
  code: string;
  name: string;
  description: string;
  type: VoucherType | '';
  discountValue: string;
  maxDiscountAmount: string;
  minOrderAmount: string;
  quantity: string;
  maxUsagePerUser: string;
  status: VoucherStatus | '';
  startDate: string;
  endDate: string;
};

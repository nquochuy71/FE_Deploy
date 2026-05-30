export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
  traceId?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements?: number;
  totalPages?: number;
  size?: number;
  number?: number;
}

export interface ApiError {
  code: number;
  message: string;
  errors?: Record<string, string>;
  traceId?: string;
  path?: string;
  timestamp?: string;
}

export interface AuthTokenResponse {
  tokenType: string;
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
}

export type AccountStatus = 'ACTIVE' | 'DISABLED' | 'PENDING_VERIFY';

export interface CustomerAccountInfo {
  accountId: string;
  email: string;
  status: AccountStatus;
  fullName?: string;
  phoneNumber?: string;
}

export interface EmployeeAccountInfo {
  accountId: string;
  email: string;
  status: AccountStatus;
  fullName?: string;
  phoneNumber?: string;
  employeeCode?: string;
  hireDate?: string;
}

export interface EmployeeCreateRequest {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
}

export interface EmployeeAccountUpdateRequest {
  email: string;
  fullName: string;
  phoneNumber: string;
}

export interface UserProfileInfo {
  accountId: string;
  email: string;
  role: string;
  fullName?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  skinType?: string;
  loyaltyPoints?: number;
  skinConcerns?: string[];
  employeeCode?: string;
  hireDate?: string;
  avatarUrl?: string;
  status?: string;
  provider?: string;
  hasPassword?: boolean;
  emailVerified?: boolean;
  lastLoginAt?: string;
  createdAt?: string;
  issuedAt: string;
  expiresAt: string;
}

export interface AvatarUpdateResponse {
  accountId: string;
  avatarUrl: string;
}

export interface CustomerProfileInfo {
  id?: string;
  accountId: string;
  email?: string;
  fullName?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  skinType?: string;
  loyaltyPoints?: number;
  skinConcerns?: string[];
}

export interface CustomerUpdateRequest {
  fullName?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  skinType?: string;
  skinConcerns?: string[];
}

export interface AvatarUpdateRequest {
  avatarUrl: string;
}

export interface EmployeeProfileInfo {
  id?: string;
  accountId: string;
  employeeCode: string;
  fullName?: string;
  phoneNumber?: string;
  hireDate?: string;
  active?: boolean;
}

export interface EmployeeUpdateRequest {
  fullName?: string;
  phoneNumber?: string;
}

export interface Address {
  id?: string;
  customerId?: string;
  recipientName?: string;
  phone?: string;
  streetAddress?: string;
  ward?: string;
  district?: string;
  city?: string;
  isDefault?: boolean;
}

export interface AddressCreateRequest {
  recipientName?: string;
  phone?: string;
  streetAddress?: string;
  ward?: string;
  district?: string;
  city?: string;
  isDefault?: boolean;
}

export interface WishItem {
  id: string;
  customerId: string;
  productId: string;
}

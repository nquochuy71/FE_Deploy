export interface LoginRequest {
  email: string;
  password?: string;
}

export interface RegisterRequest {
  email: string;
  password?: string;
  fullName: string;
  phoneNumber: string;
}

export interface RegisterResponse {
  accountId: string;
  email: string;
  role: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword?: string;
}

export interface ChangePasswordRequest {
  otp: string;
  oldPassword?: string;
  newPassword?: string;
}

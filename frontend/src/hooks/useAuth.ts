import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/authApi';
import { employeeApi } from '../api/employeeApi';
import { userApi } from '../api/userApi';
import { useAuthStore } from '../store/authStore';
import type { LoginRequest, RegisterRequest, ForgotPasswordRequest, ResetPasswordRequest, ChangePasswordRequest } from '../types/auth';
import type { EmployeeProfileInfo, UserProfileInfo } from '../types/api';

export const useAuth = () => {
  const queryClient = useQueryClient();
  const setCredentials = useAuthStore((state) => state.setCredentials);
  const logout = useAuthStore((state) => state.logout);
  const setInitialized = useAuthStore((state) => state.setInitialized);

  const fetchProfileWithUserService = async (): Promise<UserProfileInfo> => {
    const profileRes = await authApi.getProfile();
    const authProfile = profileRes.data;

    try {
      if (authProfile.role === 'CUSTOMER') {
        const customerRes = await userApi.getCustomerByAccountId(authProfile.accountId);
        const customer = customerRes.data;

        return {
          ...authProfile,
          fullName: customer.fullName ?? authProfile.fullName,
          phoneNumber: customer.phoneNumber ?? authProfile.phoneNumber,
          dateOfBirth: customer.dateOfBirth ?? authProfile.dateOfBirth,
          gender: customer.gender ?? authProfile.gender,
          skinType: customer.skinType ?? authProfile.skinType,
          loyaltyPoints: customer.loyaltyPoints ?? authProfile.loyaltyPoints,
          skinConcerns: customer.skinConcerns ?? authProfile.skinConcerns,
        };
      }

      if (authProfile.role === 'EMPLOYEE') {
        const employeeRes = await employeeApi.getEmployeeByAccountId(authProfile.accountId);
        return mergeEmployeeProfile(authProfile, employeeRes.data);
      }

      return authProfile;
    } catch {
      return authProfile;
    }
  };

  const useMeQuery = (enabled = true) => useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => fetchProfileWithUserService(),
    enabled,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const loginMutation = useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: async (res) => {
      const token = res.data.accessToken;
      try {
        useAuthStore.getState().setAccessToken(token);
        const profile = await fetchProfileWithUserService();
        setCredentials(profile, token);
      } catch {
        logout();
      }
    },
  });

  const googleLoginMutation = useMutation({
    mutationFn: (idToken: string) => authApi.googleLogin(idToken),
    onSuccess: async (res) => {
      const token = res.data.accessToken;
      try {
        useAuthStore.getState().setAccessToken(token);
        const profile = await fetchProfileWithUserService();
        setCredentials(profile, token);
      } catch {
        logout();
      }
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data)
  });

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      queryClient.clear();
      logout();
    }
  });

  const verifyEmailMutation = useMutation({
    mutationFn: (token: string) => authApi.verifyEmail(token)
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: (data: ForgotPasswordRequest) => authApi.forgotPassword(data)
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (data: ResetPasswordRequest) => authApi.resetPassword(data)
  });

  const requestChangePasswordMutation = useMutation({
    mutationFn: () => authApi.requestChangePassword()
  });

  const confirmChangePasswordMutation = useMutation({
    mutationFn: (data: ChangePasswordRequest) => authApi.confirmChangePassword(data)
  });

  const initSession = async () => {
    try {
      let token = useAuthStore.getState().accessToken;

      if (!token) {
        const { hasEverLoggedIn } = useAuthStore.getState();
        if (!hasEverLoggedIn) {
          // Fresh visitor, never logged in before - skip refresh to avoid 500/401 console spam
          return;
        }
        const refreshRes = await authApi.refresh();
        token = refreshRes.data.accessToken;
        useAuthStore.getState().setAccessToken(token);
      }

      const res = await fetchProfileWithUserService();
      if (token) {
        setCredentials(res, token);
      }
    } catch {
      logout();
    } finally {
      setInitialized();
    }
  };

  return {
    useMeQuery,
    loginMutation,
    googleLoginMutation,
    registerMutation,
    logoutMutation,
    verifyEmailMutation,
    forgotPasswordMutation,
    resetPasswordMutation,
    requestChangePasswordMutation,
    confirmChangePasswordMutation,
    initSession
  };
};

function mergeEmployeeProfile(
  authProfile: UserProfileInfo,
  employee: EmployeeProfileInfo,
): UserProfileInfo {
  return {
    ...authProfile,
    fullName: employee.fullName ?? authProfile.fullName,
    phoneNumber: employee.phoneNumber ?? authProfile.phoneNumber,
    employeeCode: employee.employeeCode,
    hireDate: employee.hireDate,
    createdAt: employee.hireDate ?? authProfile.createdAt,
    status: employee.active ? 'ACTIVE' : 'DISABLED',
    skinConcerns: authProfile.skinConcerns,
    loyaltyPoints: authProfile.loyaltyPoints,
  };
}

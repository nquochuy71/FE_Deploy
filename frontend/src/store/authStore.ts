import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserProfileInfo } from '../types/api';

const ACCESS_TOKEN_STORAGE_KEY = 'auth-access-token';

const syncAccessToken = (token: string | null) => {
  if (typeof window === 'undefined') {
    return;
  }

  if (token) {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  }
};

interface AuthState {
  accessToken: string | null;
  user: UserProfileInfo | null;
  hasEverLoggedIn: boolean;
  isInitialized: boolean;
  isAuthenticated: boolean;

  setAccessToken: (token: string | null) => void;
  setUser: (user: UserProfileInfo | null) => void;
  setCredentials: (user: UserProfileInfo, token: string) => void;
  setInitialized: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      hasEverLoggedIn: false,
      isInitialized: false,
      isAuthenticated: false,

      setAccessToken: (token) => {
        syncAccessToken(token);
        set({ accessToken: token, isAuthenticated: !!token });
      },

      setUser: (user) => set({ user }),

      setCredentials: (user, token) => {
        syncAccessToken(token);
        set({
          user,
          accessToken: token,
          isAuthenticated: true,
          hasEverLoggedIn: true,
        });
      },

      setInitialized: () => set({ isInitialized: true }),

      logout: () => {
        // Clear chat history when user logs out
        import('./chatStore').then(({ useChatStore }) => {
          useChatStore.getState().resetChatState();
        });
        syncAccessToken(null);
        set({
          accessToken: null,
          user: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'auth-session',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        hasEverLoggedIn: state.hasEverLoggedIn,
      } as AuthState), // Ép kiểu ở đây để đánh lừa TS rằng object này sẽ được trộn vào state gốc
    }
  )
);

export const useIsAdmin = () => useAuthStore((state) => state.user?.role === 'ADMIN');
export const useIsEmployee = () => useAuthStore((state) => state.user?.role === 'EMPLOYEE');
export const useIsCustomer = () => useAuthStore((state) => state.user?.role === 'CUSTOMER');

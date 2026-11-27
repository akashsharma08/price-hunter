import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ApiAuthUser } from '@/shared/api/types';
import { apiPost, configureApiAuth } from '@/shared/api/client';

interface AuthState {
  user: ApiAuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  setSession: (payload: {
    user: ApiAuthUser;
    accessToken: string;
    refreshToken: string;
  }) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setSession: ({ user, accessToken, refreshToken }) =>
        set({ user, accessToken, refreshToken }),
      clearSession: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    { name: 'price-hunter-auth' },
  ),
);

configureApiAuth({
  getAccessToken: () => useAuthStore.getState().accessToken,
  refreshTokens: async () => {
    const current = useAuthStore.getState().refreshToken;
    if (!current) {
      useAuthStore.getState().clearSession();
      return null;
    }
    try {
      const { data } = await apiPost<{
        user: ApiAuthUser;
        accessToken: string;
        refreshToken: string;
      }>('/auth/refresh', { refreshToken: current }, { retry: false });
      useAuthStore.getState().setSession({
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      return data.accessToken;
    } catch {
      useAuthStore.getState().clearSession();
      return null;
    }
  },
});

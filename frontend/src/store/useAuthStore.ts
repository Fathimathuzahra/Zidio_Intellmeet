import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '../types/user';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  setAuth: (user: User, token: string) => void;
  updateUser: (user: Partial<User>) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
  isMember: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,

      setAuth: (user, accessToken) => set({ user, accessToken }),

      updateUser: (updates) => set((s) => ({ user: s.user ? { ...s.user, ...updates } : s.user })),

      clearAuth: () => set({ user: null, accessToken: null }),

      isAuthenticated: () => !!get().accessToken,

      isAdmin: () => {
        const { user } = get();
        return user?.role === 'admin';
      },
      
      isMember: () => {
        const { user } = get();
        return user?.role === 'member';
      },
    }),
    {
      name: 'intellmeet-auth',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { UserInfo } from "../types/auth";

interface AuthState {
  accessToken: string | null;
  user: UserInfo | null;
  isAuthenticated: boolean;
  setAuth: (accessToken: string, user: UserInfo) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      setAuth: (accessToken, user) =>
        set({ accessToken, user, isAuthenticated: true }),
      clearAuth: () =>
        set({ accessToken: null, user: null, isAuthenticated: false }),
    }),
    {
      name: "owlexa-auth-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

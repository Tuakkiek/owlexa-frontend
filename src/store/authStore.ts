import { create } from "zustand";
import type { UserInfo } from "../types/auth";

interface AuthState {
  accessToken: string | null;
  user: UserInfo | null;
  isAuthenticated: boolean;
  setAuth: (accessToken: string, user: UserInfo) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  setAuth: (accessToken, user) =>
    set({ accessToken, user, isAuthenticated: true }),
  clearAuth: () =>
    set({ accessToken: null, user: null, isAuthenticated: false }),
}));

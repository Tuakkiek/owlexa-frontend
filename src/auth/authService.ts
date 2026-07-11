import { useAuthStore } from "../store/authStore";
import type { AuthResponse, UserInfo } from "../types/auth";
import { migrateLegacyAuthStorage } from "./authMigration";
import { removeLegacyAuthKeys } from "./authStorage";

/**
 * Central auth API for the frontend.
 * Access token + user profile live in Zustand (persisted as owlexa-auth-store).
 * Refresh token stays in HttpOnly cookie — never touch localStorage for it.
 */
export function toUserInfo(response: AuthResponse): UserInfo {
  return {
    phoneNumber: response.phoneNumber,
    email: response.email,
    fullName: response.fullName,
    roleName: response.roleName,
    centerName: response.centerName,
    centerId: response.centerId,
  };
}

export function initAuthStorage(): void {
  migrateLegacyAuthStorage();
}

export function applyAuthFromResponse(response: AuthResponse): void {
  removeLegacyAuthKeys();
  useAuthStore.getState().setAuth(response.accessToken, toUserInfo(response));
}

export function clearAuthState(): void {
  useAuthStore.getState().clearAuth();
  removeLegacyAuthKeys();
}

export function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken;
}

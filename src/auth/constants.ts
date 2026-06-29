/** Single source of truth for persisted auth state (Zustand persist). */
export const AUTH_STORAGE_KEY = "owlexa-auth-store";

/** Legacy keys from earlier auth implementations — never write to these again. */
export const LEGACY_AUTH_STORAGE_KEYS = [
  "owlexa-auth",
  "auth-storage",
  "auth-token",
  "token",
] as const;

export const AUTH_STORAGE_VERSION = 1;

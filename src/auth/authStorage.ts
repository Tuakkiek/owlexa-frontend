import type { StateStorage } from "zustand/middleware";
import type { UserInfo } from "../types/auth";
import {
  AUTH_STORAGE_KEY,
  AUTH_STORAGE_VERSION,
  LEGACY_AUTH_STORAGE_KEYS,
} from "./constants";

export interface PersistedAuthState {
  accessToken: string | null;
  user: UserInfo | null;
  isAuthenticated: boolean;
}

/**
 * Removes orphaned auth keys. All auth reads/writes must go through AUTH_STORAGE_KEY only.
 */
export function removeLegacyAuthKeys(): void {
  for (const key of LEGACY_AUTH_STORAGE_KEYS) {
    localStorage.removeItem(key);
  }
}

export function readPersistedAuthState(): PersistedAuthState | null {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as {
      state?: PersistedAuthState;
      version?: number;
    };
    return parsed.state ?? null;
  } catch {
    return null;
  }
}

export function writePersistedAuthState(state: PersistedAuthState): void {
  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({ state, version: AUTH_STORAGE_VERSION })
  );
  removeLegacyAuthKeys();
}

/**
 * Zustand persist adapter — blocks accidental writes to non-canonical keys
 * and purges legacy keys whenever auth state is saved or cleared.
 */
export function createAuthPersistStorage(): StateStorage {
  return {
    getItem: (name) => {
      if (name !== AUTH_STORAGE_KEY) {
        return null;
      }
      return localStorage.getItem(name);
    },
    setItem: (name, value) => {
      if (name !== AUTH_STORAGE_KEY) {
        console.warn(
          `[authStorage] Refusing to persist auth under "${name}". Use "${AUTH_STORAGE_KEY}".`
        );
        return;
      }
      localStorage.setItem(name, value);
      removeLegacyAuthKeys();
    },
    removeItem: (name) => {
      if (name === AUTH_STORAGE_KEY) {
        localStorage.removeItem(name);
      }
      removeLegacyAuthKeys();
    },
  };
}

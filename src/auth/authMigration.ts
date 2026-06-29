import type { UserInfo } from "../types/auth";
import { LEGACY_AUTH_STORAGE_KEYS } from "./constants";
import {
  readPersistedAuthState,
  removeLegacyAuthKeys,
  writePersistedAuthState,
} from "./authStorage";

interface ParsedLegacyAuth {
  accessToken: string;
  user: UserInfo;
}

const VALID_ROLES = new Set<UserInfo["roleName"]>([
  "ADMIN",
  "OWNER",
  "TEACHER",
  "STUDENT",
  "CASHIER",
]);

function isValidRole(value: unknown): value is UserInfo["roleName"] {
  return typeof value === "string" && VALID_ROLES.has(value as UserInfo["roleName"]);
}

function buildUserInfo(source: Record<string, unknown>): UserInfo | null {
  if (!isValidRole(source.roleName)) {
    return null;
  }

  return {
    phoneNumber:
      typeof source.phoneNumber === "string" ? source.phoneNumber : undefined,
    email: typeof source.email === "string" ? source.email : undefined,
    fullName: typeof source.fullName === "string" ? source.fullName : undefined,
    roleName: source.roleName,
    centerName:
      typeof source.centerName === "string" ? source.centerName : undefined,
  };
}

function parseLegacyValue(key: string, raw: string): ParsedLegacyAuth | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  if (
    (key === "token" || key === "auth-token") &&
    trimmed.startsWith("eyJ") &&
    !trimmed.startsWith("{")
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>;

    if (parsed.state && typeof parsed.state === "object") {
      const state = parsed.state as Record<string, unknown>;
      const accessToken =
        (typeof state.accessToken === "string" && state.accessToken) ||
        (typeof state.token === "string" && state.token) ||
        null;
      const user =
        state.user && typeof state.user === "object"
          ? buildUserInfo(state.user as Record<string, unknown>)
          : buildUserInfo(state);

      if (accessToken && user) {
        return { accessToken, user };
      }
    }

    const accessToken =
      (typeof parsed.accessToken === "string" && parsed.accessToken) ||
      (typeof parsed.token === "string" && parsed.token) ||
      null;
    const user =
      parsed.user && typeof parsed.user === "object"
        ? buildUserInfo(parsed.user as Record<string, unknown>)
        : buildUserInfo(parsed);

    if (accessToken && user) {
      return { accessToken, user };
    }
  } catch {
    return null;
  }

  return null;
}

function hasValidCurrentAuth(): boolean {
  const current = readPersistedAuthState();
  return Boolean(
    current?.isAuthenticated &&
      current.accessToken &&
      current.user?.roleName
  );
}

/**
 * Runs once on startup: migrates recoverable legacy auth into owlexa-auth-store,
 * then deletes all legacy keys.
 */
export function migrateLegacyAuthStorage(): void {
  if (hasValidCurrentAuth()) {
    removeLegacyAuthKeys();
    return;
  }

  for (const key of LEGACY_AUTH_STORAGE_KEYS) {
    const raw = localStorage.getItem(key);
    if (!raw) {
      continue;
    }

    const migrated = parseLegacyValue(key, raw);
    if (!migrated) {
      continue;
    }

    writePersistedAuthState({
      accessToken: migrated.accessToken,
      user: migrated.user,
      isAuthenticated: true,
    });
    removeLegacyAuthKeys();
    return;
  }

  removeLegacyAuthKeys();
}

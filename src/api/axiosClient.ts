import axios, { type AxiosResponse } from "axios";
import {
  applyAuthFromResponse,
  clearAuthState,
  getAccessToken,
} from "../auth/authService";
import type { AuthResponse } from "../types/auth";
import { useAuthStore } from "../store/authStore";

const REFRESH_TOKEN_KEY = "owlexa-refresh-token";

// Store refresh token in localStorage (primary) and as a SameSite Lax cookie (secondary backup).
// The cookie path is "/" so it's available for all API requests.
function setRefreshTokenCookie(token: string): void {
  try {
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);
    document.cookie = `refreshToken=${token}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  } catch {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  }
}

function getStoredRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8081",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important for sending/receiving HttpOnly cookies
});

// Request interceptor
axiosClient.interceptors.request.use(
  (config) => {
    const accessToken = getAccessToken();
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // Tenant ID resolved from the authenticated user's stored center.
    // The backend JwtFilter resolves this automatically from the session;
    // the header is sent here for forward compatibility with multi-center users.
    const centerId = useAuthStore.getState().user?.centerId;
    if (centerId != null && config.headers) {
      config.headers["X-Tenant-ID"] = String(centerId);
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const storedRefreshToken = getStoredRefreshToken();
        const res: AxiosResponse<{ refreshToken: string; auth: AuthResponse }> =
          await axios.post(
            `${axiosClient.defaults.baseURL}/auth/refresh-token`,
            {},
            {
              withCredentials: true,
              headers: storedRefreshToken
                ? { "X-Stored-Refresh-Token": storedRefreshToken }
                : {},
            },
          );

        const authData: AuthResponse =
          res.data.auth ?? (res.data as unknown as AuthResponse);
        const newRefreshToken: string = res.data.refreshToken ?? "";

        if (newRefreshToken) {
          setRefreshTokenCookie(newRefreshToken);
        }

        applyAuthFromResponse(authData);

        axiosClient.defaults.headers.common["Authorization"] =
          `Bearer ${authData.accessToken}`;
        originalRequest.headers.Authorization = `Bearer ${authData.accessToken}`;

        processQueue(null, authData.accessToken);

        return axiosClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        clearAuthState();
        // optionally redirect to login
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default axiosClient;

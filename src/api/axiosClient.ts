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

const API_MESSAGE_TRANSLATIONS: Array<[RegExp, string]> = [
  [/^Room is already booked at this time\.?$/i, "Phòng đã được đặt vào thời gian này."],
  [/^Room is already booked by an active recurring rule\.?$/i, "Phòng đã được đặt bởi một lịch lặp đang hoạt động."],
  [/^Room (.+) is already occupied on (.+) from (.+) to (.+)\.?$/i, "Phòng $1 đã có lịch vào $2 từ $3 đến $4."],
  [/^Teacher already has an active recurring rule at this time\.?$/i, "Giáo viên đã có lịch lặp khác vào thời gian này."],
  [/^Teacher (.+) is already teaching another class during this time\.?$/i, "Giáo viên $1 đã có lớp khác vào thời gian này."],
  [/^Student (.+) already has another class during this time\.?$/i, "Học viên $1 đã có lớp khác vào thời gian này."],
  [/^A student in this class already has another recurring schedule at this time\.?$/i, "Có học viên trong lớp này đã có lịch lặp khác vào thời gian này."],
  [/^Schedule already exists for this class at this time\.?$/i, "Lớp này đã có lịch học vào thời gian này."],
  [/^Schedule overlaps with an existing schedule for this class\.?$/i, "Lớp này đã có lịch học trùng thời gian."],
  [/^Schedule overlaps with an active recurring rule for this class\.?$/i, "Lớp này đã có quy tắc lịch lặp trùng thời gian."],
  [/^Schedule event overlaps with an existing event\.?$/i, "Sự kiện lịch bị trùng với một sự kiện đã có."],
  [/^Schedule event overlaps with an existing event for this class\.?$/i, "Lớp này đã có buổi học hoặc sự kiện trùng thời gian."],
  [/^startTime must be before endTime\.?$/i, "Giờ bắt đầu phải trước giờ kết thúc."],
  [/^Start time must be before end time\.?$/i, "Giờ bắt đầu phải trước giờ kết thúc."],
  [/^Start time and end time are required\.?$/i, "Vui lòng nhập giờ bắt đầu và giờ kết thúc."],
  [/^daysOfWeek values must be from 1 to 7\.?$/i, "Thứ học phải nằm trong khoảng từ 1 đến 7."],
  [/^Course must define a positive default session count before creating a recurring schedule\.?$/i, "Khóa học cần có số buổi học lớn hơn 0 trước khi tạo lịch lặp."],
  [/^User is not (a )?TEACHER\.?$/i, "Người dùng được chọn không phải là giáo viên."],
  [/^Teacher is not (a )?member of this center\.?$/i, "Giáo viên không thuộc trung tâm hiện tại."],
];

const translateApiMessage = (message: unknown): unknown => {
  if (typeof message !== "string") return message;
  const match = API_MESSAGE_TRANSLATIONS.find(([pattern]) => pattern.test(message));
  return match ? message.replace(match[0], match[1]) : message;
};

const normalizeApiErrorMessage = (error: any) => {
  const data = error?.response?.data;
  if (data && typeof data === "object" && "message" in data) {
    data.message = translateApiMessage(data.message);
  }
};

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

    normalizeApiErrorMessage(error);
    return Promise.reject(error);
  },
);

export default axiosClient;

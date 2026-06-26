import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { getTenantFromSubdomain } from '../utils/tenant';
import type { AuthResponse } from '../types/auth';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8081',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for sending/receiving HttpOnly cookies
});

// Request interceptor
axiosClient.interceptors.request.use(
  (config) => {
    const accessToken = useAuthStore.getState().accessToken;
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    const tenantId = getTenantFromSubdomain();
    if (tenantId && config.headers) {
      config.headers['X-Tenant-ID'] = tenantId;
    }

    return config;
  },
  (error) => Promise.reject(error)
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
        const { data } = await axios.post<{ data: AuthResponse }>(
          `${axiosClient.defaults.baseURL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );



        // We only extract what's needed for UserInfo. 
        // If the backend returns AuthResponse directly without `data` wrapper, it would be just `data`.
        // Let's assume standard response (we will adjust if backend wraps it).
        const authData = 'data' in data ? (data as any).data : data;

        useAuthStore.getState().setAuth(authData.accessToken, {
          email: authData.email,
          phoneNumber: authData.phoneNumber,
          fullName: authData.fullName,
          roleName: authData.roleName,
          centerName: authData.centerName
        });

        axiosClient.defaults.headers.common['Authorization'] = `Bearer ${authData.accessToken}`;
        originalRequest.headers.Authorization = `Bearer ${authData.accessToken}`;
        
        processQueue(null, authData.accessToken);
        
        return axiosClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        useAuthStore.getState().clearAuth();
        // optionally redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;

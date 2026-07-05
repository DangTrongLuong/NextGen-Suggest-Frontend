import axios from 'axios';
import { useAnalyticsStore } from '../store/store';

const BASE_URL = '';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  withCredentials: true, // Send HttpOnly refresh cookies automatically
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Access Token from Zustand store
api.interceptors.request.use(
  (config) => {
    const accessToken = useAnalyticsStore.getState().accessToken;
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Token Refresh on 401
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => {
    // Return standard payload directly
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // Standardize error formats: { success: false, message: "...", error_code: "..." }
    const errorData = error.response?.data || {
      success: false,
      message: error.message || 'Không thể kết nối đến máy chủ giám sát.',
      error_code: 'SERVER_CONNECTION_ERROR'
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't loop refresh on authentication endpoints themselves
      if (
        originalRequest.url?.includes('/analytics/auth/refresh') ||
        originalRequest.url?.includes('/analytics/auth/login') ||
        originalRequest.url?.includes('/analytics/auth/logout')
      ) {
        return Promise.reject(errorData);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Silent token rotation: sends HTTP POST request. Browser sends HttpOnly cookies.
        const res = await api.post('/analytics/auth/refresh');
        const newAccessToken = res.data.access_token;

        useAnalyticsStore.getState().setAccessToken(newAccessToken);
        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAnalyticsStore.getState().logoutUser();
        return Promise.reject(errorData); // Reject with original 401 error
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(errorData);
  }
);

export default api;
export { BASE_URL };

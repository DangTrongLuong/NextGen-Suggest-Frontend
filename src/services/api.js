import axios from 'axios';
import toast from 'react-hot-toast';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 45000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor: attach JWT ──────────────────────
api.interceptors.request.use(
  (config) => {
    const stored = localStorage.getItem('auth_tokens');
    if (stored) {
      try {
        const { accessToken } = JSON.parse(stored);
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
      } catch {
        localStorage.removeItem('auth_tokens');
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 / token refresh ─────
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
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't try to refresh on auth endpoints themselves
      if (originalRequest.url?.includes('/auth/refresh') || originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/register')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const stored = localStorage.getItem('auth_tokens');
      if (stored) {
        try {
          const { refreshToken } = JSON.parse(stored);
          const res = await api.post('/auth/refresh', { refreshToken });
          const { accessToken, refreshToken: newRefresh } = res.data.data;

          localStorage.setItem('auth_tokens', JSON.stringify({
            accessToken,
            refreshToken: newRefresh,
          }));

          processQueue(null, accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          localStorage.removeItem('auth_tokens');
          localStorage.removeItem('user');
          window.dispatchEvent(new Event('auth-change'));
          sessionStorage.setItem('auth_expired_msg', 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          if (window.location.pathname !== '/') {
            window.location.href = '/';
          } else {
            window.location.reload();
          }
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        sessionStorage.setItem('auth_expired_msg', 'Vui lòng đăng nhập để tiếp tục.');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        } else {
          window.location.reload();
        }
      }
    }

    if (error.response?.status === 403) {
      toast.error('Bạn không có quyền thực hiện thao tác này');
    }

    return Promise.reject(error);
  }
);

export default api;

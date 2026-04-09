/**
 * @fileoverview Axios instance được cấu hình sẵn cho toàn app.
 * Bao gồm interceptors để xử lý token tự động và lỗi toàn cục.
 */

import axios from 'axios';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const USER_KEY = 'auth_user';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const refreshClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers = config.headers || {};
  config.headers['x-device-name'] = `${navigator.platform || 'web'}-${navigator.userAgent?.slice(0, 32) || 'browser'}`;
  return config;
});

let isRefreshing = false;
let refreshPromise = null;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

const clearAuthStorage = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  delete api.defaults.headers.common['Authorization'];
};

const redirectToLogin = () => {
  if (window.location.pathname !== '/login' && window.location.pathname !== '/login/admin') {
    window.location.href = '/login';
  }
};

/**
 * Response interceptor: chuẩn hóa error để code gọi không phải check nhiều tầng
 */
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config || {};

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !String(originalRequest.url || '').includes('/auth/refresh')
    ) {
      const currentRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (!currentRefreshToken) {
        clearAuthStorage();
        redirectToLogin();
        return Promise.reject(new Error('Phiên đăng nhập đã hết hạn'));
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      refreshPromise = refreshClient.post('/auth/refresh', { refreshToken: currentRefreshToken });

      try {
        const refreshResponse = await refreshPromise;
        const newToken = refreshResponse?.data?.data?.token;
        const newRefreshToken = refreshResponse?.data?.data?.refreshToken;
        if (!newToken || !newRefreshToken) {
          throw new Error('Không thể làm mới phiên đăng nhập');
        }

        localStorage.setItem(TOKEN_KEY, newToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        processQueue(null, newToken);

        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuthStorage();
        redirectToLogin();
        return Promise.reject(new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'));
      } finally {
        isRefreshing = false;
        refreshPromise = null;
      }
    }

    const message =
      error.response?.data?.message ||
      error.message ||
      'Đã có lỗi xảy ra. Vui lòng thử lại.';

    if (error.response?.status === 401) {
      clearAuthStorage();
      redirectToLogin();
    }

    return Promise.reject(new Error(message));
  }
);

export default api;

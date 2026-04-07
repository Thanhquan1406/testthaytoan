/**
 * @fileoverview Axios instance được cấu hình sẵn cho toàn app.
 * Bao gồm interceptors để xử lý token tự động và lỗi toàn cục.
 */

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Response interceptor: chuẩn hóa error để code gọi không phải check nhiều tầng
 */
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Đã có lỗi xảy ra. Vui lòng thử lại.';

    // Token hết hạn - xóa auth và reload
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      // Reload về trang login nếu đang ở trang cần auth
      if (window.location.pathname !== '/login' && window.location.pathname !== '/login/admin') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(new Error(message));
  }
);

export default api;

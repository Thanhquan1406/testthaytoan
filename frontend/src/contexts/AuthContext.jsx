/**
 * @fileoverview Context quản lý trạng thái xác thực toàn app.
 * Lưu thông tin user, token, và expose các hàm login/logout.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

/**
 * @typedef {Object} AuthUser
 * @property {string} _id - ObjectId MongoDB
 * @property {string} maNguoiDung - Mã hiển thị
 * @property {string} ho - Họ
 * @property {string} ten - Tên
 * @property {string} hoTen - Họ tên đầy đủ
 * @property {string} email - Email
 * @property {string} vaiTro - ADMIN | GIAO_VIEN | SINH_VIEN
 */

/**
 * @typedef {Object} AuthContextValue
 * @property {AuthUser|null} user - Thông tin người dùng hiện tại
 * @property {string|null} token - JWT access token
 * @property {boolean} isLoading - Đang kiểm tra auth không
 * @property {boolean} isAuthenticated - Đã đăng nhập chưa
 * @property {Function} login - Đăng nhập với { token, nguoiDung }
 * @property {Function} logout - Đăng xuất
 */

const AuthContext = createContext(null);

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

/**
 * Provider bao bọc toàn bộ app, cung cấp auth state
 * @param {{ children: React.ReactNode }} props
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Khôi phục session từ localStorage khi load lại trang
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    const savedUser = localStorage.getItem(USER_KEY);

    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setToken(savedToken);
        setUser(parsedUser);
        // Gắn token vào axios instance
        api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
      } catch {
        // Dữ liệu bị corrupt - xóa đi
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  /**
   * Lưu thông tin đăng nhập vào state và localStorage
   * @param {{ token: string, nguoiDung: AuthUser }} data
   */
  const login = useCallback(({ token: newToken, nguoiDung }) => {
    setToken(newToken);
    setUser(nguoiDung);
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nguoiDung));
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
  }, []);

  /** Xóa toàn bộ thông tin auth */
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    delete api.defaults.headers.common['Authorization'];
  }, []);

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token && !!user,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook tiện lợi để lấy auth context
 * @returns {AuthContextValue}
 * @throws {Error} Nếu dùng ngoài AuthProvider
 */
export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext phải được dùng trong AuthProvider');
  return ctx;
};

export default AuthContext;

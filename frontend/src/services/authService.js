/**
 * @fileoverview Service gọi các API xác thực.
 */

import api from './api';

/**
 * Lấy CAPTCHA mới
 * @returns {Promise<{captchaId: string, question: string}>}
 */
export const getCaptcha = () => api.get('/auth/captcha').then((r) => r.data);

/**
 * Đăng ký tài khoản
 * @param {object} data - { ho, ten, email, soDienThoai, matKhau, vaiTro, captchaId, captchaAnswer }
 */
export const register = (data) => api.post('/auth/register', data).then((r) => r.data);

/**
 * Đăng nhập (sinh viên / giáo viên)
 * @param {{ email: string, matKhau: string, captchaId: string, captchaAnswer: string }} data
 */
export const login = (data) => api.post('/auth/login', data).then((r) => r.data);

/**
 * Đăng nhập admin
 */
export const loginAdmin = (data) => api.post('/auth/login/admin', data).then((r) => r.data);

/**
 * Đăng nhập bằng Google OAuth
 * @param {string} credential - Google ID token từ @react-oauth/google
 * @returns {Promise<{token, nguoiDung} | {needsRegistration: true, googleData}>}
 */
export const loginGoogle = (credential) =>
  api.post('/auth/google', { credential }).then((r) => r.data);

/**
 * Hoàn tất đăng ký tài khoản mới qua Google
 * @param {{ credential: string, vaiTro: string, soDienThoai: string }} data
 */
export const registerGoogle = (data) =>
  api.post('/auth/google/register', data).then((r) => r.data);

/**
 * Kiểm tra email đã tồn tại
 * @param {string} email
 * @returns {Promise<{exists: boolean}>}
 */
export const checkEmail = (email) =>
  api.get('/auth/check-email', { params: { email } }).then((r) => r.data);

/**
 * Kiểm tra SĐT đã tồn tại
 * @param {string} soDienThoai
 */
export const checkSdt = (soDienThoai) =>
  api.get('/auth/check-sdt', { params: { soDienThoai } }).then((r) => r.data);

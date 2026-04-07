/**
 * @fileoverview API service cho quản lý hồ sơ người dùng.
 * Dùng chung cho tất cả vai trò (sinh viên, giáo viên, admin).
 */

import api from './api';

/**
 * Lấy hồ sơ của user hiện tại
 * @returns {Promise<object>} Thông tin hồ sơ
 */
export const getHoSo = () => api.get('/ho-so').then((r) => r.data.data);

/**
 * Cập nhật hồ sơ người dùng
 * @param {{ ho: string, ten: string, soDienThoai: string }} data
 * @returns {Promise<object>} Hồ sơ sau khi cập nhật
 */
export const updateHoSo = (data) =>
  api.put('/ho-so', data).then((r) => r.data.data);

/**
 * Đổi mật khẩu
 * @param {{ matKhauCu: string, matKhauMoi: string, xacNhanMatKhau: string }} data
 * @returns {Promise<void>}
 */
export const doiMatKhau = (data) =>
  api.put('/ho-so/doi-mat-khau', data).then((r) => r.data);

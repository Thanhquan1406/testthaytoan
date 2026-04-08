/**
 * @fileoverview Service gọi API Admin.
 */

import api from './api';

// Dashboard
export const getDashboard = () => api.get('/admin/dashboard').then((r) => r.data);

// Người dùng
export const getDanhSachNguoiDung = (params) =>
  api.get('/admin/nguoi-dung', { params }).then((r) => r);
export const getNguoiDung = (id) => api.get(`/admin/nguoi-dung/${id}`).then((r) => r.data);
export const updateNguoiDung = (id, data) =>
  api.put(`/admin/nguoi-dung/${id}`, data).then((r) => r.data);
export const resetMatKhau = (id, matKhauMoi) =>
  api.put(`/admin/nguoi-dung/${id}/mat-khau`, { matKhauMoi }).then((r) => r);
export const doiVaiTro = (id, vaiTro) =>
  api.put(`/admin/nguoi-dung/${id}/vai-tro`, { vaiTro }).then((r) => r.data);
export const xoaNguoiDung = (id) => api.delete(`/admin/nguoi-dung/${id}`).then((r) => r);

// Môn học
export const getDanhSachMonHoc = () => api.get('/admin/mon-hoc').then((r) => r.data);
export const taoMonHoc = (data) => api.post('/admin/mon-hoc', data).then((r) => r.data);
export const updateMonHoc = (id, data) =>
  api.put(`/admin/mon-hoc/${id}`, data).then((r) => r.data);
export const xoaMonHoc = (id) => api.delete(`/admin/mon-hoc/${id}`).then((r) => r);

// Đề thi (admin view)
export const getThongKeDeThi = () =>
  api.get('/admin/de-thi/thong-ke').then((r) => r.data);
export const getDanhSachDeThi = (params) =>
  api.get('/admin/de-thi', { params }).then((r) => r);
export const xoaHanDeThi = (id) => api.delete(`/admin/de-thi/${id}`).then((r) => r);
export const getDanhSachCauHoi = (params) =>
  api.get('/admin/cau-hoi', { params }).then((r) => r);

// Hồ sơ Admin
export const getHoSo = () => api.get('/admin/ho-so').then((r) => r.data);
export const updateHoSo = (data) => api.put('/admin/ho-so', data).then((r) => r.data);
export const doiMatKhau = (data) => api.post('/admin/ho-so/doi-mat-khau', data).then((r) => r);

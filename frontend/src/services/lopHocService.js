/**
 * @fileoverview Service gọi API quản lý lớp học.
 */

import api from './api';

const GV_BASE = '/giao-vien/lop-hoc';
const SV_BASE = '/sinh-vien/phong-thi';

// Giáo viên
export const getDanhSach = () => api.get(GV_BASE).then((r) => r.data);
export const getById = (id) => api.get(`${GV_BASE}/${id}`).then((r) => r.data);
export const create = (data) => api.post(GV_BASE, data).then((r) => r.data);
export const update = (id, data) => api.put(`${GV_BASE}/${id}`, data).then((r) => r.data);
export const remove = (id) => api.delete(`${GV_BASE}/${id}`).then((r) => r);
export const getSinhVien = (keyword) =>
  api.get(`${GV_BASE}/sinh-vien`, { params: { keyword } }).then((r) => r.data);

// Sinh viên
export const getPhongThi = () => api.get(SV_BASE).then((r) => r.data);
export const getPhongThiChiTiet = (lopId) => api.get(`${SV_BASE}/${lopId}`).then((r) => r.data);
export const getDeThibyLop = (lopId) => api.get(`${SV_BASE}/${lopId}/de-thi`).then((r) => r.data);

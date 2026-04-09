/**
 * @fileoverview Service gọi API quản lý lớp học.
 */

import api from './api';

const GV_BASE = '/giao-vien/lop-hoc';
const SV_BASE = '/sinh-vien/phong-thi';

// ─── Giáo viên ─────────────────────────────────────────────────────────────────
export const getDanhSach = () => api.get(GV_BASE).then((r) => r.data);
export const getById = (id) => api.get(`${GV_BASE}/${id}`).then((r) => r.data);
export const create = (data) => api.post(GV_BASE, data).then((r) => r.data);
export const update = (id, data) => api.put(`${GV_BASE}/${id}`, data).then((r) => r.data);
export const remove = (id) => api.delete(`${GV_BASE}/${id}`).then((r) => r);

// Tìm sinh viên theo MSSV chính xác
export const timSinhVien = (mssv) =>
  api.get(`${GV_BASE}/tim-sinh-vien`, { params: { mssv } }).then((r) => r.data);

// Quản lý sinh viên trong lớp
export const themSinhVien = (lopId, sinhVienId) =>
  api.post(`${GV_BASE}/${lopId}/sinh-vien`, { sinhVienId }).then((r) => r.data);
export const xoaSinhVien = (lopId, sinhVienId) =>
  api.delete(`${GV_BASE}/${lopId}/sinh-vien/${sinhVienId}`).then((r) => r.data);
export const importSinhVienExcel = (lopId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api
    .post(`${GV_BASE}/${lopId}/import-sinh-vien`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
};

// Đề thi và bảng điểm theo lớp
export const getDeThiCuaLop = (lopId) =>
  api.get(`${GV_BASE}/${lopId}/de-thi`).then((r) => r.data);
export const getBangDiem = (lopId, deThiId) =>
  api.get(`${GV_BASE}/${lopId}/bang-diem`, { params: { deThiId } }).then((r) => r.data);

// ─── Sinh viên ──────────────────────────────────────────────────────────────────
export const getPhongThi = () => api.get(SV_BASE).then((r) => r.data);
export const getPhongThiChiTiet = (lopId) => api.get(`${SV_BASE}/${lopId}`).then((r) => r.data);
export const getDeThibyLop = (lopId) => api.get(`${SV_BASE}/${lopId}/de-thi`).then((r) => r.data);

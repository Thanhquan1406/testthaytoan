/**
 * @fileoverview Service gọi API quản lý đề thi (Giáo viên).
 */

import api from './api';

const BASE = '/giao-vien/de-thi';

export const getDanhSach = (params) => api.get(BASE, { params }).then((r) => r);
export const getThungRac = () => api.get(`${BASE}/thung-rac`).then((r) => r.data);
export const getMonHoc = () => api.get(`${BASE}/mon-hoc`).then((r) => r.data);
export const getById = (id) => api.get(`${BASE}/${id}`).then((r) => r.data);
export const create = (data) => api.post(BASE, data).then((r) => r.data);
export const update = (id, data) => api.put(`${BASE}/${id}`, data).then((r) => r.data);
export const softDelete = (id) => api.delete(`${BASE}/${id}`).then((r) => r);
export const restore = (id) => api.post(`${BASE}/${id}/khoi-phuc`).then((r) => r);
export const forceDelete = (id) => api.delete(`${BASE}/${id}/xoa-han`).then((r) => r);

export const addQuestions = (id, cauHoiIds) =>
  api.post(`${BASE}/${id}/cau-hoi`, { cauHoiIds }).then((r) => r.data);
export const removeQuestion = (id, cauHoiId) =>
  api.delete(`${BASE}/${id}/cau-hoi/${cauHoiId}`).then((r) => r.data);

export const publishToClass = (id, lopHocId) =>
  api.post(`${BASE}/${id}/xuat-ban-lop`, { lopHocId }).then((r) => r.data);
export const revokeFromClass = (id, lopHocId) =>
  api.delete(`${BASE}/${id}/thu-hoi-lop`, { data: { lopHocId } }).then((r) => r);

export const createPublicLink = (id) =>
  api.post(`${BASE}/${id}/link-cong-khai`).then((r) => r.data);
export const revokePublicLink = (id) =>
  api.delete(`${BASE}/${id}/link-cong-khai`).then((r) => r);

/**
 * Import câu hỏi từ file PDF/DOCX vào đề thi.
 * @param {string} deThiId
 * @param {File} file - File object từ input
 * @param {string} chuDeId - ObjectId chủ đề để lưu câu hỏi
 */
export const importFile = (deThiId, file, chuDeId) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('chuDeId', chuDeId);
  return api
    .post(`${BASE}/${deThiId}/import`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
};

/** Tạo đề thi từ bộ câu hỏi sinh ra từ ma trận */
export const taoDeThiTuMaTran = (data) => api.post(`${BASE}/tao-tu-ma-tran`, data).then(r => r.data);

/** Parse file lấy string nội dung mà không cần ngân hàng */
export const parseFile = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api
    .post(`${BASE}/parse-file`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
};

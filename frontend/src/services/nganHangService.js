/**
 * @fileoverview Service gọi API Ngân hàng câu hỏi (module mới).
 * Bao gồm: CRUD Ngân hàng, CRUD Cấu trúc, Import file, Câu hỏi.
 */

import api from './api';

const BASE = '/giao-vien/ngan-hang';

// ─── NGÂN HÀNG ───────────────────────────────────────────────────────────────

/** Lấy danh sách ngân hàng của giáo viên đang đăng nhập */
export const layDanhSachNganHang = () => api.get(BASE).then((r) => r);

/** Tạo ngân hàng mới */
export const taoNganHang = (data) => api.post(BASE, data).then((r) => r);

/** Lấy chi tiết ngân hàng */
export const layChiTietNganHang = (id) => api.get(`${BASE}/${id}`).then((r) => r);

/** Cập nhật ngân hàng */
export const capNhatNganHang = (id, data) => api.put(`${BASE}/${id}`, data).then((r) => r);

/** Xóa ngân hàng (soft delete) */
export const xoaNganHang = (id) => api.delete(`${BASE}/${id}`).then((r) => r);

/** Lấy danh sách môn học (cho dropdown) */
export const layDanhSachMonHoc = () => api.get(`${BASE}/mon-hoc`).then((r) => r);

// ─── CẤU TRÚC ────────────────────────────────────────────────────────────────

/** Lấy danh sách cấu trúc (flat) theo ngân hàng */
export const layCauTruc = (nganHangId) =>
  api.get(`${BASE}/${nganHangId}/cau-truc`).then((r) => r);

/** Tạo cấu trúc mới */
export const taoCauTruc = (nganHangId, data) =>
  api.post(`${BASE}/${nganHangId}/cau-truc`, data).then((r) => r);

/** Cập nhật cấu trúc */
export const capNhatCauTruc = (nganHangId, id, data) =>
  api.put(`${BASE}/${nganHangId}/cau-truc/${id}`, data).then((r) => r);

/** Xóa cấu trúc (đệ quy xóa con cháu) */
export const xoaCauTruc = (nganHangId, id) =>
  api.delete(`${BASE}/${nganHangId}/cau-truc/${id}`).then((r) => r);

// ─── IMPORT / CÂU HỎI ────────────────────────────────────────────────────────

/** Import file DOCX/PDF vào ngân hàng */
export const importFile = (nganHangId, formData) =>
  api.post(`${BASE}/${nganHangId}/import`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r);

/** Lưu mảng câu hỏi đã soạn vào ngân hàng */
export const luuCauHoi = (nganHangId, questions, cauTrucId = null) =>
  api.post(`${BASE}/${nganHangId}/cau-hoi`, { questions, cauTrucId }).then((r) => r);

/** Lấy câu hỏi trong ngân hàng (có filter, phân trang) */
export const layCauHoi = (nganHangId, params = {}) =>
  api.get(`${BASE}/${nganHangId}/cau-hoi`, { params }).then((r) => r);

/** Tạo danh sách câu hỏi raw từ ma trận */
export const taoDeTuMaTran = (nganHangId, requirements) =>
  api.post(`${BASE}/${nganHangId}/tao-de-tu-ma-tran`, { requirements }).then((r) => r);

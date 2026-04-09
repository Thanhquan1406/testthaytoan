/**
 * @fileoverview Service gọi API luồng thi (Sinh viên + Ẩn danh).
 */

import api from './api';
import axios from 'axios';

const SV_BASE = '/sinh-vien/thi';
const ANON_BASE = '/public/thi-an-danh/phien';

// ─── Sinh viên đăng nhập ─────────────────────────────────────────────────────
export const batDau = (deThiId, lopHocId) =>
  api.post(`${SV_BASE}/bat-dau`, { deThiId, lopHocId }).then((r) => r.data);

export const getNoiDung = (phienThiId) =>
  api.get(`${SV_BASE}/phien/${phienThiId}/noi-dung`).then((r) => r.data);

export const luuTraLoi = (phienThiId, cauHoiId, noiDungTraLoi) =>
  api.post(`${SV_BASE}/phien/${phienThiId}/luu`, { cauHoiId, noiDungTraLoi }).then((r) => r);

export const nopBai = (phienThiId) =>
  api.post(`${SV_BASE}/phien/${phienThiId}/nop-bai`).then((r) => r.data);

export const viPham = (phienThiId, hanhVi) =>
  api.post(`${SV_BASE}/phien/${phienThiId}/vi-pham`, { hanhVi }).then((r) => r.data);

export const getKetQua = (phienThiId) =>
  api.get(`${SV_BASE}/phien/${phienThiId}/ket-qua`).then((r) => r.data);

/**
 * Lấy lịch sử thi của sinh viên (có phân trang)
 * @param {number} [page=1] - Trang hiện tại
 * @returns {Promise<{ data: object[], meta: object }>}
 */
export const layLichSuThi = (page = 1) =>
  api.get('/sinh-vien/lich-su-thi', { params: { page } }).then((r) => r.data);

/**
 * Lấy chi tiết một lịch sử bài làm
 * @param {string} phienThiId
 * @returns {Promise<object>}
 */
export const getLichSuChiTiet = (phienThiId) =>
  api.get(`/sinh-vien/lich-su-thi/${phienThiId}`).then((r) => r.data);

// ─── Thi ẩn danh ─────────────────────────────────────────────────────────────

/**
 * Tạo axios instance riêng cho thi ẩn danh (dùng anonymous token)
 * @param {string} anonymousToken
 */
const anonApi = (anonymousToken) =>
  axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    headers: { Authorization: `Bearer ${anonymousToken}` },
  });

export const getNoiDungAnDanh = (phienThiId, token) =>
  anonApi(token).get(`${ANON_BASE}/${phienThiId}/noi-dung`).then((r) => r.data.data);

export const luuTraLoiAnDanh = (phienThiId, token, cauHoiId, noiDungTraLoi) =>
  anonApi(token).post(`${ANON_BASE}/${phienThiId}/luu`, { cauHoiId, noiDungTraLoi });

export const nopBaiAnDanh = (phienThiId, token) =>
  anonApi(token).post(`${ANON_BASE}/${phienThiId}/nop-bai`).then((r) => r.data.data);

export const viPhamAnDanh = (phienThiId, token, hanhVi) =>
  anonApi(token).post(`${ANON_BASE}/${phienThiId}/vi-pham`, { hanhVi });

export const getKetQuaAnDanh = (phienThiId, token) =>
  anonApi(token).get(`${ANON_BASE}/${phienThiId}/ket-qua`).then((r) => r.data.data);

/**
 * @fileoverview Service gọi API ngân hàng câu hỏi (Giáo viên).
 */

import api from './api';

const BASE = '/giao-vien/ngan-hang-cau-hoi';

export const getDanhSach = (params) => api.get(BASE, { params }).then((r) => r);
export const getMonHoc = () => api.get(`${BASE}/mon-hoc`).then((r) => r.data);
export const getChuDe = (monHocId) =>
  api.get(`${BASE}/chu-de`, { params: { monHocId } }).then((r) => r.data);
export const createChuDe = (monHocId, ten) =>
  api.post(`${BASE}/chu-de`, { monHocId, ten }).then((r) => r.data);
export const create = (data) => api.post(BASE, data).then((r) => r.data);
export const update = (id, data) => api.put(`${BASE}/${id}`, data).then((r) => r.data);
export const remove = (id) => api.delete(`${BASE}/${id}`).then((r) => r);

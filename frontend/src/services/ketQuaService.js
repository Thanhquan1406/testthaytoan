/**
 * @fileoverview Service gọi API kết quả thi (Giáo viên).
 */

import api from './api';

const BASE = '/giao-vien/ket-qua';

export const getKetQua = (params) => api.get(BASE, { params }).then((r) => r.data);
export const getDanhSachDeThi = () => api.get(`${BASE}/de-thi`).then((r) => r.data);
export const getDanhSachLop = () => api.get(`${BASE}/lop`).then((r) => r.data);
export const xemBaiThi = (phienThiId) =>
  api.get(`${BASE}/phien/${phienThiId}/xem`).then((r) => r.data);
export const capNhatGhiChu = (phienThiId, ghiChu) =>
  api.put(`${BASE}/${phienThiId}/ghi-chu`, { ghiChu }).then((r) => r.data);
export const capNhatDiem = (phienThiId, tongDiem) =>
  api.put(`${BASE}/${phienThiId}/diem`, { tongDiem }).then((r) => r.data);

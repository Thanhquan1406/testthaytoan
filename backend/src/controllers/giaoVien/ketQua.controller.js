/**
 * @fileoverview Controller kết quả thi (Giáo viên xem và quản lý).
 */

const ketQuaService = require('../../services/ketQua.service');
const { success } = require('../../utils/apiResponse');

const GV_ID = (req) => req.user.id;

/** GET /api/giao-vien/ket-qua?deThiId=...&lopHocId=... */
const getKetQua = async (req, res, next) => {
  try {
    const data = await ketQuaService.layKetQuaTheoDeVaLop(GV_ID(req), req.query);
    return success(res, data);
  } catch (err) {
    return next(err);
  }
};

/** PUT /api/giao-vien/ket-qua/:phienThiId/ghi-chu */
const updateGhiChu = async (req, res, next) => {
  try {
    const data = await ketQuaService.capNhatGhiChu(req.params.phienThiId, GV_ID(req), req.body.ghiChu);
    return success(res, data, 'Cập nhật ghi chú thành công');
  } catch (err) {
    return next(err);
  }
};

/** PUT /api/giao-vien/ket-qua/:phienThiId/diem */
const updateDiem = async (req, res, next) => {
  try {
    const data = await ketQuaService.capNhatDiem(req.params.phienThiId, GV_ID(req), req.body.tongDiem);
    return success(res, data, 'Cập nhật điểm thành công');
  } catch (err) {
    return next(err);
  }
};

/** GET /api/giao-vien/ket-qua/phien/:phienThiId/xem */
const xemBaiThi = async (req, res, next) => {
  try {
    const data = await ketQuaService.xemChiTietBaiLam(req.params.phienThiId, GV_ID(req));
    return success(res, data);
  } catch (err) {
    return next(err);
  }
};

/** GET /api/giao-vien/ket-qua/de-thi */
const getDanhSachDeThi = async (req, res, next) => {
  try {
    const data = await ketQuaService.layDanhSachDeThi(GV_ID(req));
    return success(res, data);
  } catch (err) {
    return next(err);
  }
};

/** GET /api/giao-vien/ket-qua/lop */
const getDanhSachLop = async (req, res, next) => {
  try {
    const data = await ketQuaService.layDanhSachLop(GV_ID(req));
    return success(res, data);
  } catch (err) {
    return next(err);
  }
};

module.exports = { getKetQua, updateGhiChu, updateDiem, xemBaiThi, getDanhSachDeThi, getDanhSachLop };

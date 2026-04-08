/**
 * @fileoverview Controller phiên thi ẩn danh - các thao tác trong khi thi.
 * Token riêng được cấp khi bắt đầu thi, không cần đăng nhập hệ thống.
 */

const thiService = require('../../services/thi.service');
const { kiemTraTokenAnDanh } = require('../../services/jwt.service');
const { success } = require('../../utils/apiResponse');
const { unauthorized } = require('../../utils/apiResponse');

/**
 * Middleware xác thực token thi ẩn danh
 */
const verifyAnonymousToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return unauthorized(res, 'Token thi ẩn danh không được cung cấp');
  }
  try {
    req.phienThi = kiemTraTokenAnDanh(authHeader.split(' ')[1]);
    return next();
  } catch {
    return unauthorized(res, 'Token thi ẩn danh không hợp lệ hoặc đã hết hạn');
  }
};

/** Ràng buộc token ẩn danh chỉ thao tác đúng phiên đã cấp */
const ensureAnonymousSessionMatch = (req, res, next) => {
  if (req.phienThi?.phienThiId?.toString() !== req.params.phienThiId?.toString()) {
    return unauthorized(res, 'Token không hợp lệ cho phiên thi này');
  }
  return next();
};

/** GET /api/thi-an-danh/phien/:phienThiId/noi-dung */
const getNoiDung = async (req, res, next) => {
  try {
    // null = thi ẩn danh (không có nguoiDungId)
    const data = await thiService.layNoiDungBaiThi(req.params.phienThiId, null);
    return success(res, data);
  } catch (err) {
    return next(err);
  }
};

/** POST /api/thi-an-danh/phien/:phienThiId/luu */
const luuTraLoi = async (req, res, next) => {
  try {
    const { cauHoiId, noiDungTraLoi } = req.body;
    await thiService.luuTraLoi(req.params.phienThiId, null, cauHoiId, noiDungTraLoi);
    return success(res, null, 'Đã lưu');
  } catch (err) {
    return next(err);
  }
};

/** POST /api/thi-an-danh/phien/:phienThiId/nop-bai */
const nopBai = async (req, res, next) => {
  try {
    const data = await thiService.nopBai(req.params.phienThiId, null);
    return success(res, data, 'Nộp bài thành công');
  } catch (err) {
    return next(err);
  }
};

/** POST /api/thi-an-danh/phien/:phienThiId/vi-pham */
const viPham = async (req, res, next) => {
  try {
    const soLan = await thiService.xuLyViPham(req.params.phienThiId, null, req.body.hanhVi);
    return success(res, { soLanViPham: soLan });
  } catch (err) {
    return next(err);
  }
};

/** GET /api/thi-an-danh/phien/:phienThiId/ket-qua */
const getKetQua = async (req, res, next) => {
  try {
    const data = await thiService.layKetQua(req.params.phienThiId, null);
    return success(res, data);
  } catch (err) {
    return next(err);
  }
};

/** GET /api/thi-an-danh/phien/:phienThiId/chi-tiet */
const getChiTiet = async (req, res, next) => {
  try {
    const data = await thiService.layChiTietLichSu(req.params.phienThiId, null);
    return success(res, data);
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  verifyAnonymousToken,
  ensureAnonymousSessionMatch,
  getNoiDung,
  luuTraLoi,
  nopBai,
  viPham,
  getKetQua,
  getChiTiet,
};

/**
 * @fileoverview Controller ngân hàng câu hỏi (Giáo viên).
 */

const cauHoiService = require('../../services/cauHoi.service');
const { success, created } = require('../../utils/apiResponse');

const GV_ID = (req) => req.user.id;

/** GET /api/giao-vien/ngan-hang-cau-hoi */
const getAll = async (req, res, next) => {
  try {
    const result = await cauHoiService.layDanhSach(GV_ID(req), req.query);
    return success(res, result.data, 'Thành công', 200, result.meta);
  } catch (err) {
    return next(err);
  }
};

/** POST /api/giao-vien/ngan-hang-cau-hoi */
const create = async (req, res, next) => {
  try {
    const data = await cauHoiService.taoCauHoi(GV_ID(req), req.body);
    return created(res, data, 'Tạo câu hỏi thành công');
  } catch (err) {
    return next(err);
  }
};

/** PUT /api/giao-vien/ngan-hang-cau-hoi/:id */
const update = async (req, res, next) => {
  try {
    const data = await cauHoiService.capNhatCauHoi(req.params.id, GV_ID(req), req.body);
    return success(res, data, 'Cập nhật câu hỏi thành công');
  } catch (err) {
    return next(err);
  }
};

/** DELETE /api/giao-vien/ngan-hang-cau-hoi/:id */
const remove = async (req, res, next) => {
  try {
    await cauHoiService.xoaCauHoi(req.params.id, GV_ID(req));
    return success(res, null, 'Xóa câu hỏi thành công');
  } catch (err) {
    return next(err);
  }
};

/** GET /api/giao-vien/ngan-hang-cau-hoi/mon-hoc */
const getMonHoc = async (_req, res, next) => {
  try {
    const data = await cauHoiService.layDanhSachMonHoc();
    return success(res, data);
  } catch (err) {
    return next(err);
  }
};

/** GET /api/giao-vien/ngan-hang-cau-hoi/chu-de */
const getChuDe = async (req, res, next) => {
  try {
    const data = await cauHoiService.layDanhSachChuDe(req.query.monHocId);
    return success(res, data);
  } catch (err) {
    return next(err);
  }
};

/** POST /api/giao-vien/ngan-hang-cau-hoi/chu-de */
const createChuDe = async (req, res, next) => {
  try {
    const data = await cauHoiService.taoChuDe(req.body.monHocId, req.body.ten);
    return created(res, data, 'Tạo chủ đề thành công');
  } catch (err) {
    return next(err);
  }
};

module.exports = { getAll, create, update, remove, getMonHoc, getChuDe, createChuDe };

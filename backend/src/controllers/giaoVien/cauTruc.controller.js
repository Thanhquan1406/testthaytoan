/**
 * @fileoverview Controller quản lý Cấu trúc (cây thư mục) trong ngân hàng câu hỏi.
 */

const cauTrucService = require('../../services/cauTruc.service');
const { success, created } = require('../../utils/apiResponse');

const GV_ID = (req) => req.user.id;

/** GET /api/giao-vien/ngan-hang/:nganHangId/cau-truc */
const getAll = async (req, res, next) => {
  try {
    const data = await cauTrucService.layDanhSach(req.params.nganHangId, GV_ID(req));
    return success(res, data);
  } catch (err) {
    return next(err);
  }
};

/** POST /api/giao-vien/ngan-hang/:nganHangId/cau-truc */
const create = async (req, res, next) => {
  try {
    const data = await cauTrucService.taoCauTruc(GV_ID(req), {
      ...req.body,
      nganHangId: req.params.nganHangId,
    });
    return created(res, data, 'Tạo cấu trúc thành công');
  } catch (err) {
    return next(err);
  }
};

/** PUT /api/giao-vien/ngan-hang/:nganHangId/cau-truc/:id */
const update = async (req, res, next) => {
  try {
    const data = await cauTrucService.capNhatCauTruc(
      req.params.id,
      req.params.nganHangId,
      GV_ID(req),
      req.body
    );
    return success(res, data, 'Cập nhật cấu trúc thành công');
  } catch (err) {
    return next(err);
  }
};

/** DELETE /api/giao-vien/ngan-hang/:nganHangId/cau-truc/:id */
const remove = async (req, res, next) => {
  try {
    await cauTrucService.xoaCauTruc(req.params.id, req.params.nganHangId, GV_ID(req));
    return success(res, null, 'Xóa cấu trúc thành công');
  } catch (err) {
    return next(err);
  }
};

module.exports = { getAll, create, update, remove };

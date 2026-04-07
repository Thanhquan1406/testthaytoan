/**
 * @fileoverview Controller xem và quản lý đề thi (Admin view).
 */

const adminService = require('../../services/admin.service');
const { success } = require('../../utils/apiResponse');

/** GET /api/admin/de-thi */
const getAll = async (req, res, next) => {
  try {
    const result = await adminService.layDanhSachDeThi(req.query);
    return success(res, result.data, 'Thành công', 200, result.meta);
  } catch (err) {
    return next(err);
  }
};

/** DELETE /api/admin/de-thi/:id */
const forceDelete = async (req, res, next) => {
  try {
    await adminService.xoaHanDeThi(req.params.id);
    return success(res, null, 'Xóa đề thi thành công');
  } catch (err) {
    return next(err);
  }
};

module.exports = { getAll, forceDelete };

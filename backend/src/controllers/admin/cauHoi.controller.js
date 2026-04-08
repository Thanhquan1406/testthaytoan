/**
 * @fileoverview Controller xem danh sách câu hỏi (Admin view).
 */

const adminService = require('../../services/admin.service');
const { success } = require('../../utils/apiResponse');

/** GET /api/admin/cau-hoi */
const getAll = async (req, res, next) => {
  try {
    const result = await adminService.layDanhSachCauHoiAdmin(req.query);
    return success(res, result.data, 'Thành công', 200, result.meta);
  } catch (err) {
    return next(err);
  }
};

module.exports = { getAll };

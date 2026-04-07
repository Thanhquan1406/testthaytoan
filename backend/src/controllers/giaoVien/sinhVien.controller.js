/**
 * @fileoverview Controller xem danh sách sinh viên (Giáo viên).
 */

const lopHocService = require('../../services/lopHoc.service');
const { success } = require('../../utils/apiResponse');

/** GET /api/giao-vien/sinh-vien?keyword=... */
const getSinhVien = async (req, res, next) => {
  try {
    const data = await lopHocService.layDanhSachSinhVien(req.query.keyword);
    return success(res, data);
  } catch (err) {
    return next(err);
  }
};

module.exports = { getSinhVien };

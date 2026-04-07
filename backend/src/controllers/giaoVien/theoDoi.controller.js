/**
 * @fileoverview Controller theo dõi phiên thi (Giáo viên giám sát).
 */

const theoDoiService = require('../../services/theoDoi.service');
const { success } = require('../../utils/apiResponse');

const GV_ID = (req) => req.user.id;

/** GET /api/giao-vien/theo-doi-thi/de-thi */
const getDeThi = async (req, res, next) => {
  try {
    const data = await theoDoiService.layDanhSachDeThi(GV_ID(req));
    return success(res, data);
  } catch (err) {
    return next(err);
  }
};

/** GET /api/giao-vien/theo-doi-thi?deThiId=...&trangThai=...&keyword=... */
const getTheoDoi = async (req, res, next) => {
  try {
    const { deThiId, ...query } = req.query;
    const data = await theoDoiService.layDanhSachTheoDoi(GV_ID(req), deThiId, query);
    return success(res, data);
  } catch (err) {
    return next(err);
  }
};

module.exports = { getDeThi, getTheoDoi };

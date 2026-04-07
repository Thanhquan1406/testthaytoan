/**
 * @fileoverview Controller lịch sử thi Sinh viên.
 */

const thiService = require('../../services/thi.service');
const { success } = require('../../utils/apiResponse');

const SV_ID = (req) => req.user.id;

/** GET /api/sinh-vien/lich-su-thi */
const getLichSu = async (req, res, next) => {
  try {
    const result = await thiService.layLichSuThi(SV_ID(req), req.query);
    return success(res, result.data, 'Thành công', 200, result.meta);
  } catch (err) {
    return next(err);
  }
};

/** GET /api/sinh-vien/lich-su-thi/:phienThiId/chi-tiet */
const getChiTiet = async (req, res, next) => {
  try {
    const data = await thiService.layChiTietLichSu(req.params.phienThiId, SV_ID(req));
    return success(res, data);
  } catch (err) {
    return next(err);
  }
};

module.exports = { getLichSu, getChiTiet };

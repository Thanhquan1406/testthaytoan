/**
 * @fileoverview Controller phòng thi Sinh viên - xem lớp và đề thi.
 */

const lopHocService = require('../../services/lopHoc.service');
const DeThi = require('../../models/DeThi');
const { success } = require('../../utils/apiResponse');

const SV_ID = (req) => req.user.id;

/** GET /api/sinh-vien/phong-thi - Danh sách lớp sinh viên tham gia */
const getLopHoc = async (req, res, next) => {
  try {
    const data = await lopHocService.layLopCuaSinhVien(SV_ID(req));
    return success(res, data);
  } catch (err) {
    return next(err);
  }
};

/** GET /api/sinh-vien/phong-thi/:lopId - Chi tiết lớp */
const getLopChiTiet = async (req, res, next) => {
  try {
    const data = await lopHocService.layChiTietCuaSinhVien(req.params.lopId, SV_ID(req));
    return success(res, data);
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/sinh-vien/phong-thi/:lopId/de-thi
 * Danh sách đề thi đã xuất bản cho lớp này
 */
const getDeThi = async (req, res, next) => {
  try {
    // Kiểm tra sinh viên có trong lớp không
    await lopHocService.layChiTietCuaSinhVien(req.params.lopId, SV_ID(req));

    const deThi = await DeThi.find({
      'lopHocIds.lopHocId': req.params.lopId,
      deletedAt: null,
    })
      .populate('monHocId', 'ten')
      .select('-lopHocIds')
      .sort({ thoiGianTao: -1 })
      .lean();

    return success(res, deThi);
  } catch (err) {
    return next(err);
  }
};

module.exports = { getLopHoc, getLopChiTiet, getDeThi };

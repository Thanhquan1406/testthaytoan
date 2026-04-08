/**
 * @fileoverview Controller thi ẩn danh qua link công khai.
 */

const thiService = require('../../services/thi.service');
const DeThi = require('../../models/DeThi');
const { success, created } = require('../../utils/apiResponse');

/**
 * GET /api/public/de-thi-link/:maTruyCap/thong-tin
 * Lấy thông tin đề thi khi nhập link (không cần đăng nhập)
 */
const getThongTin = async (req, res, next) => {
  try {
    const deThi = await DeThi.findOne({
      maTruyCap: req.params.maTruyCap,
      deletedAt: null,
    })
      .populate('monHocId', 'ten')
      .select('ten moTa thoiGianPhut monHocId soLanThiToiDa thoiGianMo thoiGianDong')
      .lean();

    if (!deThi) {
      return res.status(404).json({ success: false, message: 'Link thi không hợp lệ' });
    }

    return success(res, deThi, 'Thông tin đề thi');
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /api/public/de-thi-link/:maTruyCap/bat-dau
 * Bắt đầu thi ẩn danh
 * Body: { hoTenAnDanh }
 */
const batDauAnDanh = async (req, res, next) => {
  try {
    const { hoTenAnDanh } = req.body;
    if (!hoTenAnDanh?.trim()) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập họ tên' });
    }

    const data = await thiService.batDauThiAnDanh(req.params.maTruyCap, hoTenAnDanh);
    return created(res, data, 'Bắt đầu thi thành công');
  } catch (err) {
    return next(err);
  }
};

module.exports = { getThongTin, batDauAnDanh };

/**
 * @fileoverview Controller luồng thi của Sinh viên.
 * Bắt đầu thi, lấy nội dung, lưu đáp án, nộp bài, vi phạm, kết quả.
 */

const thiService = require('../../services/thi.service');
const { success, created } = require('../../utils/apiResponse');

const SV_ID = (req) => req.user.id;

/** POST /api/sinh-vien/thi/bat-dau */
const batDau = async (req, res, next) => {
  try {
    const { deThiId, lopHocId } = req.body;
    const data = await thiService.batDauThiQuaLop(SV_ID(req), deThiId, lopHocId);
    return created(res, data, 'Bắt đầu thi thành công');
  } catch (err) {
    return next(err);
  }
};

/** GET /api/sinh-vien/thi/phien/:phienThiId/noi-dung */
const getNoiDung = async (req, res, next) => {
  try {
    const data = await thiService.layNoiDungBaiThi(req.params.phienThiId, SV_ID(req));
    return success(res, data);
  } catch (err) {
    return next(err);
  }
};

/** POST /api/sinh-vien/thi/phien/:phienThiId/luu */
const luuTraLoi = async (req, res, next) => {
  try {
    const { cauHoiId, noiDungTraLoi } = req.body;
    await thiService.luuTraLoi(req.params.phienThiId, SV_ID(req), cauHoiId, noiDungTraLoi);
    return success(res, null, 'Đã lưu câu trả lời');
  } catch (err) {
    return next(err);
  }
};

/** POST /api/sinh-vien/thi/phien/:phienThiId/nop-bai */
const nopBai = async (req, res, next) => {
  try {
    const data = await thiService.nopBai(req.params.phienThiId, SV_ID(req));
    return success(res, data, 'Nộp bài thành công');
  } catch (err) {
    return next(err);
  }
};

/** POST /api/sinh-vien/thi/phien/:phienThiId/vi-pham */
const viPham = async (req, res, next) => {
  try {
    const soLanViPham = await thiService.xuLyViPham(
      req.params.phienThiId,
      SV_ID(req),
      req.body.hanhVi
    );
    return success(res, { soLanViPham });
  } catch (err) {
    return next(err);
  }
};

/** GET /api/sinh-vien/thi/phien/:phienThiId/ket-qua */
const getKetQua = async (req, res, next) => {
  try {
    const data = await thiService.layKetQua(req.params.phienThiId, SV_ID(req));
    return success(res, data);
  } catch (err) {
    return next(err);
  }
};

module.exports = { batDau, getNoiDung, luuTraLoi, nopBai, viPham, getKetQua };

/**
 * @fileoverview Controller kết quả thi (Giáo viên xem và quản lý).
 */

const ketQuaService = require('../../services/ketQua.service');
const importExportService = require('../../services/importExport.service');
const { success } = require('../../utils/apiResponse');

const GV_ID = (req) => req.user.id;

/** GET /api/giao-vien/ket-qua?deThiId=...&lopHocId=... */
const getKetQua = async (req, res, next) => {
  try {
    const data = await ketQuaService.layKetQuaTheoDeVaLop(GV_ID(req), req.query);
    return success(res, data);
  } catch (err) {
    return next(err);
  }
};

/** PUT /api/giao-vien/ket-qua/:phienThiId/ghi-chu */
const updateGhiChu = async (req, res, next) => {
  try {
    const data = await ketQuaService.capNhatGhiChu(req.params.phienThiId, GV_ID(req), req.body.ghiChu);
    return success(res, data, 'Cập nhật ghi chú thành công');
  } catch (err) {
    return next(err);
  }
};

/** PUT /api/giao-vien/ket-qua/:phienThiId/diem */
const updateDiem = async (req, res, next) => {
  try {
    const data = await ketQuaService.capNhatDiem(req.params.phienThiId, GV_ID(req), req.body.tongDiem);
    return success(res, data, 'Cập nhật điểm thành công');
  } catch (err) {
    return next(err);
  }
};

/** GET /api/giao-vien/ket-qua/phien/:phienThiId/xem */
const xemBaiThi = async (req, res, next) => {
  try {
    const data = await ketQuaService.xemChiTietBaiLam(req.params.phienThiId, GV_ID(req));
    return success(res, data);
  } catch (err) {
    return next(err);
  }
};

/** GET /api/giao-vien/ket-qua/de-thi */
const getDanhSachDeThi = async (req, res, next) => {
  try {
    const data = await ketQuaService.layDanhSachDeThi(GV_ID(req));
    return success(res, data);
  } catch (err) {
    return next(err);
  }
};

/** GET /api/giao-vien/ket-qua/lop */
const getDanhSachLop = async (req, res, next) => {
  try {
    const data = await ketQuaService.layDanhSachLop(GV_ID(req));
    return success(res, data);
  } catch (err) {
    return next(err);
  }
};

/** GET /api/giao-vien/ket-qua/phan-tich/histogram?deThiId=...&lopHocId=...&binSize=... */
const getHistogram = async (req, res, next) => {
  try {
    const data = await ketQuaService.getHistogram(GV_ID(req), req.query);
    return success(res, data);
  } catch (err) {
    return next(err);
  }
};

/** GET /api/giao-vien/ket-qua/phan-tich/do-kho-cau-hoi?deThiId=...&lopHocId=... */
const getQuestionDifficulty = async (req, res, next) => {
  try {
    const data = await ketQuaService.getQuestionDifficulty(GV_ID(req), req.query);
    return success(res, data);
  } catch (err) {
    return next(err);
  }
};

/** GET /api/giao-vien/ket-qua/phan-tich/so-sanh-lop?deThiId=... */
const getClassComparison = async (req, res, next) => {
  try {
    const data = await ketQuaService.getClassComparison(GV_ID(req), req.query);
    return success(res, data);
  } catch (err) {
    return next(err);
  }
};

/** GET /api/giao-vien/ket-qua/export/excel?deThiId=...&lopHocId=... */
const exportExcel = async (req, res, next) => {
  try {
    const deThiId = req.query.deThiId;
    const lopHocId = req.query.lopHocId || '';
    const ketQuas = await ketQuaService.layKetQuaTheoDeVaLop(GV_ID(req), { deThiId, lopHocId });
    const deThi = await ketQuaService.layDanhSachDeThi(GV_ID(req));
    const tenDeThi = deThi.find((d) => d._id.toString() === deThiId)?.ten || 'BaoCaoKetQua';

    const analytics = {
      histogram: await ketQuaService.getHistogram(GV_ID(req), { deThiId, lopHocId }),
      questionDifficulty: await ketQuaService.getQuestionDifficulty(GV_ID(req), { deThiId, lopHocId }),
      classComparison: await ketQuaService.getClassComparison(GV_ID(req), { deThiId }),
    };
    const buffer = await importExportService.exportKetQuaExcel(ketQuas, tenDeThi, analytics);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="bao-cao-ket-qua-${Date.now()}.xlsx"`
    );
    return res.send(buffer);
  } catch (err) {
    return next(err);
  }
};

/** GET /api/giao-vien/ket-qua/export/pdf?deThiId=...&lopHocId=... */
const exportPDF = async (req, res, next) => {
  try {
    const deThiId = req.query.deThiId;
    const lopHocId = req.query.lopHocId || '';
    const ketQuas = await ketQuaService.layKetQuaTheoDeVaLop(GV_ID(req), { deThiId, lopHocId });
    const deThi = await ketQuaService.layDanhSachDeThi(GV_ID(req));
    const tenDeThi = deThi.find((d) => d._id.toString() === deThiId)?.ten || 'BaoCaoKetQua';

    const analytics = {
      histogram: await ketQuaService.getHistogram(GV_ID(req), { deThiId, lopHocId }),
      questionDifficulty: await ketQuaService.getQuestionDifficulty(GV_ID(req), { deThiId, lopHocId }),
      classComparison: await ketQuaService.getClassComparison(GV_ID(req), { deThiId }),
    };
    const buffer = await importExportService.exportKetQuaPDF(ketQuas, tenDeThi, analytics);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="bao-cao-ket-qua-${Date.now()}.pdf"`
    );
    return res.send(buffer);
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getKetQua,
  updateGhiChu,
  updateDiem,
  xemBaiThi,
  getDanhSachDeThi,
  getDanhSachLop,
  getHistogram,
  getQuestionDifficulty,
  getClassComparison,
  exportExcel,
  exportPDF,
};

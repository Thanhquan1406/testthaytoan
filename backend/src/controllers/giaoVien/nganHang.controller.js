/**
 * @fileoverview Controller quản lý Ngân hàng câu hỏi (Giáo viên).
 */

const nganHangService = require('../../services/nganHang.service');
const cauHoiService = require('../../services/cauHoi.service');
const { importDocx, importPdf } = require('../../services/importExport.service');
const { success, created } = require('../../utils/apiResponse');
const mongoose = require('mongoose');
const CauHoi = require('../../models/CauHoi');

const GV_ID = (req) => req.user.id;

/** GET /api/giao-vien/ngan-hang */
const getAll = async (req, res, next) => {
  try {
    const data = await nganHangService.layDanhSach(GV_ID(req));
    return success(res, data);
  } catch (err) {
    return next(err);
  }
};

/** POST /api/giao-vien/ngan-hang */
const create = async (req, res, next) => {
  try {
    const data = await nganHangService.taoNganHang(GV_ID(req), req.body);
    return created(res, data, 'Tạo ngân hàng thành công');
  } catch (err) {
    return next(err);
  }
};

/** GET /api/giao-vien/ngan-hang/:id */
const getById = async (req, res, next) => {
  try {
    const data = await nganHangService.layChiTiet(req.params.id, GV_ID(req));
    return success(res, data);
  } catch (err) {
    return next(err);
  }
};

/** PUT /api/giao-vien/ngan-hang/:id */
const update = async (req, res, next) => {
  try {
    const data = await nganHangService.capNhatNganHang(req.params.id, GV_ID(req), req.body);
    return success(res, data, 'Cập nhật ngân hàng thành công');
  } catch (err) {
    return next(err);
  }
};

/** DELETE /api/giao-vien/ngan-hang/:id */
const remove = async (req, res, next) => {
  try {
    await nganHangService.xoaNganHang(req.params.id, GV_ID(req));
    return success(res, null, 'Xóa ngân hàng thành công');
  } catch (err) {
    return next(err);
  }
};

/** GET /api/giao-vien/ngan-hang/mon-hoc */
const getMonHoc = async (_req, res, next) => {
  try {
    const data = await nganHangService.layDanhSachMonHoc();
    return success(res, data);
  } catch (err) {
    return next(err);
  }
};

/** POST /api/giao-vien/ngan-hang/:nganHangId/import */
const importFile = async (req, res, next) => {
  try {
    const { nganHangId } = req.params;
    const { cauTrucId } = req.body;

    if (!req.file) {
      throw Object.assign(new Error('Vui lòng chọn file để upload'), { statusCode: 400 });
    }

    // Kiểm tra quyền truy cập ngân hàng
    await nganHangService.layChiTiet(nganHangId, GV_ID(req));

    // Parse file theo loại
    const ext = req.file.originalname.split('.').pop().toLowerCase();
    let questions;

    if (ext === 'docx' || ext === 'doc') {
      questions = await importDocx(req.file.buffer);
    } else if (ext === 'pdf') {
      questions = await importPdf(req.file.buffer);
    } else {
      throw Object.assign(new Error('Định dạng file không được hỗ trợ. Chỉ hỗ trợ .docx và .pdf'), { statusCode: 400 });
    }

    return success(res, {
      soLuongImport: questions.length,
      cauHois: questions,
    }, `Đọc thành công ${questions.length} câu hỏi từ file`);
  } catch (err) {
    return next(err);
  }
};

/** POST /api/giao-vien/ngan-hang/:nganHangId/cau-hoi */
const saveCauHoi = async (req, res, next) => {
  try {
    const { nganHangId } = req.params;
    const { questions, cauTrucId } = req.body;

    await nganHangService.layChiTiet(nganHangId, GV_ID(req));

    const inserted = await cauHoiService.importCauHoi(GV_ID(req), nganHangId, cauTrucId || null, questions);

    return created(res, {
      soLuongTao: inserted.length,
      cauHois: inserted,
    }, `Lưu thành công ${inserted.length} câu hỏi`);
  } catch (err) {
    return next(err);
  }
};

/** GET /api/giao-vien/ngan-hang/:nganHangId/cau-hoi */
const getCauHoi = async (req, res, next) => {
  try {
    const { nganHangId } = req.params;
    await nganHangService.layChiTiet(nganHangId, GV_ID(req));

    const result = await cauHoiService.layTheoNganHang(nganHangId, GV_ID(req), req.query);
    return success(res, result.data, 'Thành công', 200, result.meta);
  } catch (err) {
    return next(err);
  }
};

/** POST /api/giao-vien/ngan-hang/:nganHangId/tao-de-tu-ma-tran */
const taoDeTuMaTran = async (req, res, next) => {
  try {
    const { nganHangId } = req.params;
    const { requirements } = req.body;
    await nganHangService.layChiTiet(nganHangId, GV_ID(req));

    // Lọc tất cả câu hỏi an toàn
    const allQuestions = await CauHoi.find({ 
      nganHangId: new mongoose.Types.ObjectId(nganHangId), 
      cauTrucId: { $ne: null } 
    }).lean();

    let selectedQuestions = [];
    
    // Yêu cầu (requirements) có mảng các { cauTrucId, doKho, count }
    (requirements || []).forEach(reqObj => {
        let matching = allQuestions.filter(q => 
          q.cauTrucId?.toString() === reqObj.cauTrucId && 
          q.doKho === reqObj.doKho && 
          q.loaiCauHoi === 'TRAC_NGHIEM'
        );
        // Xáo trộn mảng ngẫu nhiên (Fisher-Yates style simpler)
        matching.sort(() => 0.5 - Math.random());
        // Lấy đúng số lượng
        selectedQuestions.push(...matching.slice(0, reqObj.count));
    });

    return success(res, selectedQuestions, 'Tạo đề thành công');
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getAll,
  create,
  getById,
  update,
  remove,
  getMonHoc,
  importFile,
  saveCauHoi,
  getCauHoi,
  taoDeTuMaTran,
};

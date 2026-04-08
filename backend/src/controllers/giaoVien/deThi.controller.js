/**
 * @fileoverview Controller quản lý đề thi (Giáo viên).
 */

const deThiService = require('../../services/deThi.service');
const { importDocx, importPdf } = require('../../services/importExport.service');
const { success, created } = require('../../utils/apiResponse');

const GV_ID = (req) => req.user.id;

/** GET /api/giao-vien/de-thi */
const getAll = async (req, res, next) => {
  try {
    const result = await deThiService.layDanhSach(GV_ID(req), req.query);
    return success(res, result.data, 'Thành công', 200, result.meta);
  } catch (err) {
    return next(err);
  }
};

/** GET /api/giao-vien/de-thi/thung-rac */
const getTrash = async (req, res, next) => {
  try {
    const data = await deThiService.layThungRac(GV_ID(req));
    return success(res, data);
  } catch (err) {
    return next(err);
  }
};

/** GET /api/giao-vien/de-thi/mon-hoc */
const getMonHoc = async (_req, res, next) => {
  try {
    const data = await deThiService.layDanhSachMonHoc();
    return success(res, data);
  } catch (err) {
    return next(err);
  }
};

/** GET /api/giao-vien/de-thi/:id */
const getById = async (req, res, next) => {
  try {
    const data = await deThiService.layChiTiet(req.params.id, GV_ID(req));
    return success(res, data);
  } catch (err) {
    return next(err);
  }
};

/** POST /api/giao-vien/de-thi */
const create = async (req, res, next) => {
  try {
    const data = await deThiService.taoDeThi(GV_ID(req), req.body);
    return created(res, data, 'Tạo đề thi thành công');
  } catch (err) {
    return next(err);
  }
};

/** PUT /api/giao-vien/de-thi/:id */
const update = async (req, res, next) => {
  try {
    const data = await deThiService.capNhatDeThi(req.params.id, GV_ID(req), req.body);
    return success(res, data, 'Cập nhật đề thi thành công');
  } catch (err) {
    return next(err);
  }
};

/** DELETE /api/giao-vien/de-thi/:id (soft delete) */
const softDelete = async (req, res, next) => {
  try {
    await deThiService.xoaMem(req.params.id, GV_ID(req));
    return success(res, null, 'Đã chuyển vào thùng rác');
  } catch (err) {
    return next(err);
  }
};

/** POST /api/giao-vien/de-thi/:id/khoi-phuc */
const restore = async (req, res, next) => {
  try {
    await deThiService.khoiPhuc(req.params.id, GV_ID(req));
    return success(res, null, 'Khôi phục thành công');
  } catch (err) {
    return next(err);
  }
};

/** DELETE /api/giao-vien/de-thi/:id/xoa-han */
const forceDelete = async (req, res, next) => {
  try {
    await deThiService.xoaHan(req.params.id, GV_ID(req));
    return success(res, null, 'Xóa vĩnh viễn thành công');
  } catch (err) {
    return next(err);
  }
};

/** POST /api/giao-vien/de-thi/:id/cau-hoi */
const addQuestions = async (req, res, next) => {
  try {
    const data = await deThiService.themCauHoi(req.params.id, GV_ID(req), req.body.cauHoiIds);
    return success(res, data, 'Thêm câu hỏi thành công');
  } catch (err) {
    return next(err);
  }
};

/** DELETE /api/giao-vien/de-thi/:id/cau-hoi/:cauHoiId */
const removeQuestion = async (req, res, next) => {
  try {
    const data = await deThiService.xoaCauHoiKhoiDe(req.params.id, GV_ID(req), req.params.cauHoiId);
    return success(res, data, 'Xóa câu hỏi khỏi đề thành công');
  } catch (err) {
    return next(err);
  }
};

/** POST /api/giao-vien/de-thi/:id/xuat-ban-lop */
const publishToClass = async (req, res, next) => {
  try {
    const data = await deThiService.xuatBanChoLop(req.params.id, GV_ID(req), req.body.lopHocId);
    return success(res, data, 'Xuất bản cho lớp thành công');
  } catch (err) {
    return next(err);
  }
};

/** DELETE /api/giao-vien/de-thi/:id/thu-hoi-lop */
const revokeFromClass = async (req, res, next) => {
  try {
    await deThiService.thuHoiKhoiLop(req.params.id, GV_ID(req), req.body.lopHocId);
    return success(res, null, 'Thu hồi thành công');
  } catch (err) {
    return next(err);
  }
};

/** POST /api/giao-vien/de-thi/:id/link-cong-khai */
const createPublicLink = async (req, res, next) => {
  try {
    const data = await deThiService.taoLinkCongKhai(req.params.id, GV_ID(req));
    return success(res, data, 'Tạo link công khai thành công');
  } catch (err) {
    return next(err);
  }
};

/** DELETE /api/giao-vien/de-thi/:id/link-cong-khai */
const revokePublicLink = async (req, res, next) => {
  try {
    await deThiService.huyLinkCongKhai(req.params.id, GV_ID(req));
    return success(res, null, 'Hủy link công khai thành công');
  } catch (err) {
    return next(err);
  }
};

/** POST /api/giao-vien/de-thi/:id/import  (multipart: file + chuDeId) */
const importFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(Object.assign(new Error('Vui lòng chọn file PDF hoặc DOCX'), { statusCode: 400 }));
    }
    const { chuDeId } = req.body;
    if (!chuDeId) {
      return next(Object.assign(new Error('Vui lòng chọn chủ đề để lưu câu hỏi'), { statusCode: 400 }));
    }
    const result = await deThiService.importTuFile(
      req.params.id,
      GV_ID(req),
      req.file.buffer,
      req.file.mimetype,
      chuDeId
    );
    return success(res, result, `Đã nhập thành công ${result.soLuongNhap} câu hỏi`);
  } catch (err) {
    return next(err);
  }
};

/** POST /api/giao-vien/de-thi/tao-tu-ma-tran */
const taoTuMaTran = async (req, res, next) => {
  try {
    const { ten, monHocId, moTa, questions,
      thoiGianPhut, thoiGianMo, thoiGianDong,
      doiTuongThi, cheDoXemDiem, cheDoXemDapAn, diemToiThieuXemDapAn,
      lopHocIds, sinhVienIds
    } = req.body;
    
    // Tạo maDeThi ngẫu nhiên (ví dụ: DT + 6 số)
    const maDeThi = 'DT' + Math.floor(100000 + Math.random() * 900000);

    let finalQuestions = [];
    if (questions && questions.length > 0 && questions[0].noiDung) {
      // Create orphan questions directly (no chuDeId, no nganHangId)
      const CauHoi = require('../../models/CauHoi');
      const docs = questions.map(q => ({
         ...q,
         nguoiDungId: GV_ID(req)
      }));
      const inserted = await CauHoi.insertMany(docs);
      finalQuestions = inserted.map((c, i) => ({
         cauHoiId: c._id,
         diem: questions[i].diem || 1
      }));
    } else {
      finalQuestions = questions;
    }

    const payload = {
      ten,
      monHocId,
      moTa,
      maDeThi,
      thoiGianPhut: thoiGianPhut !== undefined ? thoiGianPhut : 45, // default
      thoiGianMo, thoiGianDong,
      doiTuongThi, cheDoXemDiem, cheDoXemDapAn, diemToiThieuXemDapAn,
      lopHocIds, sinhVienIds,
      cauHois: finalQuestions // mảng { cauHoiId, diem }
    };

    const data = await deThiService.taoDeThi(GV_ID(req), payload);
    return created(res, data, 'Tạo đề thi từ ma trận thành công');
  } catch (err) {
    return next(err);
  }
};

/** POST /api/giao-vien/de-thi/parse-file */
const parseFileWithoutBank = async (req, res, next) => {
  try {
    if (!req.file) throw Object.assign(new Error('Vui lòng chọn file PDF hoặc DOCX'), { statusCode: 400 });
    const ext = req.file.originalname.split('.').pop().toLowerCase();
    let questions;
    if (ext === 'docx' || ext === 'doc') {
      questions = await importDocx(req.file.buffer);
    } else if (ext === 'pdf') {
      questions = await importPdf(req.file.buffer);
    } else {
      throw Object.assign(new Error('Định dạng file không được hỗ trợ. Chỉ hỗ trợ .docx và .pdf'), { statusCode: 400 });
    }
    return success(res, { cauHois: questions }, 'Đọc file thành công');
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getAll, getTrash, getMonHoc, getById,
  create, update, softDelete, restore, forceDelete,
  addQuestions, removeQuestion,
  publishToClass, revokeFromClass,
  createPublicLink, revokePublicLink,
  importFile, taoTuMaTran, parseFileWithoutBank
};

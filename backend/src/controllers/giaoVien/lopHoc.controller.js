/**
 * @fileoverview Controller quản lý lớp học (Giáo viên).
 * Bao gồm CRUD lớp, quản lý SV (MSSV lookup, import Excel), đề thi, bảng điểm.
 */

const lopHocService = require('../../services/lopHoc.service');
const { success, created } = require('../../utils/apiResponse');
const ExcelJS = require('exceljs');

const GV_ID = (req) => req.user.id;

/** GET /api/giao-vien/lop-hoc */
const getAll = async (req, res, next) => {
  try {
    const data = await lopHocService.layDanhSachCuaGiaoVien(GV_ID(req));
    return success(res, data);
  } catch (err) {
    return next(err);
  }
};

/** GET /api/giao-vien/lop-hoc/:id */
const getById = async (req, res, next) => {
  try {
    const data = await lopHocService.layChiTietCuaGiaoVien(req.params.id, GV_ID(req));
    return success(res, data);
  } catch (err) {
    return next(err);
  }
};

/** POST /api/giao-vien/lop-hoc */
const create = async (req, res, next) => {
  try {
    const { ten } = req.body;
    const data = await lopHocService.taoLopHoc(GV_ID(req), ten);
    return created(res, data, 'Tạo lớp học thành công');
  } catch (err) {
    return next(err);
  }
};

/** PUT /api/giao-vien/lop-hoc/:id */
const update = async (req, res, next) => {
  try {
    const data = await lopHocService.capNhatLopHoc(req.params.id, GV_ID(req), req.body);
    return success(res, data, 'Cập nhật lớp học thành công');
  } catch (err) {
    return next(err);
  }
};

/** DELETE /api/giao-vien/lop-hoc/:id */
const remove = async (req, res, next) => {
  try {
    await lopHocService.xoaLopHoc(req.params.id, GV_ID(req));
    return success(res, null, 'Xóa lớp học thành công');
  } catch (err) {
    return next(err);
  }
};

// ─── QUẢN LÝ SINH VIÊN TRONG LỚP ──────────────────────────────────────────────

/** GET /api/giao-vien/lop-hoc/tim-sinh-vien?mssv=... */
const timSinhVien = async (req, res, next) => {
  try {
    const data = await lopHocService.timSinhVienTheoMSSV(req.query.mssv);
    return success(res, data);
  } catch (err) {
    return next(err);
  }
};

/** POST /api/giao-vien/lop-hoc/:id/sinh-vien */
const themSinhVien = async (req, res, next) => {
  try {
    const { sinhVienId } = req.body;
    const data = await lopHocService.themSinhVienVaoLop(req.params.id, GV_ID(req), sinhVienId);
    return success(res, data, 'Thêm sinh viên thành công');
  } catch (err) {
    return next(err);
  }
};

/** DELETE /api/giao-vien/lop-hoc/:id/sinh-vien/:sinhVienId */
const xoaSinhVien = async (req, res, next) => {
  try {
    const data = await lopHocService.xoaSinhVienKhoiLop(
      req.params.id,
      GV_ID(req),
      req.params.sinhVienId
    );
    return success(res, data, 'Xóa sinh viên khỏi lớp thành công');
  } catch (err) {
    return next(err);
  }
};

/** POST /api/giao-vien/lop-hoc/:id/import-sinh-vien */
const importSinhVien = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Vui lòng upload file Excel' });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return res.status(400).json({ success: false, message: 'File Excel không có dữ liệu' });
    }

    const danhSachMSSV = [];
    worksheet.eachRow((row, rowNumber) => {
      // Bỏ qua hàng header (hàng 1)
      if (rowNumber === 1) return;
      const cellValue = row.getCell(1).value;
      if (cellValue) {
        const mssv = String(cellValue).trim();
        if (mssv) danhSachMSSV.push(mssv);
      }
    });

    if (!danhSachMSSV.length) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy MSSV nào trong file. Đảm bảo MSSV nằm ở cột A, bắt đầu từ hàng 2.',
      });
    }

    const data = await lopHocService.themNhieuSinhVienTuExcel(
      req.params.id,
      GV_ID(req),
      danhSachMSSV
    );
    return success(res, data, `Đã thêm ${data.daThemMoi} sinh viên`);
  } catch (err) {
    return next(err);
  }
};

// ─── ĐỀ THI VÀ BẢNG ĐIỂM ──────────────────────────────────────────────────────

/** GET /api/giao-vien/lop-hoc/:id/de-thi */
const getDeThiCuaLop = async (req, res, next) => {
  try {
    const data = await lopHocService.layDeThiCuaLop(req.params.id, GV_ID(req));
    return success(res, data);
  } catch (err) {
    return next(err);
  }
};

/** GET /api/giao-vien/lop-hoc/:id/bang-diem?deThiId=... */
const getBangDiem = async (req, res, next) => {
  try {
    const data = await lopHocService.layBangDiemCuaLop(
      req.params.id,
      GV_ID(req),
      req.query.deThiId
    );
    return success(res, data);
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  timSinhVien,
  themSinhVien,
  xoaSinhVien,
  importSinhVien,
  getDeThiCuaLop,
  getBangDiem,
};

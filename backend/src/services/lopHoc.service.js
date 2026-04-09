/**
 * @fileoverview Service quản lý lớp học.
 * Giáo viên CRUD lớp, thêm/xóa sinh viên bằng MSSV; Sinh viên xem lớp của mình.
 */

const LopHoc = require('../models/LopHoc');
const NguoiDung = require('../models/NguoiDung');
const DeThi = require('../models/DeThi');
const PhienThi = require('../models/PhienThi');
const { VAI_TRO, TRANG_THAI_PHIEN_THI } = require('../utils/constants');

/**
 * Lấy danh sách lớp học của giáo viên
 * @param {string} giaoVienId
 * @returns {Promise<object[]>}
 */
const layDanhSachCuaGiaoVien = async (giaoVienId) => {
  return LopHoc.find({ giaoVienId })
    .select('-sinhVienIds')
    .sort({ thoiGianTao: -1 })
    .lean();
};

/**
 * Lấy chi tiết lớp học kèm danh sách sinh viên
 * @param {string} lopId
 * @param {string} giaoVienId
 * @returns {Promise<object>}
 */
const layChiTietCuaGiaoVien = async (lopId, giaoVienId) => {
  const lop = await LopHoc.findOne({ _id: lopId, giaoVienId })
    .populate('sinhVienIds', 'maNguoiDung ho ten email soDienThoai')
    .lean({ virtuals: true });

  if (!lop) throw Object.assign(new Error('Không tìm thấy lớp học'), { statusCode: 404 });
  return lop;
};

/**
 * Tạo lớp học mới (chỉ cần tên)
 * @param {string} giaoVienId
 * @param {string} ten - Tên lớp
 * @returns {Promise<object>}
 */
const taoLopHoc = async (giaoVienId, ten) => {
  return LopHoc.create({ ten, giaoVienId, sinhVienIds: [] });
};

/**
 * Cập nhật tên lớp
 * @param {string} lopId
 * @param {string} giaoVienId
 * @param {object} data - { ten }
 * @returns {Promise<object>}
 */
const capNhatLopHoc = async (lopId, giaoVienId, { ten }) => {
  const updated = await LopHoc.findOneAndUpdate(
    { _id: lopId, giaoVienId },
    { $set: { ten } },
    { new: true, runValidators: true }
  ).lean();

  if (!updated) throw Object.assign(new Error('Không tìm thấy lớp học'), { statusCode: 404 });
  return updated;
};

/**
 * Xóa lớp học
 * @param {string} lopId
 * @param {string} giaoVienId
 */
const xoaLopHoc = async (lopId, giaoVienId) => {
  const result = await LopHoc.findOneAndDelete({ _id: lopId, giaoVienId });
  if (!result) throw Object.assign(new Error('Không tìm thấy lớp học'), { statusCode: 404 });
};

// ─── QUẢN LÝ SINH VIÊN TRONG LỚP ─────────────────────────────────────────────

/**
 * Tìm sinh viên theo MSSV chính xác
 * @param {string} mssv - Mã sinh viên (maNguoiDung)
 * @returns {Promise<object>}
 */
const timSinhVienTheoMSSV = async (mssv) => {
  if (!mssv || !mssv.trim()) {
    throw Object.assign(new Error('Vui lòng nhập mã sinh viên'), { statusCode: 400 });
  }

  const sinhVien = await NguoiDung.findOne({
    maNguoiDung: mssv.trim(),
    vaiTro: VAI_TRO.SINH_VIEN,
  })
    .select('maNguoiDung ho ten email soDienThoai')
    .lean({ virtuals: true });

  if (!sinhVien) {
    throw Object.assign(
      new Error(`Không tìm thấy sinh viên với mã "${mssv}"`),
      { statusCode: 404 }
    );
  }
  return sinhVien;
};

/**
 * Thêm sinh viên vào lớp
 * @param {string} lopId
 * @param {string} giaoVienId
 * @param {string} sinhVienId
 * @returns {Promise<object>}
 */
const themSinhVienVaoLop = async (lopId, giaoVienId, sinhVienId) => {
  const lop = await LopHoc.findOne({ _id: lopId, giaoVienId });
  if (!lop) throw Object.assign(new Error('Không tìm thấy lớp học'), { statusCode: 404 });

  // Kiểm tra đã có trong lớp chưa
  if (lop.sinhVienIds.some((id) => id.toString() === sinhVienId)) {
    throw Object.assign(new Error('Sinh viên đã có trong lớp'), { statusCode: 400 });
  }

  lop.sinhVienIds.push(sinhVienId);
  await lop.save();

  // Trả lại lớp kèm populate
  return layChiTietCuaGiaoVien(lopId, giaoVienId);
};

/**
 * Xóa sinh viên khỏi lớp
 * @param {string} lopId
 * @param {string} giaoVienId
 * @param {string} sinhVienId
 * @returns {Promise<object>}
 */
const xoaSinhVienKhoiLop = async (lopId, giaoVienId, sinhVienId) => {
  const result = await LopHoc.findOneAndUpdate(
    { _id: lopId, giaoVienId },
    { $pull: { sinhVienIds: sinhVienId } },
    { new: true }
  );
  if (!result) throw Object.assign(new Error('Không tìm thấy lớp học'), { statusCode: 404 });
  return layChiTietCuaGiaoVien(lopId, giaoVienId);
};

/**
 * Import sinh viên từ danh sách MSSV (từ file Excel)
 * @param {string} lopId
 * @param {string} giaoVienId
 * @param {string[]} danhSachMSSV - Mảng mã SV
 * @returns {Promise<{daThemMoi: number, daTonTai: number, khongTimThay: string[]}>}
 */
const themNhieuSinhVienTuExcel = async (lopId, giaoVienId, danhSachMSSV) => {
  const lop = await LopHoc.findOne({ _id: lopId, giaoVienId });
  if (!lop) throw Object.assign(new Error('Không tìm thấy lớp học'), { statusCode: 404 });

  const currentIds = new Set(lop.sinhVienIds.map((id) => id.toString()));
  const khongTimThay = [];
  let daThemMoi = 0;
  let daTonTai = 0;

  // Tìm tất cả SV theo MSSV
  const allSVs = await NguoiDung.find({
    maNguoiDung: { $in: danhSachMSSV },
    vaiTro: VAI_TRO.SINH_VIEN,
  })
    .select('_id maNguoiDung')
    .lean();

  const svMap = new Map(allSVs.map((sv) => [sv.maNguoiDung, sv._id.toString()]));

  for (const mssv of danhSachMSSV) {
    const svId = svMap.get(mssv);
    if (!svId) {
      khongTimThay.push(mssv);
      continue;
    }
    if (currentIds.has(svId)) {
      daTonTai++;
      continue;
    }
    lop.sinhVienIds.push(svId);
    currentIds.add(svId);
    daThemMoi++;
  }

  if (daThemMoi > 0) await lop.save();

  return { daThemMoi, daTonTai, khongTimThay };
};

// ─── ĐỀ THI VÀ BẢNG ĐIỂM THEO LỚP ───────────────────────────────────────────

/**
 * Lấy danh sách đề thi đã xuất bản cho lớp
 * @param {string} lopId
 * @param {string} giaoVienId
 * @returns {Promise<object[]>}
 */
const layDeThiCuaLop = async (lopId, giaoVienId) => {
  // Verify giáo viên sở hữu lớp
  const lop = await LopHoc.findOne({ _id: lopId, giaoVienId }).lean();
  if (!lop) throw Object.assign(new Error('Không tìm thấy lớp học'), { statusCode: 404 });

  return DeThi.find({
    nguoiDungId: giaoVienId,
    deletedAt: null,
    'lopHocIds.lopHocId': lopId,
  })
    .populate('monHocId', 'ten')
    .select('maDeThi ten monHocId thoiGianPhut cauHois lopHocIds thoiGianTao')
    .sort({ thoiGianTao: -1 })
    .lean();
};

/**
 * Lấy bảng điểm của lớp theo đề thi
 * @param {string} lopId
 * @param {string} giaoVienId
 * @param {string} deThiId
 * @returns {Promise<object>}
 */
const layBangDiemCuaLop = async (lopId, giaoVienId, deThiId) => {
  // Verify giáo viên sở hữu lớp
  const lop = await LopHoc.findOne({ _id: lopId, giaoVienId }).lean();
  if (!lop) throw Object.assign(new Error('Không tìm thấy lớp học'), { statusCode: 404 });

  const filter = {
    lopHocId: lopId,
    trangThai: TRANG_THAI_PHIEN_THI.DA_NOP_BAI,
  };
  if (deThiId) filter.deThiId = deThiId;

  const ketQua = await PhienThi.find(filter)
    .populate('nguoiDungId', 'maNguoiDung ho ten email')
    .populate('deThiId', 'ten maDeThi')
    .select('nguoiDungId deThiId hoTenAnDanh ketQua thoiGianBatDau thoiGianNop')
    .sort({ 'ketQua.tongDiem': -1 })
    .lean();

  return ketQua;
};

// ─── SINH VIÊN XEM LỚP ────────────────────────────────────────────────────────

/**
 * Lấy danh sách lớp học mà sinh viên tham gia
 * @param {string} sinhVienId
 * @returns {Promise<object[]>}
 */
const layLopCuaSinhVien = async (sinhVienId) => {
  return LopHoc.find({ sinhVienIds: sinhVienId })
    .populate('giaoVienId', 'ho ten')
    .select('-sinhVienIds')
    .sort({ thoiGianTao: -1 })
    .lean();
};

/**
 * Sinh viên lấy chi tiết lớp học (xem đề được xuất bản)
 * @param {string} lopId
 * @param {string} sinhVienId - Kiểm tra sinh viên có trong lớp không
 * @returns {Promise<object>}
 */
const layChiTietCuaSinhVien = async (lopId, sinhVienId) => {
  const lop = await LopHoc.findOne({ _id: lopId, sinhVienIds: sinhVienId })
    .populate('giaoVienId', 'ho ten')
    .lean();

  if (!lop) throw Object.assign(new Error('Lớp học không tồn tại hoặc bạn không tham gia'), { statusCode: 403 });
  return lop;
};

module.exports = {
  layDanhSachCuaGiaoVien,
  layChiTietCuaGiaoVien,
  taoLopHoc,
  capNhatLopHoc,
  xoaLopHoc,
  timSinhVienTheoMSSV,
  themSinhVienVaoLop,
  xoaSinhVienKhoiLop,
  themNhieuSinhVienTuExcel,
  layDeThiCuaLop,
  layBangDiemCuaLop,
  layLopCuaSinhVien,
  layChiTietCuaSinhVien,
};

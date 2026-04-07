/**
 * @fileoverview Service quản lý đề thi (dành cho Giáo viên).
 * Bao gồm CRUD đề, quản lý câu hỏi trong đề, xuất bản lớp, link công khai, soft delete.
 */

const DeThi = require('../models/DeThi');
const CauHoi = require('../models/CauHoi');
const MonHoc = require('../models/MonHoc');
const { TRANG_THAI_DE_THI } = require('../utils/constants');
const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');
const { generateAccessCode, toSlug } = require('../utils/slugify');

const TIEN_TO_DUONG_DAN = '/thi-mo/';

// ─── DANH SÁCH & CHI TIẾT ──────────────────────────────────────────────────

/**
 * Lấy danh sách đề thi của giáo viên (chưa bị xóa mềm)
 * @param {string} giaoVienId
 * @param {object} query - Phân trang + filter
 * @returns {Promise<{data: object[], meta: object}>}
 */
const layDanhSach = async (giaoVienId, query) => {
  const { page, limit, skip } = getPaginationParams(query);
  const { trangThai, monHocId, search } = query;

  const filter = { nguoiDungId: giaoVienId, deletedAt: null };
  if (trangThai) filter.trangThai = trangThai;
  if (monHocId) filter.monHocId = monHocId;
  if (search) filter.ten = { $regex: search, $options: 'i' };

  const [data, total] = await Promise.all([
    DeThi.find(filter)
      .populate('monHocId', 'ten')
      .select('-cauHois -lopHocIds')
      .skip(skip)
      .limit(limit)
      .sort({ thoiGianTao: -1 })
      .lean(),
    DeThi.countDocuments(filter),
  ]);

  return { data, meta: buildPaginationMeta({ page, limit, total }) };
};

/**
 * Lấy danh sách đề trong thùng rác (đã xóa mềm)
 * @param {string} giaoVienId
 * @returns {Promise<object[]>}
 */
const layThungRac = async (giaoVienId) => {
  return DeThi.find({ nguoiDungId: giaoVienId, deletedAt: { $ne: null } })
    .populate('monHocId', 'ten')
    .sort({ deletedAt: -1 })
    .lean();
};

/**
 * Lấy chi tiết đề thi (kèm danh sách câu hỏi đầy đủ)
 * @param {string} deThiId
 * @param {string} giaoVienId - Kiểm tra quyền sở hữu
 * @returns {Promise<object>}
 */
const layChiTiet = async (deThiId, giaoVienId) => {
  const deThi = await DeThi.findOne({ _id: deThiId, nguoiDungId: giaoVienId, deletedAt: null })
    .populate('monHocId', 'ten moTa')
    .populate({ path: 'cauHois.cauHoiId', populate: { path: 'chuDeId', select: 'ten' } })
    .lean();

  if (!deThi) throw Object.assign(new Error('Không tìm thấy đề thi'), { statusCode: 404 });
  return deThi;
};

// ─── TẠO & SỬA ────────────────────────────────────────────────────────────────

/**
 * Tạo đề thi mới
 * @param {string} giaoVienId
 * @param {object} data - Thông tin đề
 * @returns {Promise<object>} Đề thi vừa tạo
 */
const taoDeThi = async (giaoVienId, data) => {
  const {
    monHocId, ten, moTa, thoiGianPhut, soLanThiToiDa,
    tronCauHoi, tronDapAn, choPhepXemLai, trangThai,
    thoiGianMo, thoiGianDong, thangDiemToiDa,
  } = data;

  // Sinh mã đề tự động
  const maDeThi = `DE${Date.now().toString(36).toUpperCase()}`;

  return DeThi.create({
    monHocId, ten, moTa, thoiGianPhut, maDeThi,
    soLanThiToiDa: soLanThiToiDa || 0,
    tronCauHoi: tronCauHoi || false,
    tronDapAn: tronDapAn || false,
    choPhepXemLai: choPhepXemLai !== false,
    trangThai: trangThai || TRANG_THAI_DE_THI.NHAP,
    thoiGianMo: thoiGianMo || null,
    thoiGianDong: thoiGianDong || null,
    thangDiemToiDa: thangDiemToiDa || null,
    nguoiDungId: giaoVienId,
  });
};

/**
 * Cập nhật thông tin đề thi
 * @param {string} deThiId
 * @param {string} giaoVienId
 * @param {object} data
 * @returns {Promise<object>}
 */
const capNhatDeThi = async (deThiId, giaoVienId, data) => {
  const {
    ten, moTa, thoiGianPhut, soLanThiToiDa, monHocId,
    tronCauHoi, tronDapAn, choPhepXemLai, trangThai,
    thoiGianMo, thoiGianDong, thangDiemToiDa,
  } = data;

  const updated = await DeThi.findOneAndUpdate(
    { _id: deThiId, nguoiDungId: giaoVienId, deletedAt: null },
    {
      $set: {
        ten, moTa, thoiGianPhut, soLanThiToiDa, monHocId,
        tronCauHoi, tronDapAn, choPhepXemLai, trangThai,
        thoiGianMo, thoiGianDong, thangDiemToiDa,
      },
    },
    { new: true, runValidators: true }
  );

  if (!updated) throw Object.assign(new Error('Không tìm thấy đề thi hoặc không có quyền'), { statusCode: 404 });
  return updated;
};

// ─── XÓA MỀM / KHÔI PHỤC / XÓA HẲN ────────────────────────────────────────

/**
 * Xóa mềm đề thi (đưa vào thùng rác)
 * @param {string} deThiId
 * @param {string} giaoVienId
 */
const xoaMem = async (deThiId, giaoVienId) => {
  const result = await DeThi.findOneAndUpdate(
    { _id: deThiId, nguoiDungId: giaoVienId, deletedAt: null },
    { $set: { deletedAt: new Date() } }
  );
  if (!result) throw Object.assign(new Error('Không tìm thấy đề thi'), { statusCode: 404 });
};

/**
 * Khôi phục đề thi từ thùng rác
 * @param {string} deThiId
 * @param {string} giaoVienId
 */
const khoiPhuc = async (deThiId, giaoVienId) => {
  const result = await DeThi.findOneAndUpdate(
    { _id: deThiId, nguoiDungId: giaoVienId, deletedAt: { $ne: null } },
    { $set: { deletedAt: null } }
  );
  if (!result) throw Object.assign(new Error('Không tìm thấy đề thi trong thùng rác'), { statusCode: 404 });
};

/**
 * Xóa hẳn đề thi (không thể khôi phục)
 * @param {string} deThiId
 * @param {string} giaoVienId
 */
const xoaHan = async (deThiId, giaoVienId) => {
  const result = await DeThi.findOneAndDelete({ _id: deThiId, nguoiDungId: giaoVienId });
  if (!result) throw Object.assign(new Error('Không tìm thấy đề thi'), { statusCode: 404 });
};

// ─── QUẢN LÝ CÂU HỎI TRONG ĐỀ ──────────────────────────────────────────────

/**
 * Thêm câu hỏi vào đề thi (từ ngân hàng)
 * @param {string} deThiId
 * @param {string} giaoVienId
 * @param {string[]} cauHoiIds - Mảng ObjectId câu hỏi cần thêm
 * @returns {Promise<object>} Đề thi sau khi thêm
 */
const themCauHoi = async (deThiId, giaoVienId, cauHoiIds) => {
  const deThi = await DeThi.findOne({ _id: deThiId, nguoiDungId: giaoVienId, deletedAt: null });
  if (!deThi) throw Object.assign(new Error('Không tìm thấy đề thi'), { statusCode: 404 });

  // Lọc bỏ câu đã có trong đề
  const idHienCo = new Set(deThi.cauHois.map((c) => c.cauHoiId.toString()));
  const thuTuMax = deThi.cauHois.length;

  const cauMoi = cauHoiIds
    .filter((id) => !idHienCo.has(id))
    .map((id, idx) => ({ cauHoiId: id, thuTu: thuTuMax + idx + 1 }));

  if (cauMoi.length === 0) return deThi;

  deThi.cauHois.push(...cauMoi);
  await deThi.save();
  return deThi;
};

/**
 * Xóa câu hỏi khỏi đề thi
 * @param {string} deThiId
 * @param {string} giaoVienId
 * @param {string} cauHoiId
 * @returns {Promise<object>}
 */
const xoaCauHoiKhoiDe = async (deThiId, giaoVienId, cauHoiId) => {
  const deThi = await DeThi.findOne({ _id: deThiId, nguoiDungId: giaoVienId, deletedAt: null });
  if (!deThi) throw Object.assign(new Error('Không tìm thấy đề thi'), { statusCode: 404 });

  deThi.cauHois = deThi.cauHois.filter((c) => c.cauHoiId.toString() !== cauHoiId);
  // Đánh lại thứ tự
  deThi.cauHois.forEach((c, i) => { c.thuTu = i + 1; });
  await deThi.save();
  return deThi;
};

// ─── XUẤT BẢN & LINK CÔNG KHAI ──────────────────────────────────────────────

/**
 * Xuất bản đề thi cho một lớp
 * @param {string} deThiId
 * @param {string} giaoVienId
 * @param {string} lopHocId
 * @returns {Promise<object>}
 */
const xuatBanChoLop = async (deThiId, giaoVienId, lopHocId) => {
  const deThi = await DeThi.findOne({ _id: deThiId, nguoiDungId: giaoVienId, deletedAt: null });
  if (!deThi) throw Object.assign(new Error('Không tìm thấy đề thi'), { statusCode: 404 });

  const daXuatBan = deThi.lopHocIds.some((l) => l.lopHocId.toString() === lopHocId);
  if (!daXuatBan) {
    deThi.lopHocIds.push({ lopHocId, thoiGianXuatBan: new Date() });
    deThi.trangThai = TRANG_THAI_DE_THI.CONG_KHAI;
    await deThi.save();
  }
  return deThi;
};

/**
 * Thu hồi đề thi khỏi một lớp
 * @param {string} deThiId
 * @param {string} giaoVienId
 * @param {string} lopHocId
 */
const thuHoiKhoiLop = async (deThiId, giaoVienId, lopHocId) => {
  await DeThi.findOneAndUpdate(
    { _id: deThiId, nguoiDungId: giaoVienId },
    { $pull: { lopHocIds: { lopHocId } } }
  );
};

/**
 * Tạo/cập nhật link thi công khai (ẩn danh) cho đề thi
 * @param {string} deThiId
 * @param {string} giaoVienId
 * @returns {Promise<{maTruyCap: string, duongDanTruyCap: string}>}
 */
const taoLinkCongKhai = async (deThiId, giaoVienId) => {
  const deThi = await DeThi.findOne({ _id: deThiId, nguoiDungId: giaoVienId, deletedAt: null });
  if (!deThi) throw Object.assign(new Error('Không tìm thấy đề thi'), { statusCode: 404 });

  if (!deThi.maTruyCap) {
    const maTruyCap = generateAccessCode(8);
    const duongDanTruyCap = `${TIEN_TO_DUONG_DAN}${maTruyCap}`;
    deThi.maTruyCap = maTruyCap;
    deThi.duongDanTruyCap = duongDanTruyCap;
    await deThi.save();
  }

  return { maTruyCap: deThi.maTruyCap, duongDanTruyCap: deThi.duongDanTruyCap };
};

/**
 * Hủy link công khai
 * @param {string} deThiId
 * @param {string} giaoVienId
 */
const huyLinkCongKhai = async (deThiId, giaoVienId) => {
  await DeThi.findOneAndUpdate(
    { _id: deThiId, nguoiDungId: giaoVienId },
    { $set: { maTruyCap: null, duongDanTruyCap: null } }
  );
};

/**
 * Lấy danh sách môn học (dropdown)
 * @returns {Promise<object[]>}
 */
const layDanhSachMonHoc = async () => {
  return MonHoc.find({}).sort({ ten: 1 }).lean();
};

module.exports = {
  layDanhSach, layThungRac, layChiTiet,
  taoDeThi, capNhatDeThi,
  xoaMem, khoiPhuc, xoaHan,
  themCauHoi, xoaCauHoiKhoiDe,
  xuatBanChoLop, thuHoiKhoiLop,
  taoLinkCongKhai, huyLinkCongKhai,
  layDanhSachMonHoc,
};

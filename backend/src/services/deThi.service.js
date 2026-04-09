/**
 * @fileoverview Service quản lý đề thi (dành cho Giáo viên).
 * Bao gồm CRUD đề, quản lý câu hỏi trong đề, xuất bản lớp, link công khai, soft delete.
 */

const DeThi = require('../models/DeThi');
const CauHoi = require('../models/CauHoi');
const ChuDe = require('../models/ChuDe');
const MonHoc = require('../models/MonHoc');
const { importDocx, importPdf } = require('./importExport.service');
const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');
const { generateAccessCode } = require('../utils/slugify');

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
  const { monHocId, search } = query;

  const filter = { nguoiDungId: giaoVienId, deletedAt: null };
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
    tronCauHoi, tronDapAn, choPhepXemLai,
    thoiGianMo, thoiGianDong, thangDiemToiDa,
    doiTuongThi, cheDoXemDiem, cheDoXemDapAn, diemToiThieuXemDapAn,
    lopHocIds, sinhVienIds, cauHois
  } = data;

  // Sinh mã đề tự động
  const maDeThi = `DE${Date.now().toString(36).toUpperCase()}`;

  return DeThi.create({
    monHocId, ten, moTa, thoiGianPhut, maDeThi,
    soLanThiToiDa: soLanThiToiDa || 0,
    tronCauHoi: tronCauHoi || false,
    tronDapAn: tronDapAn || false,
    choPhepXemLai: choPhepXemLai !== false,
    thoiGianMo: thoiGianMo || null,
    thoiGianDong: thoiGianDong || null,
    thangDiemToiDa: thangDiemToiDa || null,
    doiTuongThi: doiTuongThi || 'TAT_CA',
    cheDoXemDiem: cheDoXemDiem || 'THI_XONG',
    cheDoXemDapAn: cheDoXemDapAn || 'THI_XONG',
    diemToiThieuXemDapAn: diemToiThieuXemDapAn || 0,
    lopHocIds: lopHocIds ? lopHocIds.map(id => ({ lopHocId: id })) : [],
    sinhVienIds: sinhVienIds ? sinhVienIds.map(id => ({ sinhVienId: id })) : [],
    cauHois: Array.isArray(cauHois)
      ? cauHois.map((c, idx) => ({
          cauHoiId: c.cauHoiId,
          diem: c.diem ?? 1,
          thuTu: c.thuTu ?? (idx + 1),
        }))
      : [],
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
    tronCauHoi, tronDapAn, choPhepXemLai,
    thoiGianMo, thoiGianDong, thangDiemToiDa,
    doiTuongThi, cheDoXemDiem, cheDoXemDapAn, diemToiThieuXemDapAn,
    lopHocIds, sinhVienIds
  } = data;

  const setPayload = {
    ten, moTa, thoiGianPhut, soLanThiToiDa, monHocId,
    tronCauHoi, tronDapAn, choPhepXemLai,
    thoiGianMo, thoiGianDong, thangDiemToiDa,
    ...(doiTuongThi !== undefined && { doiTuongThi }),
    ...(cheDoXemDiem !== undefined && { cheDoXemDiem }),
    ...(cheDoXemDapAn !== undefined && { cheDoXemDapAn }),
    ...(diemToiThieuXemDapAn !== undefined && { diemToiThieuXemDapAn }),
    ...(lopHocIds !== undefined && { lopHocIds: lopHocIds.map(id => ({ lopHocId: id })) }),
    ...(sinhVienIds !== undefined && { sinhVienIds: sinhVienIds.map(id => ({ sinhVienId: id })) }),
  };

  // Nếu đổi đối tượng thi khỏi TAT_CA thì thu hồi link công khai ngay.
  if (doiTuongThi !== undefined && doiTuongThi !== 'TAT_CA') {
    setPayload.maTruyCap = null;
    setPayload.duongDanTruyCap = null;
  }

  const updated = await DeThi.findOneAndUpdate(
    { _id: deThiId, nguoiDungId: giaoVienId, deletedAt: null },
    {
      $set: setPayload,
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
  if (deThi.doiTuongThi !== 'TAT_CA') {
    throw Object.assign(
      new Error('Chỉ đề thi ở chế độ "Tất cả mọi người" mới được tạo link công khai'),
      { statusCode: 400 }
    );
  }

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

/**
 * Import câu hỏi từ file PDF/DOCX vào đề thi.
 * Quy trình:
 *   1. Parse file → danh sách câu hỏi thô
 *   2. Tạo các bản ghi CauHoi trong ngân hàng (thuộc chuDeId của GV)
 *   3. Thêm chúng vào đề thi (DeThi.cauHois)
 *
 * @param {string} deThiId
 * @param {string} giaoVienId
 * @param {Buffer} fileBuffer  - nội dung file đọc vào bộ nhớ
 * @param {string} mimetype    - 'application/pdf' hoặc DOCX mimetype
 * @param {string} chuDeId     - ObjectId chủ đề để lưu câu hỏi vào
 * @returns {Promise<{soLuongNhap: number}>}
 */
const importTuFile = async (deThiId, giaoVienId, fileBuffer, mimetype, chuDeId) => {
  // Kiểm tra đề thi thuộc giáo viên
  const deThi = await DeThi.findOne({ _id: deThiId, nguoiDungId: giaoVienId, deletedAt: null });
  if (!deThi) throw Object.assign(new Error('Không tìm thấy đề thi'), { statusCode: 404 });

  // Kiểm tra chủ đề tồn tại
  const chuDe = await ChuDe.findById(chuDeId);
  if (!chuDe) throw Object.assign(new Error('Chủ đề không tồn tại'), { statusCode: 404 });

  // Parse file → danh sách câu hỏi thô
  const isPdf = mimetype === 'application/pdf';
  const rawQuestions = isPdf
    ? await importPdf(fileBuffer)
    : await importDocx(fileBuffer);

  // Tạo câu hỏi trong ngân hàng
  const created = await CauHoi.insertMany(
    rawQuestions.map((q) => ({
      ...q,
      chuDeId,
      nguoiDungId: giaoVienId,
    }))
  );

  // Tính vị trí bắt đầu cho thứ tự mới
  const baseOrder = deThi.cauHois.length;

  // Thêm vào đề thi (tránh trùng nếu đã tồn tại)
  const existingIds = new Set(deThi.cauHois.map((c) => c.cauHoiId.toString()));
  const toAdd = created
    .filter((c) => !existingIds.has(c._id.toString()))
    .map((c, i) => ({ cauHoiId: c._id, thuTu: baseOrder + i }));

  if (toAdd.length) {
    await DeThi.findByIdAndUpdate(deThiId, { $push: { cauHois: { $each: toAdd } } });
  }

  return { soLuongNhap: toAdd.length };
};

module.exports = {
  layDanhSach, layThungRac, layChiTiet,
  taoDeThi, capNhatDeThi,
  xoaMem, khoiPhuc, xoaHan,
  themCauHoi, xoaCauHoiKhoiDe,
  xuatBanChoLop, thuHoiKhoiLop,
  taoLinkCongKhai, huyLinkCongKhai,
  layDanhSachMonHoc,
  importTuFile,
};

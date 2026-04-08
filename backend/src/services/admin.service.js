/**
 * @fileoverview Service cho các chức năng quản trị hệ thống (Admin).
 * Bao gồm: dashboard, quản lý người dùng, môn học, đề thi, câu hỏi (view only).
 */

const bcrypt = require('bcryptjs');
const NguoiDung = require('../models/NguoiDung');
const MonHoc = require('../models/MonHoc');
const DeThi = require('../models/DeThi');
const CauHoi = require('../models/CauHoi');
const ChuDe = require('../models/ChuDe');
const NganHang = require('../models/NganHang');
const PhienThi = require('../models/PhienThi');
const { VAI_TRO } = require('../utils/constants');
const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');

const SALT_ROUNDS = 12;

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

/**
 * Lấy thống kê tổng quan cho dashboard admin
 * @returns {Promise<object>} Các số liệu thống kê
 */
const layDashboard = async () => {
  const [tongSinhVien, tongGiaoVien, tongDeThi, tongCauHoi, tongLuotThi] = await Promise.all([
    NguoiDung.countDocuments({ vaiTro: VAI_TRO.SINH_VIEN }),
    NguoiDung.countDocuments({ vaiTro: VAI_TRO.GIAO_VIEN }),
    DeThi.countDocuments({ deletedAt: null }),
    CauHoi.countDocuments({}),
    PhienThi.countDocuments({}),
  ]);

  return { tongSinhVien, tongGiaoVien, tongDeThi, tongCauHoi, tongLuotThi };
};

// ─── QUẢN LÝ NGƯỜI DÙNG ────────────────────────────────────────────────────────

/**
 * Lấy danh sách tất cả người dùng có phân trang và tìm kiếm
 * @param {object} query - req.query
 * @returns {Promise<{data: object[], meta: object}>}
 */
const layDanhSachNguoiDung = async (query) => {
  const { page, limit, skip } = getPaginationParams(query);
  const { search, vaiTro } = query;

  const filter = {};
  if (vaiTro && Object.values(VAI_TRO).includes(vaiTro)) filter.vaiTro = vaiTro;
  if (search) {
    filter.$or = [
      { ho: { $regex: search, $options: 'i' } },
      { ten: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { maNguoiDung: { $regex: search, $options: 'i' } },
    ];
  }

  const [data, total] = await Promise.all([
    NguoiDung.find(filter).skip(skip).limit(limit).sort({ thoiGianTao: -1 }).lean({ virtuals: true }),
    NguoiDung.countDocuments(filter),
  ]);

  return { data, meta: buildPaginationMeta({ page, limit, total }) };
};

/**
 * Lấy chi tiết một người dùng theo ID
 * @param {string} id - ObjectId
 * @returns {Promise<object>}
 */
const layChiTietNguoiDung = async (id) => {
  const nguoiDung = await NguoiDung.findById(id).lean({ virtuals: true });
  if (!nguoiDung) throw Object.assign(new Error('Không tìm thấy người dùng'), { statusCode: 404 });
  return nguoiDung;
};

/**
 * Cập nhật thông tin người dùng (Admin có thể sửa email, SĐT)
 * @param {string} id
 * @param {object} data
 * @returns {Promise<object>}
 */
const capNhatNguoiDung = async (id, { ho, ten, email, soDienThoai }) => {
  const updated = await NguoiDung.findByIdAndUpdate(
    id,
    { $set: { ho, ten, email, soDienThoai } },
    { new: true, runValidators: true }
  ).lean({ virtuals: true });

  if (!updated) throw Object.assign(new Error('Không tìm thấy người dùng'), { statusCode: 404 });
  return updated;
};

/**
 * Admin reset mật khẩu cho người dùng
 * @param {string} id - ObjectId người dùng
 * @param {string} matKhauMoi
 * @returns {Promise<void>}
 */
const datLaiMatKhau = async (id, matKhauMoi) => {
  const hash = await bcrypt.hash(matKhauMoi, SALT_ROUNDS);
  const result = await NguoiDung.findByIdAndUpdate(id, { $set: { matKhau: hash } });
  if (!result) throw Object.assign(new Error('Không tìm thấy người dùng'), { statusCode: 404 });
};

/**
 * Admin thay đổi vai trò người dùng
 * @param {string} id
 * @param {string} vaiTroMoi
 * @returns {Promise<object>}
 */
const doiVaiTro = async (id, vaiTroMoi) => {
  if (!Object.values(VAI_TRO).includes(vaiTroMoi)) {
    throw Object.assign(new Error('Vai trò không hợp lệ'), { statusCode: 400 });
  }
  const updated = await NguoiDung.findByIdAndUpdate(
    id,
    { $set: { vaiTro: vaiTroMoi } },
    { new: true }
  ).lean({ virtuals: true });

  if (!updated) throw Object.assign(new Error('Không tìm thấy người dùng'), { statusCode: 404 });
  return updated;
};

/**
 * Xóa người dùng (hard delete - admin only)
 * @param {string} id
 * @returns {Promise<void>}
 */
const xoaNguoiDung = async (id) => {
  const result = await NguoiDung.findByIdAndDelete(id);
  if (!result) throw Object.assign(new Error('Không tìm thấy người dùng'), { statusCode: 404 });
};

// ─── QUẢN LÝ MÔN HỌC ────────────────────────────────────────────────────────

/**
 * Lấy danh sách môn học
 * @returns {Promise<object[]>}
 */
const layDanhSachMonHoc = async () => {
  return MonHoc.find({}).sort({ ten: 1 }).lean();
};

/**
 * Tạo môn học mới
 * @param {object} data - { ten, moTa }
 * @returns {Promise<object>}
 */
const taoMonHoc = async ({ ten, moTa }) => {
  const tonTai = await MonHoc.findOne({ ten: { $regex: `^${ten}$`, $options: 'i' } });
  if (tonTai) throw Object.assign(new Error('Tên môn học đã tồn tại'), { statusCode: 409 });
  return MonHoc.create({ ten, moTa });
};

/**
 * Cập nhật môn học
 * @param {string} id
 * @param {object} data
 * @returns {Promise<object>}
 */
const capNhatMonHoc = async (id, { ten, moTa }) => {
  const updated = await MonHoc.findByIdAndUpdate(id, { $set: { ten, moTa } }, { new: true, runValidators: true });
  if (!updated) throw Object.assign(new Error('Không tìm thấy môn học'), { statusCode: 404 });
  return updated;
};

/**
 * Xóa môn học
 * @param {string} id
 * @returns {Promise<void>}
 */
const xoaMonHoc = async (id) => {
  const result = await MonHoc.findByIdAndDelete(id);
  if (!result) throw Object.assign(new Error('Không tìm thấy môn học'), { statusCode: 404 });
};

// ─── XEM ĐỀ THI / CÂU HỎI (ADMIN VIEW) ─────────────────────────────────────

/**
 * Lấy danh sách đề thi với filter giáo viên (admin xem)
 * @param {object} query
 * @returns {Promise<{data: object[], meta: object}>}
 */
const layDanhSachDeThi = async (query) => {
  const { page, limit, skip } = getPaginationParams(query);
  const { giaoVienId } = query;

  const filter = { deletedAt: null };
  if (giaoVienId) filter.nguoiDungId = giaoVienId;

  const [data, total] = await Promise.all([
    DeThi.find(filter)
      .populate('nguoiDungId', 'ho ten email maNguoiDung')
      .populate('monHocId', 'ten')
      .skip(skip)
      .limit(limit)
      .sort({ thoiGianTao: -1 })
      .lean({ virtuals: true }),
    DeThi.countDocuments(filter),
  ]);

  return { data, meta: buildPaginationMeta({ page, limit, total }) };
};

/**
 * Thống kê đề thi cho trang admin (tổng, nháp, công khai, số giáo viên có đề)
 * @returns {Promise<{ tongDeThi: number, deNhap: number, congKhai: number, soGiangVien: number }>}
 */
const layThongKeDeThiAdmin = async () => {
  const base = { deletedAt: null };
  const [tongDeThi, nguoiDungIds] = await Promise.all([
    DeThi.countDocuments(base),
    DeThi.distinct('nguoiDungId', base),
  ]);
  return {
    tongDeThi,
    soGiangVien: nguoiDungIds.filter(Boolean).length,
  };
};

/**
 * Lấy danh sách câu hỏi toàn hệ thống cho admin (read-only).
 * Hỗ trợ tìm kiếm nội dung, lọc theo giáo viên/môn học, phân trang.
 * @param {object} query
 * @returns {Promise<{data: object[], meta: object}>}
 */
const layDanhSachCauHoiAdmin = async (query) => {
  const { page, limit, skip } = getPaginationParams(query);
  const { search, giaoVienId, monHocId, loaiCauHoi, doKho } = query;

  const filter = {};
  if (giaoVienId) filter.nguoiDungId = giaoVienId;
  if (loaiCauHoi) filter.loaiCauHoi = loaiCauHoi;
  if (doKho) filter.doKho = doKho;
  if (search) filter.noiDung = { $regex: search, $options: 'i' };

  if (monHocId) {
    const [chuDeIds, nganHangIds] = await Promise.all([
      ChuDe.find({ monHocId }).distinct('_id'),
      NganHang.find({ monHocId, deletedAt: null }).distinct('_id'),
    ]);

    // Câu hỏi có thể thuộc mô hình cũ (chuDeId) hoặc mô hình mới (nganHangId).
    filter.$or = [{ chuDeId: { $in: chuDeIds } }, { nganHangId: { $in: nganHangIds } }];
  }

  const [data, total] = await Promise.all([
    CauHoi.find(filter)
      .populate('nguoiDungId', 'ho ten email maNguoiDung')
      .populate({ path: 'chuDeId', select: 'ten monHocId', populate: { path: 'monHocId', select: 'ten' } })
      .populate({ path: 'nganHangId', select: 'ten monHocId', populate: { path: 'monHocId', select: 'ten' } })
      .sort({ thoiGianTao: -1 })
      .skip(skip)
      .limit(limit)
      .lean({ virtuals: true }),
    CauHoi.countDocuments(filter),
  ]);

  return { data, meta: buildPaginationMeta({ page, limit, total }) };
};

/**
 * Admin xóa hẳn đề thi (không phục hồi)
 * @param {string} id
 * @returns {Promise<void>}
 */
const xoaHanDeThi = async (id) => {
  const result = await DeThi.findByIdAndDelete(id);
  if (!result) throw Object.assign(new Error('Không tìm thấy đề thi'), { statusCode: 404 });
};

module.exports = {
  layDashboard,
  layDanhSachNguoiDung,
  layChiTietNguoiDung,
  capNhatNguoiDung,
  datLaiMatKhau,
  doiVaiTro,
  xoaNguoiDung,
  layDanhSachMonHoc,
  taoMonHoc,
  capNhatMonHoc,
  xoaMonHoc,
  layDanhSachDeThi,
  layThongKeDeThiAdmin,
  layDanhSachCauHoiAdmin,
  xoaHanDeThi,
};

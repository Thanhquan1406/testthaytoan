/**
 * @fileoverview Service quản lý lớp học.
 * Giáo viên CRUD lớp, thêm/xóa sinh viên; Sinh viên xem lớp của mình.
 */

const LopHoc = require('../models/LopHoc');
const NguoiDung = require('../models/NguoiDung');
const { VAI_TRO } = require('../utils/constants');

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
 * Tạo lớp học mới
 * @param {string} giaoVienId
 * @param {string} ten - Tên lớp
 * @param {string[]} [sinhVienIds] - Danh sách ObjectId sinh viên thêm vào ngay
 * @returns {Promise<object>}
 */
const taoLopHoc = async (giaoVienId, ten, sinhVienIds = []) => {
  return LopHoc.create({ ten, giaoVienId, sinhVienIds });
};

/**
 * Cập nhật tên lớp và danh sách sinh viên
 * @param {string} lopId
 * @param {string} giaoVienId
 * @param {object} data - { ten, sinhVienIds }
 * @returns {Promise<object>}
 */
const capNhatLopHoc = async (lopId, giaoVienId, { ten, sinhVienIds }) => {
  const updated = await LopHoc.findOneAndUpdate(
    { _id: lopId, giaoVienId },
    { $set: { ten, ...(sinhVienIds !== undefined && { sinhVienIds }) } },
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

/**
 * Lấy danh sách tất cả sinh viên trong hệ thống (cho dropdown thêm vào lớp)
 * @param {string} [keyword] - Tìm theo tên/email
 * @returns {Promise<object[]>}
 */
const layDanhSachSinhVien = async (keyword) => {
  const filter = { vaiTro: VAI_TRO.SINH_VIEN };
  if (keyword) {
    filter.$or = [
      { ho: { $regex: keyword, $options: 'i' } },
      { ten: { $regex: keyword, $options: 'i' } },
      { email: { $regex: keyword, $options: 'i' } },
      { maNguoiDung: { $regex: keyword, $options: 'i' } },
    ];
  }
  return NguoiDung.find(filter)
    .select('maNguoiDung ho ten email')
    .limit(50)
    .lean({ virtuals: true });
};

module.exports = {
  layDanhSachCuaGiaoVien,
  layChiTietCuaGiaoVien,
  taoLopHoc,
  capNhatLopHoc,
  xoaLopHoc,
  layLopCuaSinhVien,
  layChiTietCuaSinhVien,
  layDanhSachSinhVien,
};

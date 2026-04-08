/**
 * @fileoverview Service quản lý Ngân hàng câu hỏi (CRUD).
 * Mỗi ngân hàng hoàn toàn riêng tư cho từng giáo viên.
 */

const NganHang = require('../models/NganHang');
const CauTruc = require('../models/CauTruc');
const CauHoi = require('../models/CauHoi');
const MonHoc = require('../models/MonHoc');

/**
 * Lấy danh sách ngân hàng của giáo viên
 * @param {string} giaoVienId
 * @returns {Promise<object[]>}
 */
const layDanhSach = async (giaoVienId) => {
  const dsNganHang = await NganHang.find({ nguoiDungId: giaoVienId, deletedAt: null })
    .populate('monHocId', 'ten')
    .sort({ thoiGianTao: -1 })
    .lean();

  if (!dsNganHang.length) return dsNganHang;

  // Lấy tổng số câu hỏi theo từng nganHangId thông qua bảng CauHoi
  const cacNganHangId = dsNganHang.map(nh => nh._id);
  const aggregateResult = await CauHoi.aggregate([
    { $match: { nganHangId: { $in: cacNganHangId } } },
    { $group: { _id: "$nganHangId", count: { $sum: 1 } } }
  ]);

  const mapCount = {};
  aggregateResult.forEach(item => {
    mapCount[item._id.toString()] = item.count;
  });

  return dsNganHang.map(nh => ({
    ...nh,
    soCauHoi: mapCount[nh._id.toString()] || 0
  }));
};

/**
 * Tạo ngân hàng mới
 * @param {string} giaoVienId
 * @param {object} data - { ten, moTa?, monHocId? }
 * @returns {Promise<object>}
 */
const taoNganHang = async (giaoVienId, data) => {
  const { ten, moTa, monHocId } = data;

  if (!ten || !ten.trim()) {
    throw Object.assign(new Error('Tên ngân hàng không được để trống'), { statusCode: 400 });
  }

  // Kiểm tra môn học tồn tại nếu có
  if (monHocId) {
    const monHoc = await MonHoc.findById(monHocId);
    if (!monHoc) throw Object.assign(new Error('Môn học không tồn tại'), { statusCode: 404 });
  }

  const nganHang = await NganHang.create({
    ten: ten.trim(),
    moTa: moTa || '',
    monHocId: monHocId || null,
    nguoiDungId: giaoVienId,
  });

  return nganHang.toObject();
};

/**
 * Lấy chi tiết ngân hàng (kèm kiểm tra quyền)
 * @param {string} id
 * @param {string} giaoVienId
 * @returns {Promise<object>}
 */
const layChiTiet = async (id, giaoVienId) => {
  const nganHang = await NganHang.findOne({ _id: id, nguoiDungId: giaoVienId, deletedAt: null })
    .populate('monHocId', 'ten')
    .lean();

  if (!nganHang) {
    throw Object.assign(new Error('Không tìm thấy ngân hàng hoặc không có quyền'), { statusCode: 404 });
  }

  // Đếm số lượng câu hỏi thực tại bảng CauHoi
  const soCauHoi = await CauHoi.countDocuments({ nganHangId: id });
  nganHang.soCauHoi = soCauHoi;

  return nganHang;
};

/**
 * Cập nhật ngân hàng (tên, mô tả, môn học)
 * @param {string} id
 * @param {string} giaoVienId
 * @param {object} data
 * @returns {Promise<object>}
 */
const capNhatNganHang = async (id, giaoVienId, data) => {
  const allowedFields = {};
  if (data.ten !== undefined) allowedFields.ten = data.ten.trim();
  if (data.moTa !== undefined) allowedFields.moTa = data.moTa;
  if (data.monHocId !== undefined) allowedFields.monHocId = data.monHocId || null;

  const updated = await NganHang.findOneAndUpdate(
    { _id: id, nguoiDungId: giaoVienId, deletedAt: null },
    { $set: allowedFields },
    { new: true, runValidators: true }
  ).lean();

  if (!updated) {
    throw Object.assign(new Error('Không tìm thấy ngân hàng hoặc không có quyền'), { statusCode: 404 });
  }

  return updated;
};

/**
 * Xóa ngân hàng (soft delete) + xóa toàn bộ cấu trúc + câu hỏi bên trong
 * @param {string} id
 * @param {string} giaoVienId
 */
const xoaNganHang = async (id, giaoVienId) => {
  const nganHang = await NganHang.findOne({ _id: id, nguoiDungId: giaoVienId, deletedAt: null });

  if (!nganHang) {
    throw Object.assign(new Error('Không tìm thấy ngân hàng hoặc không có quyền'), { statusCode: 404 });
  }

  // Soft delete ngân hàng
  nganHang.deletedAt = new Date();
  await nganHang.save();

  // Xóa toàn bộ cấu trúc thuộc ngân hàng
  await CauTruc.deleteMany({ nganHangId: id });

  // Gỡ liên kết câu hỏi khỏi ngân hàng (không xóa câu hỏi, chỉ set null)
  await CauHoi.updateMany(
    { nganHangId: id },
    { $set: { nganHangId: null, cauTrucId: null } }
  );
};

/**
 * Lấy danh sách môn học (cho dropdown tạo ngân hàng)
 * @returns {Promise<object[]>}
 */
const layDanhSachMonHoc = async () => {
  return MonHoc.find({}).sort({ ten: 1 }).lean();
};

module.exports = {
  layDanhSach,
  taoNganHang,
  layChiTiet,
  capNhatNganHang,
  xoaNganHang,
  layDanhSachMonHoc,
};

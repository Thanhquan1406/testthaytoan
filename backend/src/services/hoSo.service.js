/**
 * @fileoverview Service quản lý hồ sơ người dùng (dùng chung cho GV, SV, Admin).
 */

const bcrypt = require('bcryptjs');
const NguoiDung = require('../models/NguoiDung');

const SALT_ROUNDS = 12;

/**
 * Lấy thông tin hồ sơ của người dùng hiện tại
 * @param {string} nguoiDungId - ObjectId
 * @returns {Promise<object>} Hồ sơ người dùng (không có mật khẩu)
 */
const layHoSo = async (nguoiDungId) => {
  const nguoiDung = await NguoiDung.findById(nguoiDungId).lean({ virtuals: true });
  if (!nguoiDung) {
    throw Object.assign(new Error('Người dùng không tồn tại'), { statusCode: 404 });
  }
  return nguoiDung;
};

/**
 * Cập nhật thông tin hồ sơ (họ, tên, SĐT - không cho sửa email/vai trò)
 * @param {string} nguoiDungId
 * @param {object} data - { ho, ten, soDienThoai }
 * @returns {Promise<object>} Hồ sơ sau khi cập nhật
 */
const capNhatHoSo = async (nguoiDungId, { ho, ten, soDienThoai }) => {
  // Kiểm tra SĐT trùng với người dùng khác
  if (soDienThoai) {
    const trungSdt = await NguoiDung.findOne({ soDienThoai, _id: { $ne: nguoiDungId } });
    if (trungSdt) {
      throw Object.assign(new Error('Số điện thoại đã được sử dụng bởi tài khoản khác'), {
        statusCode: 409,
      });
    }
  }

  const updated = await NguoiDung.findByIdAndUpdate(
    nguoiDungId,
    { $set: { ho, ten, soDienThoai } },
    { new: true, runValidators: true }
  ).lean({ virtuals: true });

  if (!updated) {
    throw Object.assign(new Error('Không tìm thấy người dùng'), { statusCode: 404 });
  }

  return updated;
};

/**
 * Đổi mật khẩu người dùng
 * @param {string} nguoiDungId
 * @param {string} matKhauCu - Mật khẩu hiện tại để xác nhận
 * @param {string} matKhauMoi
 * @returns {Promise<void>}
 */
const doiMatKhau = async (nguoiDungId, matKhauCu, matKhauMoi) => {
  const nguoiDung = await NguoiDung.findById(nguoiDungId).select('+matKhau');
  if (!nguoiDung) {
    throw Object.assign(new Error('Người dùng không tồn tại'), { statusCode: 404 });
  }

  const dung = await bcrypt.compare(matKhauCu, nguoiDung.matKhau);
  if (!dung) {
    throw Object.assign(new Error('Mật khẩu cũ không đúng'), { statusCode: 400 });
  }

  nguoiDung.matKhau = await bcrypt.hash(matKhauMoi, SALT_ROUNDS);
  await nguoiDung.save();
};

module.exports = { layHoSo, capNhatHoSo, doiMatKhau };

/**
 * @fileoverview Mongoose model cho NguoiDung (người dùng hệ thống).
 * Gộp NguoiDung + VaiTro + NguoiDungVaiTro từ MySQL vào một document.
 */

const mongoose = require('mongoose');
const { VAI_TRO } = require('../utils/constants');

/**
 * @typedef {Object} NguoiDungDocument
 * @property {string} maNguoiDung - Mã định danh hiển thị (SV/GV code)
 * @property {string} ho - Họ
 * @property {string} ten - Tên
 * @property {string} email - Email đăng nhập (unique)
 * @property {string} soDienThoai - Số điện thoại (unique)
 * @property {string} [matKhau] - Mật khẩu đã hash (bcrypt), không có nếu đăng nhập Google
 * @property {string} [googleId] - Google subject ID nếu đăng ký qua Google OAuth
 * @property {string} vaiTro - Vai trò (ADMIN | GIAO_VIEN | SINH_VIEN)
 * @property {Date} thoiGianTao - Thời gian tạo tài khoản
 */

const nguoiDungSchema = new mongoose.Schema(
  {
    maNguoiDung: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    ho: {
      type: String,
      required: [true, 'Họ không được để trống'],
      trim: true,
      maxlength: [100, 'Họ tối đa 100 ký tự'],
    },
    ten: {
      type: String,
      required: [true, 'Tên không được để trống'],
      trim: true,
      maxlength: [100, 'Tên tối đa 100 ký tự'],
    },
    email: {
      type: String,
      required: [true, 'Email không được để trống'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ'],
    },
    soDienThoai: {
      type: String,
      required: [true, 'Số điện thoại không được để trống'],
      unique: true,
      trim: true,
      match: [/^[0-9]{10,11}$/, 'Số điện thoại không hợp lệ'],
    },
    matKhau: {
      type: String,
      // Không bắt buộc - user đăng nhập Google không có mật khẩu
      select: false,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    passwordChangedAt: {
      type: Date,
      default: null,
    },
    is2FAEnabled: {
      type: Boolean,
      default: false,
    },
    totpSecretEncrypted: {
      type: String,
      default: null,
      select: false,
    },
    totpEnabledAt: {
      type: Date,
      default: null,
    },
    vaiTro: {
      type: String,
      enum: Object.values(VAI_TRO),
      required: true,
      default: VAI_TRO.SINH_VIEN,
    },
  },
  {
    timestamps: { createdAt: 'thoiGianTao', updatedAt: 'thoiGianCapNhat' },
    // Tạo trường ảo hoTen (họ + tên) tiện lợi khi hiển thị
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/** Trường ảo: họ và tên đầy đủ */
nguoiDungSchema.virtual('hoTen').get(function () {
  return `${this.ho} ${this.ten}`;
});

/** Index để tìm kiếm nhanh theo vai trò */
nguoiDungSchema.index({ vaiTro: 1 });

const NguoiDung = mongoose.model('NguoiDung', nguoiDungSchema);

module.exports = NguoiDung;

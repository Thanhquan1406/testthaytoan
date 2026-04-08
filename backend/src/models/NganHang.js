/**
 * @fileoverview Mongoose model cho NganHang (Ngân hàng câu hỏi).
 * Mỗi ngân hàng thuộc về một giáo viên và có thể liên kết tới một môn học.
 */

const mongoose = require('mongoose');

const nganHangSchema = new mongoose.Schema(
  {
    ten: {
      type: String,
      required: [true, 'Tên ngân hàng không được để trống'],
      trim: true,
      maxlength: [300, 'Tên ngân hàng tối đa 300 ký tự'],
    },
    moTa: {
      type: String,
      trim: true,
      default: '',
    },
    monHocId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MonHoc',
      default: null,
    },
    nguoiDungId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NguoiDung',
      required: [true, 'Ngân hàng phải thuộc về một giáo viên'],
    },
    /** Cache số lượng câu hỏi để hiển thị nhanh trên card */
    soCauHoi: {
      type: Number,
      default: 0,
    },
    /** Soft delete: null = chưa xóa */
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: { createdAt: 'thoiGianTao', updatedAt: 'thoiGianCapNhat' },
  }
);

/** Index cho lọc nhanh theo giáo viên */
nganHangSchema.index({ nguoiDungId: 1, deletedAt: 1 });

const NganHang = mongoose.model('NganHang', nganHangSchema);

module.exports = NganHang;

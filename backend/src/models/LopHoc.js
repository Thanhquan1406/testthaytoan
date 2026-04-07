/**
 * @fileoverview Mongoose model cho LopHoc (lớp học).
 * Danh sách sinh viên nhúng trực tiếp thay thế bảng LopHocSinhVien.
 */

const mongoose = require('mongoose');

const lopHocSchema = new mongoose.Schema(
  {
    ten: {
      type: String,
      required: [true, 'Tên lớp học không được để trống'],
      trim: true,
      maxlength: [200, 'Tên lớp tối đa 200 ký tự'],
    },
    /** Giáo viên chủ nhiệm / tạo lớp */
    giaoVienId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NguoiDung',
      required: true,
    },
    /** Danh sách ObjectId của sinh viên trong lớp */
    sinhVienIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'NguoiDung',
      },
    ],
  },
  {
    timestamps: { createdAt: 'thoiGianTao', updatedAt: 'thoiGianCapNhat' },
  }
);

lopHocSchema.index({ giaoVienId: 1 });

const LopHoc = mongoose.model('LopHoc', lopHocSchema);

module.exports = LopHoc;

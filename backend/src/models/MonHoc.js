/**
 * @fileoverview Mongoose model cho MonHoc (môn học).
 */

const mongoose = require('mongoose');

const monHocSchema = new mongoose.Schema(
  {
    ten: {
      type: String,
      required: [true, 'Tên môn học không được để trống'],
      unique: true,
      trim: true,
      maxlength: [200, 'Tên môn học tối đa 200 ký tự'],
    },
    moTa: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: { createdAt: 'thoiGianTao', updatedAt: 'thoiGianCapNhat' },
  }
);

const MonHoc = mongoose.model('MonHoc', monHocSchema);

module.exports = MonHoc;

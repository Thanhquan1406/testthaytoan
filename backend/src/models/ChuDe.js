/**
 * @fileoverview Mongoose model cho ChuDe (chủ đề câu hỏi).
 * Mỗi chủ đề thuộc một môn học.
 */

const mongoose = require('mongoose');

const chuDeSchema = new mongoose.Schema(
  {
    ten: {
      type: String,
      required: [true, 'Tên chủ đề không được để trống'],
      trim: true,
      maxlength: [200, 'Tên chủ đề tối đa 200 ký tự'],
    },
    monHocId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MonHoc',
      required: [true, 'Chủ đề phải thuộc một môn học'],
    },
  },
  {
    timestamps: { createdAt: 'thoiGianTao', updatedAt: 'thoiGianCapNhat' },
  }
);

/** Không trùng tên chủ đề trong cùng một môn học */
chuDeSchema.index({ ten: 1, monHocId: 1 }, { unique: true });

const ChuDe = mongoose.model('ChuDe', chuDeSchema);

module.exports = ChuDe;

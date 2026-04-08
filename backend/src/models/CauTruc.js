/**
 * @fileoverview Mongoose model cho CauTruc (Cấu trúc / cây thư mục trong ngân hàng câu hỏi).
 * Dùng self-referencing parentId pattern để hỗ trợ cây lồng vô hạn cấp.
 */

const mongoose = require('mongoose');
const { LOAI_CAU_TRUC } = require('../utils/constants');

const cauTrucSchema = new mongoose.Schema(
  {
    ten: {
      type: String,
      required: [true, 'Tên cấu trúc không được để trống'],
      trim: true,
      maxlength: [300, 'Tên cấu trúc tối đa 300 ký tự'],
    },
    loai: {
      type: String,
      enum: Object.values(LOAI_CAU_TRUC),
      default: LOAI_CAU_TRUC.KHUNG_KIEN_THUC,
    },
    nganHangId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NganHang',
      required: [true, 'Cấu trúc phải thuộc về một ngân hàng'],
    },
    /** null = cấu trúc gốc (root), ObjectId = cấu trúc con */
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CauTruc',
      default: null,
    },
    /** Thứ tự sắp xếp trong cùng cấp */
    thuTu: {
      type: Number,
      default: 0,
    },
    /** Cache số lượng câu hỏi thuộc node này */
    soCauHoi: {
      type: Number,
      default: 0,
    },
    nguoiDungId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NguoiDung',
      required: true,
    },
  },
  {
    timestamps: { createdAt: 'thoiGianTao', updatedAt: 'thoiGianCapNhat' },
  }
);

/** Index cho lọc nhanh theo ngân hàng và cha */
cauTrucSchema.index({ nganHangId: 1, parentId: 1 });

/** Không trùng tên cấu trúc trong cùng ngân hàng, cùng cấp cha */
cauTrucSchema.index({ ten: 1, nganHangId: 1, parentId: 1 }, { unique: true });

const CauTruc = mongoose.model('CauTruc', cauTrucSchema);

module.exports = CauTruc;

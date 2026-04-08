/**
 * @fileoverview Mongoose model cho CauHoi (câu hỏi ngân hàng đề).
 * Hỗ trợ 3 loại: trắc nghiệm 4 lựa chọn, đúng/sai, tự luận.
 */

const mongoose = require('mongoose');
const { LOAI_CAU_HOI, DO_KHO } = require('../utils/constants');

const cauHoiSchema = new mongoose.Schema(
  {
    chuDeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChuDe',
      default: null,
    },
    noiDung: {
      type: String,
      required: [true, 'Nội dung câu hỏi không được để trống'],
      trim: true,
    },
    loaiCauHoi: {
      type: String,
      enum: Object.values(LOAI_CAU_HOI),
      required: true,
      default: LOAI_CAU_HOI.TRAC_NGHIEM,
    },
    doKho: {
      type: String,
      enum: Object.values(DO_KHO),
      required: true,
      default: DO_KHO.TH,
    },
    dapAnDung: {
      type: String,
      trim: true,
    },
    // 4 lựa chọn A-D cho câu trắc nghiệm
    luaChonA: { type: String, trim: true },
    luaChonB: { type: String, trim: true },
    luaChonC: { type: String, trim: true },
    luaChonD: { type: String, trim: true },

    /** Ngân hàng câu hỏi chứa câu hỏi này (optional, song song với chuDeId) */
    nganHangId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NganHang',
      default: null,
    },
    /** Cấu trúc (node trong cây) chứa câu hỏi này (optional) */
    cauTrucId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CauTruc',
      default: null,
    },
    /** Giáo viên tạo câu hỏi */
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

/** Index để lọc nhanh theo chủ đề và độ khó */
cauHoiSchema.index({ chuDeId: 1, doKho: 1 });
cauHoiSchema.index({ nguoiDungId: 1 });
cauHoiSchema.index({ nganHangId: 1, cauTrucId: 1 });

const CauHoi = mongoose.model('CauHoi', cauHoiSchema);

module.exports = CauHoi;

/**
 * @fileoverview Mongoose model cho PhienThi (phiên thi của một người dùng).
 * Nhúng: CauTraLoi, PhienThiViPham, KetQuaThi (thay thế 3 bảng MySQL riêng).
 */

const mongoose = require('mongoose');
const {
  TRANG_THAI_PHIEN_THI,
  TRANG_THAI_TRA_LOI,
  TRANG_THAI_CHAM,
  HANH_VI_VI_PHAM,
} = require('../utils/constants');

/** Sub-document: câu trả lời của sinh viên */
const cauTraLoiSchema = new mongoose.Schema(
  {
    cauHoiId: { type: mongoose.Schema.Types.ObjectId, ref: 'CauHoi', required: true },
    noiDungTraLoi: { type: String, default: null },
    trangThaiTraLoi: {
      type: String,
      enum: Object.values(TRANG_THAI_TRA_LOI),
      default: TRANG_THAI_TRA_LOI.CHUA_TRA_LOI,
    },
    tuDongCham: { type: Boolean, default: true },
    diem: { type: Number, default: 0 },
  },
  { _id: false }
);

/** Sub-document: sự kiện vi phạm trong thi */
const viPhamSchema = new mongoose.Schema(
  {
    soLanViPham: { type: Number, default: 1 },
    hanhVi: {
      type: String,
      enum: Object.values(HANH_VI_VI_PHAM),
      required: true,
    },
    thoiGianViPham: { type: Date, default: Date.now },
  },
  { _id: false }
);

/** Sub-document: kết quả sau khi nộp bài (thay bảng KetQuaThi) */
const ketQuaSchema = new mongoose.Schema(
  {
    tongDiem: { type: Number, default: 0 },
    trangThaiCham: {
      type: String,
      enum: Object.values(TRANG_THAI_CHAM),
      default: TRANG_THAI_CHAM.CHUA_CHAM,
    },
    ghiChu: { type: String, default: '' },
  },
  { _id: false }
);

const phienThiSchema = new mongoose.Schema(
  {
    deThiId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DeThi',
      required: true,
    },
    /** null nếu thi ẩn danh */
    nguoiDungId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NguoiDung',
      default: null,
    },
    /** Tên hiển thị khi thi ẩn danh */
    hoTenAnDanh: { type: String, trim: true, default: null },
    maTruyCapDaDung: { type: String, default: null },

    thoiGianBatDau: { type: Date, default: null },
    thoiGianNop: { type: Date, default: null },

    trangThai: {
      type: String,
      enum: Object.values(TRANG_THAI_PHIEN_THI),
      default: TRANG_THAI_PHIEN_THI.CHUA_VAO_THI,
    },
    /** Câu hỏi đang hiển thị (index, không phải ObjectId) */
    cauHoiHienTai: { type: Number, default: 0 },
    lopHocId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LopHoc',
      default: null,
    },

    cauTraLois: [cauTraLoiSchema],
    viPhams: [viPhamSchema],
    ketQua: { type: ketQuaSchema, default: () => ({}) },
  },
  {
    timestamps: { createdAt: 'thoiGianTao', updatedAt: 'thoiGianCapNhat' },
  }
);

phienThiSchema.index({ deThiId: 1, nguoiDungId: 1 });
phienThiSchema.index({ trangThai: 1, thoiGianBatDau: 1 });

const PhienThi = mongoose.model('PhienThi', phienThiSchema);

module.exports = PhienThi;

/**
 * @fileoverview Mongoose model cho DeThi (đề thi).
 * Nhúng danh sách câu hỏi và danh sách lớp học được xuất bản trực tiếp.
 * Thay thế 3 bảng MySQL: DeThi + DeThiCauHoi + DeThiLopHoc.
 */

const mongoose = require('mongoose');

/** Sub-document: câu hỏi trong đề thi */
const cauHoiTrongDeSchema = new mongoose.Schema(
  {
    cauHoiId: { type: mongoose.Schema.Types.ObjectId, ref: 'CauHoi', required: true },
    /** Số thứ tự hiển thị (0 nếu bật trộn câu) */
    thuTu: { type: Number, default: 0 },
    /** Điểm riêng cho câu hỏi này */
    diem: { type: Number, default: 1 },
  },
  { _id: false }
);

/** Sub-document: lớp học được xuất bản đề */
const lopHocTrongDeSchema = new mongoose.Schema(
  {
    lopHocId: { type: mongoose.Schema.Types.ObjectId, ref: 'LopHoc', required: true },
    thoiGianXuatBan: { type: Date, default: Date.now },
  },
  { _id: false }
);

/** Sub-document: sinh viên cụ thể được xuất bản đề */
const sinhVienTrongDeSchema = new mongoose.Schema(
  {
    sinhVienId: { type: mongoose.Schema.Types.ObjectId, ref: 'NguoiDung', required: true },
    thoiGianXuatBan: { type: Date, default: Date.now },
  },
  { _id: false }
);

const deThiSchema = new mongoose.Schema(
  {
    monHocId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MonHoc',
      required: [true, 'Đề thi phải thuộc một môn học'],
    },
    maDeThi: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    ten: {
      type: String,
      required: [true, 'Tên đề thi không được để trống'],
      trim: true,
      maxlength: [300, 'Tên đề thi tối đa 300 ký tự'],
    },
    moTa: { type: String, trim: true, default: '' },
    thoiGianPhut: {
      type: Number,
      required: [true, 'Thời gian làm bài không được để trống'],
      min: [0, 'Thời gian không được âm'], // 0 = unlimited
    },
    /** Mã truy cập để thi qua link công khai */
    maTruyCap: { type: String, trim: true, default: null },
    duongDanTruyCap: { type: String, trim: true, default: null },

    doiTuongThi: { 
      type: String, 
      enum: ['TAT_CA', 'LOP_HOC', 'HOC_SINH'], 
      default: 'TAT_CA' 
    },
    cheDoXemDiem: { 
      type: String, 
      enum: ['KHONG', 'THI_XONG', 'TAT_CA_XONG'], 
      default: 'THI_XONG' 
    },
    cheDoXemDapAn: { 
      type: String, 
      enum: ['KHONG', 'THI_XONG', 'TAT_CA_XONG', 'DAT_DIEM'], 
      default: 'THI_XONG' 
    },
    diemToiThieuXemDapAn: { 
      type: Number, 
      default: 0 
    },

    thoiGianMo: { type: Date, default: null },
    thoiGianDong: { type: Date, default: null },
    soLanThiToiDa: { type: Number, default: 0 },

    tronCauHoi: { type: Boolean, default: false },
    tronDapAn: { type: Boolean, default: false },
    choPhepXemLai: { type: Boolean, default: true },

    /** Điểm tối đa (null = tự tính theo số câu) */
    thangDiemToiDa: { type: Number, default: null },

    nguoiDungId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NguoiDung',
      required: true,
    },

    cauHois: [cauHoiTrongDeSchema],
    lopHocIds: [lopHocTrongDeSchema],
    sinhVienIds: [sinhVienTrongDeSchema],

    /** Soft delete: null = chưa xóa */
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: 'thoiGianTao', updatedAt: 'thoiGianCapNhat' },
  }
);

/** Index cho query thường gặp */
deThiSchema.index({ nguoiDungId: 1, deletedAt: 1 });
deThiSchema.index({ maTruyCap: 1 });

const DeThi = mongoose.model('DeThi', deThiSchema);

module.exports = DeThi;

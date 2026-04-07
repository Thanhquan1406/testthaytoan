/**
 * @fileoverview Service xem và quản lý kết quả thi (dành cho Giáo viên).
 */

const PhienThi = require('../models/PhienThi');
const DeThi = require('../models/DeThi');
const LopHoc = require('../models/LopHoc');
const { TRANG_THAI_PHIEN_THI } = require('../utils/constants');

/**
 * Lấy kết quả thi theo đề thi và lớp (Giáo viên xem)
 * @param {string} giaoVienId
 * @param {object} query - { deThiId, lopHocId }
 * @returns {Promise<object[]>}
 */
const layKetQuaTheoDeVaLop = async (giaoVienId, { deThiId, lopHocId }) => {
  if (!deThiId) throw Object.assign(new Error('Cần cung cấp deThiId'), { statusCode: 400 });

  // Xác nhận giáo viên sở hữu đề này
  const deThi = await DeThi.findOne({ _id: deThiId, nguoiDungId: giaoVienId });
  if (!deThi) throw Object.assign(new Error('Không tìm thấy đề thi'), { statusCode: 404 });

  const filter = {
    deThiId,
    trangThai: TRANG_THAI_PHIEN_THI.DA_NOP_BAI,
  };
  if (lopHocId) filter.lopHocId = lopHocId;

  return PhienThi.find(filter)
    .populate('nguoiDungId', 'maNguoiDung ho ten email')
    .populate('lopHocId', 'ten')
    .select('nguoiDungId lopHocId hoTenAnDanh maTruyCapDaDung ketQua thoiGianBatDau thoiGianNop')
    .sort({ 'ketQua.tongDiem': -1 })
    .lean();
};

/**
 * Giáo viên cập nhật ghi chú cho kết quả
 * @param {string} phienThiId
 * @param {string} giaoVienId
 * @param {string} ghiChu
 * @returns {Promise<object>}
 */
const capNhatGhiChu = async (phienThiId, giaoVienId, ghiChu) => {
  // Kiểm tra phiên thi thuộc đề của giáo viên
  const phienThi = await PhienThi.findById(phienThiId).populate('deThiId', 'nguoiDungId');
  if (!phienThi) throw Object.assign(new Error('Không tìm thấy phiên thi'), { statusCode: 404 });

  if (phienThi.deThiId.nguoiDungId.toString() !== giaoVienId) {
    throw Object.assign(new Error('Không có quyền'), { statusCode: 403 });
  }

  phienThi.ketQua.ghiChu = ghiChu;
  await phienThi.save();
  return phienThi.ketQua;
};

/**
 * Giáo viên chỉnh điểm thủ công (cho tự luận)
 * @param {string} phienThiId
 * @param {string} giaoVienId
 * @param {number} tongDiem
 * @returns {Promise<object>}
 */
const capNhatDiem = async (phienThiId, giaoVienId, tongDiem) => {
  const phienThi = await PhienThi.findById(phienThiId).populate('deThiId', 'nguoiDungId');
  if (!phienThi) throw Object.assign(new Error('Không tìm thấy phiên thi'), { statusCode: 404 });

  if (phienThi.deThiId.nguoiDungId.toString() !== giaoVienId) {
    throw Object.assign(new Error('Không có quyền'), { statusCode: 403 });
  }

  phienThi.ketQua.tongDiem = tongDiem;
  phienThi.ketQua.trangThaiCham = 'DA_CHAM';
  await phienThi.save();
  return phienThi.ketQua;
};

/**
 * Giáo viên xem chi tiết bài làm của sinh viên
 * @param {string} phienThiId
 * @param {string} giaoVienId
 * @returns {Promise<object>}
 */
const xemChiTietBaiLam = async (phienThiId, giaoVienId) => {
  const phienThi = await PhienThi.findById(phienThiId)
    .populate({
      path: 'deThiId',
      match: { nguoiDungId: giaoVienId },
      populate: {
        path: 'cauHois.cauHoiId',
        select: 'noiDung dapAnDung luaChonA luaChonB luaChonC luaChonD loaiCauHoi',
      },
    })
    .populate('nguoiDungId', 'maNguoiDung ho ten')
    .lean();

  if (!phienThi || !phienThi.deThiId) {
    throw Object.assign(new Error('Không tìm thấy hoặc không có quyền xem'), { statusCode: 404 });
  }

  return phienThi;
};

/**
 * Lấy danh sách đề thi của giáo viên (cho dropdown filter kết quả)
 * @param {string} giaoVienId
 * @returns {Promise<object[]>}
 */
const layDanhSachDeThi = async (giaoVienId) => {
  return DeThi.find({ nguoiDungId: giaoVienId, deletedAt: null })
    .select('maDeThi ten monHocId')
    .populate('monHocId', 'ten')
    .lean();
};

/**
 * Lấy danh sách lớp học của giáo viên (cho dropdown filter)
 * @param {string} giaoVienId
 * @returns {Promise<object[]>}
 */
const layDanhSachLop = async (giaoVienId) => {
  return LopHoc.find({ giaoVienId }).select('ten').lean();
};

module.exports = {
  layKetQuaTheoDeVaLop,
  capNhatGhiChu,
  capNhatDiem,
  xemChiTietBaiLam,
  layDanhSachDeThi,
  layDanhSachLop,
};

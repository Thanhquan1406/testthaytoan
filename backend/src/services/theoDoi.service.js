/**
 * @fileoverview Service theo dõi thi real-time (Giáo viên giám sát).
 * MVP: trả dữ liệu snapshot tĩnh. Phase 2 sẽ tích hợp Socket.io.
 */

const PhienThi = require('../models/PhienThi');
const DeThi = require('../models/DeThi');
const { TRANG_THAI_PHIEN_THI } = require('../utils/constants');

/**
 * Lấy danh sách sinh viên đang thi / đã nộp / chưa vào theo đề
 * @param {string} giaoVienId
 * @param {string} deThiId
 * @param {object} query - { trangThai, keyword }
 * @returns {Promise<object[]>}
 */
const layDanhSachTheoDoi = async (giaoVienId, deThiId, query) => {
  // Kiểm tra quyền sở hữu đề
  const deThi = await DeThi.findOne({ _id: deThiId, nguoiDungId: giaoVienId, deletedAt: null });
  if (!deThi) throw Object.assign(new Error('Không tìm thấy đề thi'), { statusCode: 404 });

  const filter = { deThiId };
  if (query.trangThai && Object.values(TRANG_THAI_PHIEN_THI).includes(query.trangThai)) {
    filter.trangThai = query.trangThai;
  }

  const phienThis = await PhienThi.find(filter)
    .populate('nguoiDungId', 'maNguoiDung ho ten email')
    .populate('lopHocId', 'ten')
    .select('nguoiDungId hoTenAnDanh trangThai thoiGianBatDau thoiGianNop viPhams ketQua lopHocId cauTraLois')
    .sort({ thoiGianBatDau: -1 })
    .lean();

  const normalized = phienThis.map(({ cauTraLois, viPhams, ...rest }) => ({
    ...rest,
    soViPham: viPhams?.length || 0,
    viPhamGanNhat: viPhams?.at(-1) || null,
    soCauDaTraLoi: cauTraLois?.filter((c) => c.noiDungTraLoi).length || 0,
    tongSoCau: cauTraLois?.length || 0,
  }));

  // Tìm kiếm theo tên
  if (query.keyword) {
    const kw = query.keyword.toLowerCase();
    return normalized.filter((p) => {
      const ten = p.nguoiDungId
        ? `${p.nguoiDungId.ho} ${p.nguoiDungId.ten}`.toLowerCase()
        : (p.hoTenAnDanh || '').toLowerCase();
      return ten.includes(kw);
    });
  }

  return normalized;
};

/**
 * Lấy danh sách đề thi của giáo viên (cho dropdown filter)
 * @param {string} giaoVienId
 * @returns {Promise<object[]>}
 */
const layDanhSachDeThi = async (giaoVienId) => {
  return DeThi.find({ nguoiDungId: giaoVienId, deletedAt: null })
    .select('ten maDeThi')
    .sort({ thoiGianTao: -1 })
    .lean();
};

module.exports = { layDanhSachTheoDoi, layDanhSachDeThi };

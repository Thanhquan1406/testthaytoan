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

const _ensureTeacherOwnsExam = async (giaoVienId, deThiId) => {
  if (!deThiId) throw Object.assign(new Error('Cần cung cấp deThiId'), { statusCode: 400 });
  const deThi = await DeThi.findOne({ _id: deThiId, nguoiDungId: giaoVienId })
    .populate('cauHois.cauHoiId', 'noiDung loaiCauHoi')
    .lean();
  if (!deThi) throw Object.assign(new Error('Không tìm thấy đề thi'), { statusCode: 404 });
  return deThi;
};

const _buildFilter = ({ deThiId, lopHocId }) => {
  const filter = {
    deThiId,
    trangThai: TRANG_THAI_PHIEN_THI.DA_NOP_BAI,
  };
  if (lopHocId) filter.lopHocId = lopHocId;
  return filter;
};

const _fetchSubmittedSessions = async ({ deThiId, lopHocId }) => {
  return PhienThi.find(_buildFilter({ deThiId, lopHocId }))
    .populate('lopHocId', 'ten')
    .select('lopHocId ketQua cauTraLois')
    .lean();
};

const _toDifficulty = (tiLeDung) => {
  if (tiLeDung >= 0.8) return 'DE';
  if (tiLeDung >= 0.5) return 'TRUNG_BINH';
  return 'KHO';
};

const getHistogram = async (giaoVienId, { deThiId, lopHocId, binSize }) => {
  await _ensureTeacherOwnsExam(giaoVienId, deThiId);
  const sessions = await _fetchSubmittedSessions({ deThiId, lopHocId });

  const size = Number(binSize) > 0 ? Number(binSize) : 1;
  const maxScore = 10;
  const bins = [];
  for (let start = 0; start < maxScore; start += size) {
    const end = Math.min(start + size, maxScore);
    bins.push({
      label: `${start.toFixed(1)}-${end.toFixed(1)}`,
      min: start,
      max: end,
      count: 0,
    });
  }

  sessions.forEach((s) => {
    const score = Number(s?.ketQua?.tongDiem);
    if (!Number.isFinite(score)) return;
    const safeScore = Math.max(0, Math.min(maxScore, score));
    let idx = Math.floor(safeScore / size);
    if (idx >= bins.length) idx = bins.length - 1;
    bins[idx].count += 1;
  });

  return { total: sessions.length, binSize: size, bins };
};

const getQuestionDifficulty = async (giaoVienId, { deThiId, lopHocId }) => {
  const deThi = await _ensureTeacherOwnsExam(giaoVienId, deThiId);
  const sessions = await _fetchSubmittedSessions({ deThiId, lopHocId });

  const questionMap = {};
  deThi.cauHois.forEach((c, idx) => {
    const id = c.cauHoiId?._id?.toString();
    if (!id) return;
    questionMap[id] = {
      cauHoiId: id,
      thuTu: idx + 1,
      noiDung: c.cauHoiId.noiDung || '',
      loaiCauHoi: c.cauHoiId.loaiCauHoi || null,
      soDung: 0,
      tongBaiLam: 0,
      tiLeDung: 0,
      mucDo: 'TRUNG_BINH',
    };
  });

  sessions.forEach((s) => {
    (s.cauTraLois || []).forEach((tl) => {
      const qid = tl.cauHoiId?.toString();
      if (!qid || !questionMap[qid]) return;
      questionMap[qid].tongBaiLam += 1;
      if (tl.trangThaiTraLoi === 'DUNG') questionMap[qid].soDung += 1;
    });
  });

  const data = Object.values(questionMap).map((q) => {
    const tiLeDung = q.tongBaiLam > 0 ? q.soDung / q.tongBaiLam : 0;
    return {
      ...q,
      tiLeDung: Number((tiLeDung * 100).toFixed(2)),
      mucDo: _toDifficulty(tiLeDung),
    };
  });

  return { totalQuestions: data.length, totalSubmissions: sessions.length, data };
};

const getClassComparison = async (giaoVienId, { deThiId }) => {
  await _ensureTeacherOwnsExam(giaoVienId, deThiId);
  const sessions = await _fetchSubmittedSessions({ deThiId, lopHocId: '' });
  const map = {};

  sessions.forEach((s) => {
    const key = s.lopHocId?._id?.toString() || 'AN_DANH';
    if (!map[key]) {
      map[key] = {
        lopHocId: key === 'AN_DANH' ? null : key,
        tenLop: s.lopHocId?.ten || 'Ẩn danh / Không lớp',
        scores: [],
      };
    }
    const score = Number(s?.ketQua?.tongDiem);
    if (Number.isFinite(score)) map[key].scores.push(score);
  });

  const data = Object.values(map).map((item) => {
    const scores = item.scores;
    const count = scores.length;
    const avg = count ? scores.reduce((a, b) => a + b, 0) / count : 0;
    const max = count ? Math.max(...scores) : 0;
    const min = count ? Math.min(...scores) : 0;
    const passCount = scores.filter((s) => s >= 5).length;
    return {
      lopHocId: item.lopHocId,
      tenLop: item.tenLop,
      count,
      avg: Number(avg.toFixed(2)),
      max: Number(max.toFixed(2)),
      min: Number(min.toFixed(2)),
      passRate: count ? Number(((passCount / count) * 100).toFixed(2)) : 0,
    };
  });

  return {
    totalClasses: data.length,
    totalSubmissions: sessions.length,
    data: data.sort((a, b) => b.avg - a.avg),
  };
};

module.exports = {
  layKetQuaTheoDeVaLop,
  capNhatGhiChu,
  capNhatDiem,
  xemChiTietBaiLam,
  layDanhSachDeThi,
  layDanhSachLop,
  getHistogram,
  getQuestionDifficulty,
  getClassComparison,
};

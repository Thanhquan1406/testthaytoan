/**
 * @fileoverview Service xử lý logic cốt lõi của phiên thi.
 * Bao gồm: bắt đầu thi, lấy nội dung, lưu đáp án, nộp bài, vi phạm.
 * Dùng chung cho thi có tài khoản và thi ẩn danh qua link.
 */

const DeThi = require('../models/DeThi');
const PhienThi = require('../models/PhienThi');
const { taoTokenThiAnDanh } = require('./jwt.service');
const {
  TRANG_THAI_PHIEN_THI,
  TRANG_THAI_TRA_LOI,
  TRANG_THAI_DE_THI,
  LOAI_CAU_HOI,
} = require('../utils/constants');

// ─── BẮT ĐẦU THI ─────────────────────────────────────────────────────────────

/**
 * Sinh viên bắt đầu thi từ phòng thi lớp học
 * @param {string} sinhVienId
 * @param {string} deThiId
 * @param {string} lopHocId
 * @returns {Promise<{phienThiId: string}>}
 */
const batDauThiQuaLop = async (sinhVienId, deThiId, lopHocId) => {
  const deThi = await _layDeThiHopLe(deThiId);

  // Kiểm tra đề có xuất bản cho lớp này không
  const duocXuatBan = deThi.lopHocIds.some((l) => l.lopHocId.toString() === lopHocId);
  if (!duocXuatBan) {
    throw Object.assign(new Error('Đề thi chưa được xuất bản cho lớp học này'), { statusCode: 403 });
  }

  await _kiemTraGioiHanLuotThi(sinhVienId, deThi);

  const phienThi = await _taoPhienThi({ deThiId, nguoiDungId: sinhVienId, lopHocId, deThi });
  return { phienThiId: phienThi._id };
};

/**
 * Bắt đầu thi ẩn danh qua link công khai
 * @param {string} maTruyCap - Mã truy cập từ URL
 * @param {string} hoTenAnDanh - Tên người thi nhập vào
 * @returns {Promise<{phienThiId: string, token: string}>} Token riêng cho phiên ẩn danh
 */
const batDauThiAnDanh = async (maTruyCap, hoTenAnDanh) => {
  const deThi = await DeThi.findOne({
    maTruyCap,
    trangThai: TRANG_THAI_DE_THI.CONG_KHAI,
    deletedAt: null,
  });

  if (!deThi) throw Object.assign(new Error('Link thi không hợp lệ hoặc đã bị hủy'), { statusCode: 404 });

  await _kiemTraThoiGianMoDong(deThi);

  const phienThi = await _taoPhienThi({
    deThiId: deThi._id,
    nguoiDungId: null,
    hoTenAnDanh: hoTenAnDanh || 'Ẩn danh',
    maTruyCapDaDung: maTruyCap,
    deThi,
  });

  // Tạo token JWT riêng cho phiên ẩn danh
  const token = taoTokenThiAnDanh({ phienThiId: phienThi._id, hoTenAnDanh });
  return { phienThiId: phienThi._id, token };
};

// ─── NỘI DUNG & LƯU ĐÁP ÁN ─────────────────────────────────────────────────

/**
 * Lấy nội dung bài thi (danh sách câu hỏi, không có đáp án đúng)
 * @param {string} phienThiId
 * @param {string} nguoiDungId - null nếu thi ẩn danh
 * @returns {Promise<object>} Phiên thi kèm câu hỏi (đã che đáp án)
 */
const layNoiDungBaiThi = async (phienThiId, nguoiDungId) => {
  const phienThi = await _timPhienThiVaKiemTraQuyen(phienThiId, nguoiDungId);

  const deThi = await DeThi.findById(phienThi.deThiId)
    .populate({
      path: 'cauHois.cauHoiId',
      select: '-dapAnDung', // Ẩn đáp án khi đang thi
    })
    .lean();

  // Trộn câu hỏi nếu đề có cài đặt trộn
  let cauHois = deThi.cauHois.map((c) => c.cauHoiId).filter(Boolean);
  if (deThi.tronCauHoi) cauHois = _tronMang(cauHois);

  // Trộn lựa chọn nếu đề có cài đặt trộn đáp án
  if (deThi.tronDapAn) {
    cauHois = cauHois.map((cau) => {
      if (cau.loaiCauHoi === LOAI_CAU_HOI.TRAC_NGHIEM) {
        return _tronLuaChon(cau);
      }
      return cau;
    });
  }

  return {
    phienThiId: phienThi._id,
    trangThai: phienThi.trangThai,
    thoiGianBatDau: phienThi.thoiGianBatDau,
    thoiGianPhut: deThi.thoiGianPhut,
    tenDeThi: deThi.ten,
    cauHois,
    cauTraLois: phienThi.cauTraLois,
    cauHoiHienTai: phienThi.cauHoiHienTai,
  };
};

/**
 * Lưu câu trả lời (tự động khi sinh viên chọn)
 * @param {string} phienThiId
 * @param {string} nguoiDungId
 * @param {string} cauHoiId
 * @param {string} noiDungTraLoi - Đáp án sinh viên chọn
 * @returns {Promise<void>}
 */
const luuTraLoi = async (phienThiId, nguoiDungId, cauHoiId, noiDungTraLoi) => {
  const phienThi = await _timPhienThiVaKiemTraQuyen(phienThiId, nguoiDungId);

  if (phienThi.trangThai === TRANG_THAI_PHIEN_THI.DA_NOP_BAI) {
    throw Object.assign(new Error('Bài thi đã được nộp'), { statusCode: 400 });
  }

  // Cập nhật hoặc thêm câu trả lời
  const index = phienThi.cauTraLois.findIndex((c) => c.cauHoiId.toString() === cauHoiId);
  if (index >= 0) {
    phienThi.cauTraLois[index].noiDungTraLoi = noiDungTraLoi;
  } else {
    phienThi.cauTraLois.push({ cauHoiId, noiDungTraLoi });
  }

  phienThi.trangThai = TRANG_THAI_PHIEN_THI.DANG_THI;
  await phienThi.save();
};

// ─── NỘP BÀI & CHẤM ĐIỂM ─────────────────────────────────────────────────────

/**
 * Nộp bài thi và chấm điểm tự động
 * @param {string} phienThiId
 * @param {string} nguoiDungId
 * @returns {Promise<object>} Kết quả thi
 */
const nopBai = async (phienThiId, nguoiDungId) => {
  const phienThi = await _timPhienThiVaKiemTraQuyen(phienThiId, nguoiDungId);

  if (phienThi.trangThai === TRANG_THAI_PHIEN_THI.DA_NOP_BAI) {
    throw Object.assign(new Error('Bài thi đã được nộp trước đó'), { statusCode: 400 });
  }

  const deThi = await DeThi.findById(phienThi.deThiId)
    .populate('cauHois.cauHoiId', 'dapAnDung loaiCauHoi')
    .lean();

  // Chấm điểm tự động cho trắc nghiệm và đúng/sai
  const { tongDiem, cauTraLoisDaXuLy } = _chamDiem(phienThi.cauTraLois, deThi.cauHois, deThi.thangDiemToiDa);

  phienThi.cauTraLois = cauTraLoisDaXuLy;
  phienThi.trangThai = TRANG_THAI_PHIEN_THI.DA_NOP_BAI;
  phienThi.thoiGianNop = new Date();
  phienThi.ketQua = { tongDiem, trangThaiCham: 'DA_CHAM', ghiChu: '' };
  await phienThi.save();

  return {
    tongDiem,
    soCauDung: cauTraLoisDaXuLy.filter((c) => c.trangThaiTraLoi === TRANG_THAI_TRA_LOI.DUNG).length,
    tongSoCau: deThi.cauHois.length,
    thoiGianNop: phienThi.thoiGianNop,
  };
};

// ─── VI PHẠM ─────────────────────────────────────────────────────────────────

/**
 * Ghi nhận sự kiện vi phạm của sinh viên
 * @param {string} phienThiId
 * @param {string} nguoiDungId
 * @param {string} hanhVi - Loại vi phạm (HANH_VI_VI_PHAM enum)
 * @returns {Promise<number>} Tổng số lần vi phạm
 */
const xuLyViPham = async (phienThiId, nguoiDungId, hanhVi) => {
  const phienThi = await _timPhienThiVaKiemTraQuyen(phienThiId, nguoiDungId);

  if (phienThi.trangThai === TRANG_THAI_PHIEN_THI.DA_NOP_BAI) return 0;

  phienThi.viPhams.push({ hanhVi, soLanViPham: 1, thoiGianViPham: new Date() });
  await phienThi.save();

  return phienThi.viPhams.length;
};

// ─── KẾT QUẢ & LỊCH SỬ ─────────────────────────────────────────────────────

/**
 * Lấy kết quả bài thi sau khi nộp
 * @param {string} phienThiId
 * @param {string} nguoiDungId
 * @returns {Promise<object>}
 */
const layKetQua = async (phienThiId, nguoiDungId) => {
  const phienThi = await PhienThi.findById(phienThiId)
    .populate({ path: 'deThiId', select: 'ten choPhepXemLai thoiGianPhut' })
    .lean();

  if (!phienThi) throw Object.assign(new Error('Không tìm thấy phiên thi'), { statusCode: 404 });

  const isOwner = nguoiDungId
    ? phienThi.nguoiDungId?.toString() === nguoiDungId
    : true;

  if (!isOwner) throw Object.assign(new Error('Không có quyền xem kết quả này'), { statusCode: 403 });

  return {
    ...phienThi.ketQua,
    thoiGianBatDau: phienThi.thoiGianBatDau,
    thoiGianNop: phienThi.thoiGianNop,
    deThi: phienThi.deThiId,
    soViPham: phienThi.viPhams.length,
  };
};

/**
 * Lấy lịch sử thi của sinh viên
 * @param {string} sinhVienId
 * @param {object} query - Phân trang
 * @returns {Promise<{data: object[], meta: object}>}
 */
const layLichSuThi = async (sinhVienId, query) => {
  const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');
  const { page, limit, skip } = getPaginationParams(query);

  const filter = {
    nguoiDungId: sinhVienId,
    trangThai: TRANG_THAI_PHIEN_THI.DA_NOP_BAI,
  };

  const [data, total] = await Promise.all([
    PhienThi.find(filter)
      .populate('deThiId', 'ten thoiGianPhut')
      .select('ketQua thoiGianBatDau thoiGianNop deThiId')
      .skip(skip)
      .limit(limit)
      .sort({ thoiGianNop: -1 })
      .lean(),
    PhienThi.countDocuments(filter),
  ]);

  return { data, meta: buildPaginationMeta({ page, limit, total }) };
};

/**
 * Lấy chi tiết lịch sử bài thi (nếu đề cho phép xem lại)
 * @param {string} phienThiId
 * @param {string} nguoiDungId
 * @returns {Promise<object>}
 */
const layChiTietLichSu = async (phienThiId, nguoiDungId) => {
  const phienThi = await PhienThi.findOne({
    _id: phienThiId,
    nguoiDungId,
    trangThai: TRANG_THAI_PHIEN_THI.DA_NOP_BAI,
  })
    .populate({
      path: 'deThiId',
      select: 'ten choPhepXemLai',
      populate: { path: 'cauHois.cauHoiId', select: 'noiDung dapAnDung luaChonA luaChonB luaChonC luaChonD loaiCauHoi' },
    })
    .lean();

  if (!phienThi) throw Object.assign(new Error('Không tìm thấy lịch sử thi'), { statusCode: 404 });

  if (!phienThi.deThiId.choPhepXemLai) {
    throw Object.assign(new Error('Đề thi không cho phép xem lại bài'), { statusCode: 403 });
  }

  return phienThi;
};

// ─── HELPERS (PRIVATE) ────────────────────────────────────────────────────────

/**
 * Tìm đề thi và kiểm tra tính hợp lệ cơ bản
 */
const _layDeThiHopLe = async (deThiId) => {
  const deThi = await DeThi.findOne({ _id: deThiId, deletedAt: null });
  if (!deThi) throw Object.assign(new Error('Đề thi không tồn tại'), { statusCode: 404 });
  await _kiemTraThoiGianMoDong(deThi);
  return deThi;
};

/** Kiểm tra thời gian mở/đóng đề */
const _kiemTraThoiGianMoDong = async (deThi) => {
  const now = new Date();
  if (deThi.thoiGianMo && now < deThi.thoiGianMo) {
    throw Object.assign(new Error('Đề thi chưa đến giờ mở'), { statusCode: 400 });
  }
  if (deThi.thoiGianDong && now > deThi.thoiGianDong) {
    throw Object.assign(new Error('Đề thi đã hết hạn'), { statusCode: 400 });
  }
};

/** Kiểm tra giới hạn lượt thi */
const _kiemTraGioiHanLuotThi = async (sinhVienId, deThi) => {
  if (!deThi.soLanThiToiDa || deThi.soLanThiToiDa === 0) return;

  const soLanDaThi = await PhienThi.countDocuments({
    deThiId: deThi._id,
    nguoiDungId: sinhVienId,
    trangThai: TRANG_THAI_PHIEN_THI.DA_NOP_BAI,
  });

  if (soLanDaThi >= deThi.soLanThiToiDa) {
    throw Object.assign(new Error(`Bạn đã thi đủ ${deThi.soLanThiToiDa} lần, không thể thi thêm`), { statusCode: 400 });
  }

  // Kiểm tra có đang thi dở không
  const dangThi = await PhienThi.findOne({
    deThiId: deThi._id,
    nguoiDungId: sinhVienId,
    trangThai: TRANG_THAI_PHIEN_THI.DANG_THI,
  });
  if (dangThi) {
    throw Object.assign(
      new Error('Bạn đang có phiên thi chưa hoàn thành'),
      { statusCode: 400, phienThiId: dangThi._id }
    );
  }
};

/** Tạo phiên thi mới */
const _taoPhienThi = async ({ deThiId, nguoiDungId, lopHocId, hoTenAnDanh, maTruyCapDaDung, deThi }) => {
  return PhienThi.create({
    deThiId,
    nguoiDungId: nguoiDungId || null,
    lopHocId: lopHocId || null,
    hoTenAnDanh: hoTenAnDanh || null,
    maTruyCapDaDung: maTruyCapDaDung || null,
    thoiGianBatDau: new Date(),
    trangThai: TRANG_THAI_PHIEN_THI.DANG_THI,
    // Khởi tạo câu trả lời rỗng cho tất cả câu hỏi
    cauTraLois: deThi.cauHois.map((c) => ({
      cauHoiId: c.cauHoiId,
      noiDungTraLoi: null,
      trangThaiTraLoi: TRANG_THAI_TRA_LOI.CHUA_TRA_LOI,
      tuDongCham: true,
      diem: 0,
    })),
  });
};

/** Tìm phiên thi và kiểm tra quyền truy cập */
const _timPhienThiVaKiemTraQuyen = async (phienThiId, nguoiDungId) => {
  const phienThi = await PhienThi.findById(phienThiId);
  if (!phienThi) throw Object.assign(new Error('Không tìm thấy phiên thi'), { statusCode: 404 });

  // Thi ẩn danh: không kiểm tra owner
  if (!nguoiDungId) return phienThi;

  if (phienThi.nguoiDungId?.toString() !== nguoiDungId) {
    throw Object.assign(new Error('Không có quyền truy cập phiên thi này'), { statusCode: 403 });
  }

  return phienThi;
};

/**
 * Chấm điểm tự động cho trắc nghiệm và đúng/sai
 * @param {object[]} cauTraLois - Danh sách câu trả lời trong phiên thi
 * @param {object[]} cauHoiTrongDe - Danh sách câu hỏi trong đề (đã populate dapAnDung)
 * @param {number|null} thangDiem - Tổng điểm tối đa (null = chia đều theo số câu)
 * @returns {{ tongDiem: number, cauTraLoisDaXuLy: object[] }}
 */
const _chamDiem = (cauTraLois, cauHoiTrongDe, thangDiem) => {
  const tongCau = cauHoiTrongDe.length;
  const diemMoiCau = thangDiem ? thangDiem / tongCau : 10 / tongCau;

  let soCauDung = 0;

  const cauTraLoisDaXuLy = cauTraLois.map((traLoi) => {
    const cauHoiInfo = cauHoiTrongDe.find(
      (c) => c.cauHoiId?._id?.toString() === traLoi.cauHoiId?.toString()
    );

    if (!cauHoiInfo?.cauHoiId) return traLoi;

    const { dapAnDung, loaiCauHoi } = cauHoiInfo.cauHoiId;

    // Chỉ tự động chấm trắc nghiệm và đúng/sai
    if (loaiCauHoi === LOAI_CAU_HOI.TU_LUAN) {
      return { ...traLoi, tuDongCham: false, trangThaiTraLoi: TRANG_THAI_TRA_LOI.CHUA_TRA_LOI };
    }

    if (!traLoi.noiDungTraLoi) {
      return { ...traLoi, trangThaiTraLoi: TRANG_THAI_TRA_LOI.CHUA_TRA_LOI, diem: 0 };
    }

    const dungDapAn =
      traLoi.noiDungTraLoi.trim().toUpperCase() === dapAnDung?.trim().toUpperCase();

    if (dungDapAn) soCauDung++;

    return {
      ...traLoi,
      trangThaiTraLoi: dungDapAn ? TRANG_THAI_TRA_LOI.DUNG : TRANG_THAI_TRA_LOI.SAI,
      diem: dungDapAn ? diemMoiCau : 0,
    };
  });

  const tongDiem = parseFloat((soCauDung * diemMoiCau).toFixed(2));

  return { tongDiem, cauTraLoisDaXuLy };
};

/** Trộn mảng (Fisher-Yates) */
const _tronMang = (arr) => {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/** Trộn thứ tự A/B/C/D cho câu trắc nghiệm (không làm mất đáp án đúng) */
const _tronLuaChon = (cauHoi) => {
  const luaChons = [
    { key: 'A', value: cauHoi.luaChonA },
    { key: 'B', value: cauHoi.luaChonB },
    { key: 'C', value: cauHoi.luaChonC },
    { key: 'D', value: cauHoi.luaChonD },
  ].filter((l) => l.value);

  const shuffled = _tronMang(luaChons);
  return {
    ...cauHoi,
    luaChonA: shuffled[0]?.value,
    luaChonB: shuffled[1]?.value,
    luaChonC: shuffled[2]?.value,
    luaChonD: shuffled[3]?.value,
  };
};

module.exports = {
  batDauThiQuaLop,
  batDauThiAnDanh,
  layNoiDungBaiThi,
  luuTraLoi,
  nopBai,
  xuLyViPham,
  layKetQua,
  layLichSuThi,
  layChiTietLichSu,
};

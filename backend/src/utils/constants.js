/**
 * @fileoverview Các hằng số và enum dùng chung toàn hệ thống.
 * Thay thế cho các giá trị String rải rác trong Spring Boot cũ.
 */

/**
 * Vai trò người dùng trong hệ thống
 * @enum {string}
 */
const VAI_TRO = Object.freeze({
  ADMIN: 'ADMIN',
  GIAO_VIEN: 'GIAO_VIEN',
  SINH_VIEN: 'SINH_VIEN',
  THI_AN_DANH: 'THI_AN_DANH',
});


/**
 * Trạng thái phiên thi
 * @enum {string}
 */
const TRANG_THAI_PHIEN_THI = Object.freeze({
  CHUA_VAO_THI: 'CHUA_VAO_THI',
  DA_VAO_CHUA_NOP: 'DA_VAO_CHUA_NOP',
  DANG_THI: 'DANG_THI',
  DA_NOP_BAI: 'DA_NOP_BAI',
});

/**
 * Trạng thái câu trả lời
 * @enum {string}
 */
const TRANG_THAI_TRA_LOI = Object.freeze({
  CHUA_TRA_LOI: 'CHUA_TRA_LOI',
  DUNG: 'DUNG',
  SAI: 'SAI',
});

/**
 * Trạng thái chấm bài
 * @enum {string}
 */
const TRANG_THAI_CHAM = Object.freeze({
  CHUA_CHAM: 'CHUA_CHAM',
  DA_CHAM: 'DA_CHAM',
});

/**
 * Loại câu hỏi
 * @enum {string}
 */
const LOAI_CAU_HOI = Object.freeze({
  TRAC_NGHIEM: 'TRAC_NGHIEM',
  DUNG_SAI: 'DUNG_SAI',
  TU_LUAN: 'TU_LUAN',
});

/**
 * Độ khó câu hỏi
 * @enum {string}
 */
const DO_KHO = Object.freeze({
  NB: 'NB',
  TH: 'TH',
  VH: 'VH',
});

/**
 * Loại cấu trúc cây trong ngân hàng câu hỏi
 * @enum {string}
 */
const LOAI_CAU_TRUC = Object.freeze({
  KHUNG_KIEN_THUC: 'KHUNG_KIEN_THUC',
  DON_VI_KIEN_THUC: 'DON_VI_KIEN_THUC',
});

/**
 * Kết quả kiểm tra lượt thi
 * @enum {string}
 */
const KET_QUA_LUOT_THI = Object.freeze({
  ALLOWED: 'ALLOWED',
  IN_PROGRESS: 'IN_PROGRESS',
  LIMIT_REACHED: 'LIMIT_REACHED',
  NOT_FOUND: 'NOT_FOUND',
  ERROR: 'ERROR',
});

/**
 * Các hành vi vi phạm trong thi
 * @enum {string}
 */
const HANH_VI_VI_PHAM = Object.freeze({
  CHUYEN_TAB: 'CHUYEN_TAB',
  THOAT_TOAN_MAN_HINH: 'THOAT_TOAN_MAN_HINH',
  COPY_PASTE: 'COPY_PASTE',
  RIGHT_CLICK: 'RIGHT_CLICK',
});

module.exports = {
  VAI_TRO,
  TRANG_THAI_PHIEN_THI,
  TRANG_THAI_TRA_LOI,
  TRANG_THAI_CHAM,
  LOAI_CAU_HOI,
  DO_KHO,
  LOAI_CAU_TRUC,
  KET_QUA_LUOT_THI,
  HANH_VI_VI_PHAM,
};

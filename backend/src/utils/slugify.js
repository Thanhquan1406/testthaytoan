/**
 * @fileoverview Tiện ích tạo slug và mã truy cập ngẫu nhiên.
 */

/**
 * Tạo slug từ chuỗi tiếng Việt (loại bỏ dấu, chuyển thành lowercase-kebab)
 * @param {string} str - Chuỗi cần chuyển đổi
 * @returns {string}
 */
const toSlug = (str) => {
  if (!str) return '';

  const map = {
    à: 'a', á: 'a', ả: 'a', ã: 'a', ạ: 'a',
    ă: 'a', ắ: 'a', ặ: 'a', ằ: 'a', ẳ: 'a', ẵ: 'a',
    â: 'a', ấ: 'a', ậ: 'a', ầ: 'a', ẩ: 'a', ẫ: 'a',
    è: 'e', é: 'e', ẻ: 'e', ẽ: 'e', ẹ: 'e',
    ê: 'e', ế: 'e', ệ: 'e', ề: 'e', ể: 'e', ễ: 'e',
    ì: 'i', í: 'i', ỉ: 'i', ĩ: 'i', ị: 'i',
    ò: 'o', ó: 'o', ỏ: 'o', õ: 'o', ọ: 'o',
    ô: 'o', ố: 'o', ộ: 'o', ồ: 'o', ổ: 'o', ỗ: 'o',
    ơ: 'o', ớ: 'o', ợ: 'o', ờ: 'o', ở: 'o', ỡ: 'o',
    ù: 'u', ú: 'u', ủ: 'u', ũ: 'u', ụ: 'u',
    ư: 'u', ứ: 'u', ự: 'u', ừ: 'u', ử: 'u', ữ: 'u',
    ỳ: 'y', ý: 'y', ỷ: 'y', ỹ: 'y', ỵ: 'y',
    đ: 'd',
  };

  return str
    .toLowerCase()
    .replace(/[àáảãạăắặằẳẵâấậầẩẫèéẻẽẹêếệềểễìíỉĩịòóỏõọôốộồổỗơớợờởỡùúủũụưứựừửữỳýỷỹỵđ]/g, (c) => map[c] || c)
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

/**
 * Tạo mã truy cập ngẫu nhiên (chữ hoa + số)
 * @param {number} [length=8] - Độ dài mã
 * @returns {string}
 */
const generateAccessCode = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Tạo mã sinh viên dạng SVxxxxxxxx
 * @returns {string}
 */
const generateMaSinhVien = () => {
  const num = Math.floor(10000000 + Math.random() * 90000000);
  return `SV${num}`;
};

module.exports = { toSlug, generateAccessCode, generateMaSinhVien };

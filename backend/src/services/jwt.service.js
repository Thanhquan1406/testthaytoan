/**
 * @fileoverview Service xử lý JWT token.
 * Tạo, xác thực, và đọc thông tin từ token.
 */

const jwt = require('jsonwebtoken');
const jwtConfig = require('../Config/jwt');

/**
 * @typedef {Object} TokenPayload
 * @property {string} id - ObjectId người dùng (hoặc 'anonymous' với thi ẩn danh)
 * @property {string} email - Email (null với ẩn danh)
 * @property {string} vaiTro - Vai trò người dùng
 * @property {string} [phienThiId] - Chỉ có với token thi ẩn danh
 */

/**
 * Tạo access token cho người dùng đã đăng nhập
 * @param {object} payload - Thông tin đưa vào token
 * @param {string} payload.id - ObjectId MongoDB
 * @param {string} payload.email - Email người dùng
 * @param {string} payload.vaiTro - Vai trò
 * @returns {string} JWT token
 */
const taoToken = ({ id, email, vaiTro }) => {
  return jwt.sign({ id, email, vaiTro }, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn,
  });
};

/**
 * Tạo token đặc biệt cho phiên thi ẩn danh (thời hạn ngắn hơn)
 * @param {object} payload
 * @param {string} payload.phienThiId - ObjectId phiên thi
 * @param {string} payload.hoTenAnDanh - Tên ẩn danh
 * @returns {string} JWT token
 */
const taoTokenThiAnDanh = ({ phienThiId, hoTenAnDanh }) => {
  return jwt.sign(
    { id: 'anonymous', vaiTro: 'THI_AN_DANH', phienThiId, hoTenAnDanh },
    jwtConfig.anonymousSecret,
    { expiresIn: jwtConfig.anonymousExpiresIn }
  );
};

/**
 * Xác thực token và trả về payload đã giải mã
 * @param {string} token - JWT token cần xác thực
 * @returns {TokenPayload} Payload đã giải mã
 * @throws {JsonWebTokenError | TokenExpiredError} Khi token không hợp lệ hoặc hết hạn
 */
const kiemTraToken = (token) => {
  return jwt.verify(token, jwtConfig.secret);
};

/**
 * Xác thực token thi ẩn danh
 * @param {string} token
 * @returns {TokenPayload}
 */
const kiemTraTokenAnDanh = (token) => {
  return jwt.verify(token, jwtConfig.anonymousSecret);
};

/**
 * Giải mã token mà không kiểm tra chữ ký (dùng khi token đã expired nhưng cần đọc payload)
 * @param {string} token
 * @returns {TokenPayload | null}
 */
const giaImageToken = (token) => {
  try {
    return jwt.decode(token);
  } catch {
    return null;
  }
};

module.exports = { taoToken, taoTokenThiAnDanh, kiemTraToken, kiemTraTokenAnDanh, giaImageToken };

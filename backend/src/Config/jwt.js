/**
 * @fileoverview Cấu hình JWT - secret và thời gian hết hạn.
 * Đọc từ biến môi trường, có giá trị mặc định cho môi trường dev.
 */

const jwtConfig = {
  /** Secret key cho token người dùng thường */
  secret: process.env.JWT_SECRET || 'dev_secret_change_in_production',

  /** Thời gian hết hạn access token thường (khuyến nghị ngắn) */
  expiresIn: process.env.JWT_EXPIRES_IN || '15m',

  /** Secret cho token thi ẩn danh (có thể dùng chung hoặc riêng) */
  anonymousSecret: process.env.JWT_SECRET || 'dev_secret_change_in_production',

  /** Thời gian hết hạn token thi ẩn danh (4 giờ) */
  anonymousExpiresIn: process.env.JWT_ANONYMOUS_EXPIRES_IN || '4h',
};

module.exports = jwtConfig;

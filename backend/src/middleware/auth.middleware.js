/**
 * @fileoverview Middleware xác thực JWT.
 * Gắn thông tin người dùng vào req.user sau khi xác thực thành công.
 */

const { kiemTraToken } = require('../services/jwt.service');
const AuthSession = require('../models/AuthSession');
const { unauthorized } = require('../utils/apiResponse');

/**
 * Middleware bắt buộc: yêu cầu token hợp lệ trong Authorization header.
 * Gắn payload vào req.user nếu hợp lệ.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return unauthorized(res, 'Token không được cung cấp');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = kiemTraToken(token);
    if (decoded.sessionId) {
      const activeSession = await AuthSession.findOne({
        sessionId: decoded.sessionId,
        userId: decoded.id,
        revokedAt: null,
      }).lean();
      if (!activeSession) {
        return unauthorized(res, 'Phiên đăng nhập không còn hiệu lực');
      }
    }

    req.user = decoded;
    return next();
  } catch (err) {
    const message = err.name === 'TokenExpiredError' ? 'Token đã hết hạn' : 'Token không hợp lệ';
    return unauthorized(res, message);
  }
};

/**
 * Middleware tùy chọn: đọc token nếu có, nhưng không bắt buộc.
 * Dùng cho các route vừa public vừa có thể authenticated.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const optionalToken = (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      req.user = kiemTraToken(authHeader.split(' ')[1]);
    } catch {
      // Bỏ qua lỗi - route không yêu cầu auth
    }
  }
  return next();
};

module.exports = { verifyToken, optionalToken };

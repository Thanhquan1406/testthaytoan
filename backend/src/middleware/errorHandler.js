/**
 * @fileoverview Global error handler middleware cho Express.
 * Đặt sau tất cả routes trong app.js để bắt mọi lỗi chưa được xử lý.
 */

const { serverError, error } = require('../utils/apiResponse');

/**
 * Handler cho lỗi 404 (route không tồn tại)
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const notFoundHandler = (req, res) => {
  return error(res, `Route không tồn tại: ${req.method} ${req.originalUrl}`, 404);
};

/**
 * Global error handler (4 tham số để Express nhận dạng là error middleware)
 * @param {Error} err - Lỗi được throw
 * @param {import('express').Request} _req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} _next
 */
// eslint-disable-next-line no-unused-vars
const globalErrorHandler = (err, _req, res, _next) => {
  // Log lỗi ra console (production nên dùng logger như Winston)
  console.error('❌ Error:', err.message);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // Lỗi do multer (upload file)
  if (err.name === 'MulterError') {
    return error(res, `Lỗi upload file: ${err.message}`, 400);
  }

  // Lỗi validation từ Mongoose
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return error(res, 'Dữ liệu không hợp lệ', 400, messages);
  }

  // Duplicate key từ MongoDB (unique constraint)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return error(res, `${field} đã tồn tại trong hệ thống`, 409);
  }

  // Lỗi CastError (ObjectId không đúng format)
  if (err.name === 'CastError') {
    return error(res, 'ID không hợp lệ', 400);
  }

  // Lỗi có statusCode tùy chỉnh (throw từ service)
  if (err.statusCode) {
    return error(res, err.message, err.statusCode);
  }

  // Lỗi không xác định
  return serverError(res, process.env.NODE_ENV === 'development' ? err.message : 'Lỗi máy chủ');
};

module.exports = { notFoundHandler, globalErrorHandler };

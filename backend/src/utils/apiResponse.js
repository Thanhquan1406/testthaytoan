/**
 * @fileoverview Tiện ích chuẩn hóa response API.
 * Mọi endpoint đều trả về cùng một cấu trúc { success, data, message, meta? }.
 */

/**
 * Trả về response thành công
 * @param {import('express').Response} res - Express response object
 * @param {*} data - Dữ liệu trả về
 * @param {string} [message='Thành công'] - Thông báo
 * @param {number} [statusCode=200] - HTTP status code
 * @param {object} [meta] - Metadata bổ sung (pagination, v.v.)
 */
const success = (res, data, message = 'Thành công', statusCode = 200, meta = null) => {
  const response = { success: true, message, data };
  if (meta) response.meta = meta;
  return res.status(statusCode).json(response);
};

/**
 * Trả về response tạo mới thành công (201)
 * @param {import('express').Response} res
 * @param {*} data
 * @param {string} [message='Tạo thành công']
 */
const created = (res, data, message = 'Tạo thành công') => {
  return res.status(201).json({ success: true, message, data });
};

/**
 * Trả về response lỗi
 * @param {import('express').Response} res
 * @param {string} message - Thông báo lỗi
 * @param {number} [statusCode=400] - HTTP status code
 * @param {*} [errors=null] - Chi tiết lỗi (validation errors, v.v.)
 */
const error = (res, message = 'Có lỗi xảy ra', statusCode = 400, errors = null) => {
  const response = { success: false, message };
  if (errors) response.errors = errors;
  return res.status(statusCode).json(response);
};

/**
 * Trả về response 401 Unauthorized
 * @param {import('express').Response} res
 * @param {string} [message='Chưa đăng nhập hoặc token hết hạn']
 */
const unauthorized = (res, message = 'Chưa đăng nhập hoặc token hết hạn') => {
  return error(res, message, 401);
};

/**
 * Trả về response 403 Forbidden
 * @param {import('express').Response} res
 * @param {string} [message='Không có quyền truy cập']
 */
const forbidden = (res, message = 'Không có quyền truy cập') => {
  return error(res, message, 403);
};

/**
 * Trả về response 404 Not Found
 * @param {import('express').Response} res
 * @param {string} [message='Không tìm thấy']
 */
const notFound = (res, message = 'Không tìm thấy') => {
  return error(res, message, 404);
};

/**
 * Trả về response 500 Internal Server Error
 * @param {import('express').Response} res
 * @param {string} [message='Lỗi máy chủ nội bộ']
 */
const serverError = (res, message = 'Lỗi máy chủ nội bộ') => {
  return error(res, message, 500);
};

module.exports = { success, created, error, unauthorized, forbidden, notFound, serverError };

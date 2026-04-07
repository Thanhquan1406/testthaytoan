/**
 * @fileoverview Middleware kiểm tra vai trò người dùng.
 * Sử dụng sau verifyToken để phân quyền theo role.
 */

const { forbidden } = require('../utils/apiResponse');
const { VAI_TRO } = require('../utils/constants');

/**
 * Tạo middleware kiểm tra người dùng có một trong các vai trò cho phép không.
 * @param {...string} allowedRoles - Các vai trò được phép (từ VAI_TRO enum)
 * @returns {import('express').RequestHandler}
 *
 * @example
 * // Chỉ admin
 * router.get('/admin-only', verifyToken, checkRole(VAI_TRO.ADMIN), handler);
 *
 * // Admin hoặc giáo viên
 * router.get('/admin-or-gv', verifyToken, checkRole(VAI_TRO.ADMIN, VAI_TRO.GIAO_VIEN), handler);
 */
const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return forbidden(res, 'Không có thông tin người dùng');
    }
    if (!allowedRoles.includes(req.user.vaiTro)) {
      return forbidden(res, 'Bạn không có quyền thực hiện hành động này');
    }
    return next();
  };
};

/** Shorthand middleware cho từng vai trò */
const requireAdmin = checkRole(VAI_TRO.ADMIN);
const requireGiaoVien = checkRole(VAI_TRO.GIAO_VIEN);
const requireSinhVien = checkRole(VAI_TRO.SINH_VIEN);
const requireAdminOrGiaoVien = checkRole(VAI_TRO.ADMIN, VAI_TRO.GIAO_VIEN);

module.exports = { checkRole, requireAdmin, requireGiaoVien, requireSinhVien, requireAdminOrGiaoVien };

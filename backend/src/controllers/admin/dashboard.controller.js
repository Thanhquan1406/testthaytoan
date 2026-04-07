/**
 * @fileoverview Controller dashboard Admin - thống kê tổng quan hệ thống.
 */

const adminService = require('../../services/admin.service');
const { success } = require('../../utils/apiResponse');

/**
 * GET /api/admin/dashboard
 * Lấy số liệu thống kê tổng quan cho admin
 */
const getDashboard = async (_req, res, next) => {
  try {
    const data = await adminService.layDashboard();
    return success(res, data);
  } catch (err) {
    return next(err);
  }
};

module.exports = { getDashboard };

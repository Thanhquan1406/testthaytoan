/**
 * @fileoverview Controller quản lý người dùng (Admin).
 */

const adminService = require('../../services/admin.service');
const { success, created } = require('../../utils/apiResponse');

/** GET /api/admin/nguoi-dung */
const getAll = async (req, res, next) => {
  try {
    const result = await adminService.layDanhSachNguoiDung(req.query);
    return success(res, result.data, 'Thành công', 200, result.meta);
  } catch (err) {
    return next(err);
  }
};

/** GET /api/admin/nguoi-dung/:id */
const getById = async (req, res, next) => {
  try {
    const data = await adminService.layChiTietNguoiDung(req.params.id);
    return success(res, data);
  } catch (err) {
    return next(err);
  }
};

/** PUT /api/admin/nguoi-dung/:id */
const update = async (req, res, next) => {
  try {
    const data = await adminService.capNhatNguoiDung(req.params.id, req.body);
    return success(res, data, 'Cập nhật thành công');
  } catch (err) {
    return next(err);
  }
};

/** PUT /api/admin/nguoi-dung/:id/mat-khau */
const resetPassword = async (req, res, next) => {
  try {
    await adminService.datLaiMatKhau(req.params.id, req.body.matKhauMoi);
    return success(res, null, 'Đặt lại mật khẩu thành công');
  } catch (err) {
    return next(err);
  }
};

/** PUT /api/admin/nguoi-dung/:id/vai-tro */
const changeRole = async (req, res, next) => {
  try {
    const data = await adminService.doiVaiTro(req.params.id, req.body.vaiTro);
    return success(res, data, 'Thay đổi vai trò thành công');
  } catch (err) {
    return next(err);
  }
};

/** DELETE /api/admin/nguoi-dung/:id */
const remove = async (req, res, next) => {
  try {
    await adminService.xoaNguoiDung(req.params.id);
    return success(res, null, 'Xóa người dùng thành công');
  } catch (err) {
    return next(err);
  }
};

module.exports = { getAll, getById, update, resetPassword, changeRole, remove };

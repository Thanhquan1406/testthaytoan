/**
 * @fileoverview Controller quản lý môn học (Admin).
 */

const adminService = require('../../services/admin.service');
const { success, created } = require('../../utils/apiResponse');

/** GET /api/admin/mon-hoc */
const getAll = async (_req, res, next) => {
  try {
    const data = await adminService.layDanhSachMonHoc();
    return success(res, data);
  } catch (err) {
    return next(err);
  }
};

/** POST /api/admin/mon-hoc */
const create = async (req, res, next) => {
  try {
    const data = await adminService.taoMonHoc(req.body);
    return created(res, data, 'Tạo môn học thành công');
  } catch (err) {
    return next(err);
  }
};

/** PUT /api/admin/mon-hoc/:id */
const update = async (req, res, next) => {
  try {
    const data = await adminService.capNhatMonHoc(req.params.id, req.body);
    return success(res, data, 'Cập nhật môn học thành công');
  } catch (err) {
    return next(err);
  }
};

/** DELETE /api/admin/mon-hoc/:id */
const remove = async (req, res, next) => {
  try {
    await adminService.xoaMonHoc(req.params.id);
    return success(res, null, 'Xóa môn học thành công');
  } catch (err) {
    return next(err);
  }
};

module.exports = { getAll, create, update, remove };

/**
 * @fileoverview Controller quản lý lớp học (Giáo viên).
 */

const lopHocService = require('../../services/lopHoc.service');
const { success, created } = require('../../utils/apiResponse');

const GV_ID = (req) => req.user.id;

/** GET /api/giao-vien/lop-hoc */
const getAll = async (req, res, next) => {
  try {
    const data = await lopHocService.layDanhSachCuaGiaoVien(GV_ID(req));
    return success(res, data);
  } catch (err) {
    return next(err);
  }
};

/** GET /api/giao-vien/lop-hoc/:id */
const getById = async (req, res, next) => {
  try {
    const data = await lopHocService.layChiTietCuaGiaoVien(req.params.id, GV_ID(req));
    return success(res, data);
  } catch (err) {
    return next(err);
  }
};

/** POST /api/giao-vien/lop-hoc */
const create = async (req, res, next) => {
  try {
    const { ten, sinhVienIds } = req.body;
    const data = await lopHocService.taoLopHoc(GV_ID(req), ten, sinhVienIds);
    return created(res, data, 'Tạo lớp học thành công');
  } catch (err) {
    return next(err);
  }
};

/** PUT /api/giao-vien/lop-hoc/:id */
const update = async (req, res, next) => {
  try {
    const data = await lopHocService.capNhatLopHoc(req.params.id, GV_ID(req), req.body);
    return success(res, data, 'Cập nhật lớp học thành công');
  } catch (err) {
    return next(err);
  }
};

/** DELETE /api/giao-vien/lop-hoc/:id */
const remove = async (req, res, next) => {
  try {
    await lopHocService.xoaLopHoc(req.params.id, GV_ID(req));
    return success(res, null, 'Xóa lớp học thành công');
  } catch (err) {
    return next(err);
  }
};

/** GET /api/giao-vien/lop-hoc/sinh-vien?keyword=... */
const getSinhVien = async (req, res, next) => {
  try {
    const data = await lopHocService.layDanhSachSinhVien(req.query.keyword);
    return success(res, data);
  } catch (err) {
    return next(err);
  }
};

module.exports = { getAll, getById, create, update, remove, getSinhVien };

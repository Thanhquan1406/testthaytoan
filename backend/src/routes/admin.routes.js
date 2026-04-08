/**
 * @fileoverview Routes cho Admin - tất cả cần quyền ADMIN.
 * Prefix: /api/admin
 */

const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/role.middleware');

const dashboardCtrl = require('../controllers/admin/dashboard.controller');
const nguoiDungCtrl = require('../controllers/admin/nguoiDung.controller');
const monHocCtrl = require('../controllers/admin/monHoc.controller');
const deThiCtrl = require('../controllers/admin/deThi.controller');
const cauHoiCtrl = require('../controllers/admin/cauHoi.controller');
const hoSoCtrl = require('../controllers/admin/hoSo.controller');

// Áp dụng auth + role cho toàn bộ admin routes
router.use(verifyToken, requireAdmin);

// Dashboard
router.get('/dashboard', dashboardCtrl.getDashboard);

// Hồ sơ Admin
router.get('/ho-so', hoSoCtrl.getProfile);
router.put('/ho-so', hoSoCtrl.updateProfile);
router.post('/ho-so/doi-mat-khau', hoSoCtrl.changePassword);

// Quản lý người dùng
router.get('/nguoi-dung', nguoiDungCtrl.getAll);
router.get('/nguoi-dung/:id', nguoiDungCtrl.getById);
router.put('/nguoi-dung/:id', nguoiDungCtrl.update);
router.put('/nguoi-dung/:id/mat-khau', nguoiDungCtrl.resetPassword);
router.put('/nguoi-dung/:id/vai-tro', nguoiDungCtrl.changeRole);
router.delete('/nguoi-dung/:id', nguoiDungCtrl.remove);

// Quản lý môn học
router.get('/mon-hoc', monHocCtrl.getAll);
router.post('/mon-hoc', monHocCtrl.create);
router.put('/mon-hoc/:id', monHocCtrl.update);
router.delete('/mon-hoc/:id', monHocCtrl.remove);

// Xem đề thi
router.get('/de-thi/thong-ke', deThiCtrl.getThongKe);
router.get('/de-thi', deThiCtrl.getAll);
router.delete('/de-thi/:id', deThiCtrl.forceDelete);

// Xem câu hỏi
router.get('/cau-hoi', cauHoiCtrl.getAll);

module.exports = router;

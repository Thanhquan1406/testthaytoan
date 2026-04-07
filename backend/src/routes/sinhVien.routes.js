/**
 * @fileoverview Routes cho Sinh viên.
 * Prefix: /api/sinh-vien
 */

const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/auth.middleware');
const { requireSinhVien } = require('../middleware/role.middleware');

const hoSoCtrl = require('../controllers/sinhVien/hoSo.controller');
const phongThiCtrl = require('../controllers/sinhVien/phongThi.controller');
const thiCtrl = require('../controllers/sinhVien/thi.controller');
const lichSuCtrl = require('../controllers/sinhVien/lichSuThi.controller');

router.use(verifyToken, requireSinhVien);

// Hồ sơ
router.get('/ho-so', hoSoCtrl.getProfile);
router.put('/ho-so', hoSoCtrl.updateProfile);
router.post('/ho-so/doi-mat-khau', hoSoCtrl.changePassword);

// Phòng thi (lớp học)
router.get('/phong-thi', phongThiCtrl.getLopHoc);
router.get('/phong-thi/:lopId', phongThiCtrl.getLopChiTiet);
router.get('/phong-thi/:lopId/de-thi', phongThiCtrl.getDeThi);

// Làm bài thi
router.post('/thi/bat-dau', thiCtrl.batDau);
router.get('/thi/phien/:phienThiId/noi-dung', thiCtrl.getNoiDung);
router.post('/thi/phien/:phienThiId/luu', thiCtrl.luuTraLoi);
router.post('/thi/phien/:phienThiId/nop-bai', thiCtrl.nopBai);
router.post('/thi/phien/:phienThiId/vi-pham', thiCtrl.viPham);
router.get('/thi/phien/:phienThiId/ket-qua', thiCtrl.getKetQua);

// Lịch sử thi
router.get('/lich-su-thi', lichSuCtrl.getLichSu);
router.get('/lich-su-thi/:phienThiId/chi-tiet', lichSuCtrl.getChiTiet);

module.exports = router;

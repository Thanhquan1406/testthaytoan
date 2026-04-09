/**
 * @fileoverview Routes public - thi ẩn danh qua link công khai.
 * Prefix: /api/public (thông tin đề) và /api/thi-an-danh (phiên thi)
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { requireSinhVien } = require('../middleware/role.middleware');

const deThiLinkCtrl = require('../controllers/public/deThiLink.controller');
const thiAnDanhCtrl = require('../controllers/public/thiAnDanh.controller');

// Thông tin đề thi qua link (không cần auth)
router.get('/de-thi-link/:maTruyCap/thong-tin', deThiLinkCtrl.getThongTin);
router.post('/de-thi-link/:maTruyCap/bat-dau', deThiLinkCtrl.batDauAnDanh);
router.post(
  '/de-thi-link/:maTruyCap/bat-dau-da-dang-nhap',
  verifyToken,
  requireSinhVien,
  deThiLinkCtrl.batDauDaDangNhap
);

// Phiên thi ẩn danh (cần token ẩn danh riêng)
router.get(
  '/thi-an-danh/phien/:phienThiId/noi-dung',
  thiAnDanhCtrl.verifyAnonymousToken,
  thiAnDanhCtrl.ensureAnonymousSessionMatch,
  thiAnDanhCtrl.getNoiDung
);
router.post(
  '/thi-an-danh/phien/:phienThiId/luu',
  thiAnDanhCtrl.verifyAnonymousToken,
  thiAnDanhCtrl.ensureAnonymousSessionMatch,
  thiAnDanhCtrl.luuTraLoi
);
router.post(
  '/thi-an-danh/phien/:phienThiId/nop-bai',
  thiAnDanhCtrl.verifyAnonymousToken,
  thiAnDanhCtrl.ensureAnonymousSessionMatch,
  thiAnDanhCtrl.nopBai
);
router.post(
  '/thi-an-danh/phien/:phienThiId/vi-pham',
  thiAnDanhCtrl.verifyAnonymousToken,
  thiAnDanhCtrl.ensureAnonymousSessionMatch,
  thiAnDanhCtrl.viPham
);
router.get(
  '/thi-an-danh/phien/:phienThiId/ket-qua',
  thiAnDanhCtrl.verifyAnonymousToken,
  thiAnDanhCtrl.ensureAnonymousSessionMatch,
  thiAnDanhCtrl.getKetQua
);
router.get(
  '/thi-an-danh/phien/:phienThiId/chi-tiet',
  thiAnDanhCtrl.verifyAnonymousToken,
  thiAnDanhCtrl.ensureAnonymousSessionMatch,
  thiAnDanhCtrl.getChiTiet
);

module.exports = router;

/**
 * @fileoverview Routes xác thực: đăng nhập, đăng ký, captcha, kiểm tra email/SĐT.
 */

const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { validateDangKy, validateDangNhap } = require('../validators/auth.validator');

// Captcha (không cần auth)
router.get('/captcha', authController.getCaptcha);

// Đăng ký / Đăng nhập
router.post('/register', validateDangKy, authController.register);
router.post('/login', validateDangNhap, authController.login);
router.post('/login/admin', validateDangNhap, authController.loginAdmin);
router.post('/logout', authController.logout);

// Kiểm tra tồn tại real-time
router.get('/check-email', authController.checkEmail);
router.get('/check-sdt', authController.checkSdt);

module.exports = router;

/**
 * @fileoverview Routes xác thực: đăng nhập, đăng ký, captcha, kiểm tra email/SĐT.
 */

const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const {
  validateDangKy,
  validateDangNhap,
  validateDoiMatKhau,
  validateForgotPassword,
  validateResetPassword,
  validateRefresh,
  validate2FASetupVerify,
  validate2FALoginVerify,
  validateDisable2FA,
} = require('../validators/auth.validator');

// Captcha (không cần auth)
router.get('/captcha', authController.getCaptcha);

// Đăng ký / Đăng nhập
router.post('/register', validateDangKy, authController.register);
router.post('/login', validateDangNhap, authController.login);
router.post('/login/admin', validateDangNhap, authController.loginAdmin);
router.post('/logout', authController.logout);
router.post('/refresh', validateRefresh, authController.refresh);
router.post('/forgot-password', validateForgotPassword, authController.forgotPassword);
router.post('/reset-password', validateResetPassword, authController.resetPassword);
router.post('/change-password', verifyToken, validateDoiMatKhau, authController.changePassword);

// Google OAuth (không cần captcha vì Google đã xác thực)
router.post('/google', authController.loginGoogle);
router.post('/google/register', authController.registerGoogle);
router.post('/2fa/verify-login', validate2FALoginVerify, authController.verifyTwoFactorLogin);
router.post('/2fa/setup/start', verifyToken, authController.startTwoFactorSetup);
router.post('/2fa/setup/verify', verifyToken, validate2FASetupVerify, authController.verifyTwoFactorSetup);
router.post('/2fa/disable', verifyToken, validateDisable2FA, authController.disableTwoFactor);
router.get('/2fa/status', verifyToken, authController.twoFactorStatus);

// Session management
router.get('/sessions', verifyToken, authController.listSessions);
router.delete('/sessions/:sessionId', verifyToken, authController.revokeSession);
router.post('/logout-all', verifyToken, authController.logoutAll);

// Kiểm tra tồn tại real-time
router.get('/check-email', authController.checkEmail);
router.get('/check-sdt', authController.checkSdt);

module.exports = router;

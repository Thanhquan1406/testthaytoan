/**
 * @fileoverview Validators cho các route auth.
 * Dùng express-validator để validate và sanitize input.
 */

const { body } = require('express-validator');
const { VAI_TRO } = require('../utils/constants');

/**
 * Middleware hàm xử lý kết quả validation.
 * Trả về lỗi 422 nếu có field không hợp lệ.
 */
const { validationResult } = require('express-validator');

/**
 * Chạy sau các validators, trả về lỗi nếu có
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  return next();
};

/** Validator cho đăng ký tài khoản */
const validateDangKy = [
  body('ho').trim().notEmpty().withMessage('Họ không được để trống').isLength({ max: 100 }),
  body('ten').trim().notEmpty().withMessage('Tên không được để trống').isLength({ max: 100 }),
  body('email').trim().isEmail().withMessage('Email không hợp lệ').normalizeEmail(),
  body('soDienThoai')
    .trim()
    .matches(/^[0-9]{10,11}$/)
    .withMessage('Số điện thoại phải là 10-11 chữ số'),
  body('matKhau')
    .isLength({ min: 6, max: 50 })
    .withMessage('Mật khẩu phải từ 6-50 ký tự'),
  body('vaiTro')
    .optional()
    .isIn([VAI_TRO.SINH_VIEN, VAI_TRO.GIAO_VIEN])
    .withMessage('Vai trò không hợp lệ'),
  body('captchaId').notEmpty().withMessage('Thiếu captchaId'),
  body('captchaAnswer').notEmpty().withMessage('Vui lòng nhập kết quả captcha'),
  handleValidationErrors,
];

/** Validator cho đăng nhập */
const validateDangNhap = [
  body('email').trim().notEmpty().withMessage('Vui lòng nhập email hoặc số điện thoại'),
  body('matKhau').notEmpty().withMessage('Vui lòng nhập mật khẩu'),
  body('captchaId').notEmpty().withMessage('Thiếu captchaId'),
  body('captchaAnswer').notEmpty().withMessage('Vui lòng nhập kết quả captcha'),
  handleValidationErrors,
];

/** Validator cho đổi mật khẩu */
const validateDoiMatKhau = [
  body('matKhauCu').notEmpty().withMessage('Vui lòng nhập mật khẩu cũ'),
  body('matKhauMoi')
    .isLength({ min: 6, max: 50 })
    .withMessage('Mật khẩu mới phải từ 6-50 ký tự'),
  body('matKhauMoi2').custom((value, { req }) => {
    if (value !== req.body.matKhauMoi) throw new Error('Xác nhận mật khẩu không khớp');
    return true;
  }),
  handleValidationErrors,
];

const validateForgotPassword = [
  body('email').trim().isEmail().withMessage('Email không hợp lệ').normalizeEmail(),
  handleValidationErrors,
];

const validateResetPassword = [
  body('token').notEmpty().withMessage('Thiếu token đặt lại mật khẩu'),
  body('matKhauMoi').isLength({ min: 6, max: 50 }).withMessage('Mật khẩu mới phải từ 6-50 ký tự'),
  handleValidationErrors,
];

const validateRefresh = [
  body('refreshToken').notEmpty().withMessage('Thiếu refresh token'),
  handleValidationErrors,
];

const validate2FASetupVerify = [
  body('otpCode').isLength({ min: 6, max: 6 }).withMessage('Mã OTP phải gồm 6 chữ số'),
  handleValidationErrors,
];

const validate2FALoginVerify = [
  body('challengeToken').notEmpty().withMessage('Thiếu challenge token'),
  body('otpCode').isLength({ min: 6, max: 6 }).withMessage('Mã OTP phải gồm 6 chữ số'),
  handleValidationErrors,
];

const validateDisable2FA = [
  body('matKhau').notEmpty().withMessage('Vui lòng nhập mật khẩu'),
  body('otpCode').isLength({ min: 6, max: 6 }).withMessage('Mã OTP phải gồm 6 chữ số'),
  handleValidationErrors,
];

module.exports = {
  validateDangKy,
  validateDangNhap,
  validateDoiMatKhau,
  validateForgotPassword,
  validateResetPassword,
  validateRefresh,
  validate2FASetupVerify,
  validate2FALoginVerify,
  validateDisable2FA,
  handleValidationErrors,
};

/**
 * @fileoverview Controller xử lý các request liên quan đến xác thực.
 * Controller chỉ điều phối: validate → gọi service → trả response.
 * Không chứa business logic.
 */

const authService = require('../services/auth.service');
const captchaService = require('../services/captcha.service');
const { success, created, error } = require('../utils/apiResponse');

/**
 * GET /api/auth/captcha
 * Tạo và trả về CAPTCHA mới cho form đăng nhập/đăng ký
 * @param {import('express').Request} _req
 * @param {import('express').Response} res
 */
const getCaptcha = (_req, res) => {
  const captcha = captchaService.generateCaptcha();
  return success(res, captcha, 'Captcha được tạo thành công');
};

/**
 * POST /api/auth/register
 * Đăng ký tài khoản mới (sinh viên hoặc giáo viên)
 * Body: { ho, ten, email, soDienThoai, matKhau, vaiTro, captchaId, captchaAnswer }
 */
const register = async (req, res, next) => {
  try {
    const { captchaId, captchaAnswer, ...userData } = req.body;

    const captchaValid = captchaService.validateCaptcha(captchaId, captchaAnswer);
    if (!captchaValid) {
      return error(res, 'Kết quả captcha không đúng', 400);
    }

    const result = await authService.dangKy(userData);
    return created(res, result, 'Đăng ký thành công');
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /api/auth/login
 * Đăng nhập cho sinh viên và giáo viên
 * Body: { email, matKhau, captchaId, captchaAnswer }
 */
const login = async (req, res, next) => {
  try {
    const { email, matKhau, captchaId, captchaAnswer } = req.body;

    const captchaValid = captchaService.validateCaptcha(captchaId, captchaAnswer);
    if (!captchaValid) {
      return error(res, 'Kết quả captcha không đúng', 400);
    }

    const result = await authService.dangNhap(email, matKhau);
    return success(res, result, 'Đăng nhập thành công');
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /api/auth/login/admin
 * Đăng nhập dành riêng cho Admin
 * Body: { email, matKhau, captchaId, captchaAnswer }
 */
const loginAdmin = async (req, res, next) => {
  try {
    const { email, matKhau, captchaId, captchaAnswer } = req.body;

    const captchaValid = captchaService.validateCaptcha(captchaId, captchaAnswer);
    if (!captchaValid) {
      return error(res, 'Kết quả captcha không đúng', 400);
    }

    const result = await authService.dangNhapAdmin(email, matKhau);
    return success(res, result, 'Đăng nhập admin thành công');
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /api/auth/google
 * Đăng nhập bằng Google OAuth
 * Body: { credential } - Google ID token từ frontend
 */
const loginGoogle = async (req, res, next) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return error(res, 'Thiếu Google credential', 400);
    }

    const result = await authService.dangNhapGoogle(credential);
    return success(res, result, result.needsRegistration ? 'Cần hoàn tất đăng ký' : 'Đăng nhập thành công');
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /api/auth/google/register
 * Hoàn tất đăng ký tài khoản mới qua Google
 * Body: { credential, vaiTro, soDienThoai }
 */
const registerGoogle = async (req, res, next) => {
  try {
    const { credential, vaiTro, soDienThoai } = req.body;
    if (!credential || !vaiTro || !soDienThoai) {
      return error(res, 'Thiếu thông tin bắt buộc (credential, vaiTro, soDienThoai)', 400);
    }

    const result = await authService.dangKyGoogle({ credential, vaiTro, soDienThoai });
    return created(res, result, 'Đăng ký thành công');
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /api/auth/logout
 * Client phải tự xóa token ở phía frontend.
 * Endpoint này chỉ để thông báo thành công (stateless JWT không cần blacklist ở MVP).
 */
const logout = (_req, res) => {
  return success(res, null, 'Đăng xuất thành công');
};

/**
 * GET /api/auth/check-email?email=...
 * Kiểm tra email đã được đăng ký chưa (dùng để validate real-time ở form)
 */
const checkEmail = async (req, res, next) => {
  try {
    const { email } = req.query;
    if (!email) return error(res, 'Thiếu email', 400);
    const exists = await authService.kiemTraEmailTonTai(email);
    return success(res, { exists: !!exists });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/auth/check-sdt?soDienThoai=...
 * Kiểm tra số điện thoại đã đăng ký chưa
 */
const checkSdt = async (req, res, next) => {
  try {
    const { soDienThoai } = req.query;
    if (!soDienThoai) return error(res, 'Thiếu số điện thoại', 400);
    const exists = await authService.kiemTraSdtTonTai(soDienThoai);
    return success(res, { exists: !!exists });
  } catch (err) {
    return next(err);
  }
};

module.exports = { getCaptcha, register, login, loginAdmin, loginGoogle, registerGoogle, logout, checkEmail, checkSdt };

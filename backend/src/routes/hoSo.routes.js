/**
 * @fileoverview Routes hồ sơ người dùng - dùng chung cho mọi vai trò đã đăng nhập.
 * Base path: /api/ho-so
 */

const router = require('express').Router();
const { verifyToken } = require('../middleware/auth.middleware');
const hoSoService = require('../services/hoSo.service');
const { success } = require('../utils/apiResponse');

/**
 * GET /api/ho-so
 * Lấy hồ sơ của người dùng hiện tại
 */
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const data = await hoSoService.layHoSo(req.user.id);
    success(res, data);
  } catch (err) { next(err); }
});

/**
 * PUT /api/ho-so
 * Cập nhật hồ sơ
 */
router.put('/', verifyToken, async (req, res, next) => {
  try {
    const data = await hoSoService.capNhatHoSo(req.user.id, req.body);
    success(res, data, 'Cập nhật hồ sơ thành công');
  } catch (err) { next(err); }
});

/**
 * PUT /api/ho-so/doi-mat-khau
 * Đổi mật khẩu
 */
router.put('/doi-mat-khau', verifyToken, async (req, res, next) => {
  try {
    await hoSoService.doiMatKhau(req.user.id, req.body);
    success(res, null, 'Đổi mật khẩu thành công');
  } catch (err) { next(err); }
});

module.exports = router;

/**
 * @fileoverview Controller hồ sơ Sinh viên.
 */

const hoSoService = require('../../services/hoSo.service');
const { success } = require('../../utils/apiResponse');

/** GET /api/sinh-vien/ho-so */
const getProfile = async (req, res, next) => {
  try {
    const data = await hoSoService.layHoSo(req.user.id);
    return success(res, data);
  } catch (err) {
    return next(err);
  }
};

/** PUT /api/sinh-vien/ho-so */
const updateProfile = async (req, res, next) => {
  try {
    const data = await hoSoService.capNhatHoSo(req.user.id, req.body);
    return success(res, data, 'Cập nhật hồ sơ thành công');
  } catch (err) {
    return next(err);
  }
};

/** POST /api/sinh-vien/ho-so/doi-mat-khau */
const changePassword = async (req, res, next) => {
  try {
    const { matKhauCu, matKhauMoi } = req.body;
    await hoSoService.doiMatKhau(req.user.id, matKhauCu, matKhauMoi);
    return success(res, null, 'Đổi mật khẩu thành công');
  } catch (err) {
    return next(err);
  }
};

module.exports = { getProfile, updateProfile, changePassword };

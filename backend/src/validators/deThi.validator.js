/**
 * @fileoverview Validators cho API đề thi.
 */

const { body } = require('express-validator');
const { handleValidationErrors } = require('./auth.validator');

/** Validator tạo/sửa đề thi */
const validateDeThi = [
  body('ten').trim().notEmpty().withMessage('Tên đề thi không được để trống').isLength({ max: 300 }),
  body('monHocId').notEmpty().withMessage('Môn học không được để trống').isMongoId().withMessage('monHocId không hợp lệ'),
  body('thoiGianPhut').isInt({ min: 1, max: 300 }).withMessage('Thời gian phải từ 1-300 phút'),
  body('soLanThiToiDa').optional().isInt({ min: 0 }).withMessage('Số lần thi phải >= 0'),
  handleValidationErrors,
];

module.exports = { validateDeThi };


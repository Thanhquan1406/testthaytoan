/**
 * @fileoverview Validators cho API câu hỏi.
 */

const { body } = require('express-validator');
const { handleValidationErrors } = require('./auth.validator');
const { LOAI_CAU_HOI, DO_KHO } = require('../utils/constants');

/** Validator tạo/sửa câu hỏi */
const validateCauHoi = [
  body('noiDung').trim().notEmpty().withMessage('Nội dung câu hỏi không được để trống'),
  body('chuDeId').notEmpty().withMessage('Chủ đề không được để trống').isMongoId(),
  body('loaiCauHoi').isIn(Object.values(LOAI_CAU_HOI)).withMessage('Loại câu hỏi không hợp lệ'),
  body('doKho').isIn(Object.values(DO_KHO)).withMessage('Độ khó không hợp lệ'),
  body('dapAnDung')
    .if(body('loaiCauHoi').isIn([LOAI_CAU_HOI.TRAC_NGHIEM, LOAI_CAU_HOI.DUNG_SAI]))
    .notEmpty()
    .withMessage('Đáp án đúng không được để trống với câu trắc nghiệm/đúng sai'),
  handleValidationErrors,
];

module.exports = { validateCauHoi };

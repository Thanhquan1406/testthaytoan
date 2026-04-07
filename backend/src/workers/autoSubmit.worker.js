/**
 * @fileoverview Worker tự động nộp bài khi hết giờ - Phase 2 placeholder.
 *
 * Logic sẽ chạy theo cron job để quét các phiên thi quá thời gian:
 *   - Lấy các PhienThi có trangThai = DANG_THI
 *   - Kiểm tra thoiGianBatDau + thoiGianPhut < now
 *   - Gọi service nopBai, tính điểm, lưu kết quả
 *
 * Cần triển khai ở Phase 2:
 *   1. Tích hợp BullMQ để xử lý job queue thay vì cron đơn giản
 *   2. Đăng ký worker trong server.js
 */

const { TRANG_THAI_PHIEN_THI } = require('../utils/constants');

/**
 * Khởi động worker auto-submit
 * @returns {void}
 */
const startAutoSubmitWorker = () => {
  // TODO Phase 2: Bật worker
  // const cron = require('node-cron');
  // const PhienThi = require('../models/PhienThi');
  // const thiService = require('../services/thi.service');
  //
  // cron.schedule('* * * * *', async () => {
  //   const now = new Date();
  //   const expiredSessions = await PhienThi.find({
  //     trangThai: TRANG_THAI_PHIEN_THI.DANG_THI,
  //     $expr: {
  //       $lt: [
  //         { $add: ['$thoiGianBatDau', { $multiply: ['$thoiGianPhut', 60000] }] },
  //         now,
  //       ],
  //     },
  //   }).populate('deThiId', 'thoiGianPhut');
  //
  //   for (const phien of expiredSessions) {
  //     try {
  //       await thiService.nopBai(phien._id, phien.nguoiDungId, true);
  //       console.log(`Auto-submit phiên ${phien._id}`);
  //     } catch (err) {
  //       console.error(`Auto-submit lỗi phiên ${phien._id}:`, err.message);
  //     }
  //   }
  // });

  console.log('ℹ️  Auto-submit worker chưa được kích hoạt (Phase 2)');
};

module.exports = { startAutoSubmitWorker };

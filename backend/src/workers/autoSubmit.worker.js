/**
 * @fileoverview Worker tự động nộp bài khi hết giờ (strict cutoff).
 */

const cron = require('node-cron');
const PhienThi = require('../models/PhienThi');
const thiService = require('../services/thi.service');
const { TRANG_THAI_PHIEN_THI } = require('../utils/constants');

let _isRunning = false;

const _isExpired = (phien, now = new Date()) => {
  const thoiGianPhut = phien?.deThiId?.thoiGianPhut;
  if (!thoiGianPhut || thoiGianPhut <= 0) return false; // 0/null: không giới hạn
  if (!phien?.thoiGianBatDau) return false;

  const deadline = new Date(phien.thoiGianBatDau).getTime() + thoiGianPhut * 60 * 1000;
  return deadline <= now.getTime();
};

/**
 * Khởi động worker auto-submit
 * @returns {void}
 */
const startAutoSubmitWorker = () => {
  cron.schedule('* * * * *', async () => {
    if (_isRunning) return;
    _isRunning = true;

    try {
      const now = new Date();
      const sessions = await PhienThi.find({
        trangThai: TRANG_THAI_PHIEN_THI.DANG_THI,
      })
        .populate('deThiId', 'thoiGianPhut')
        .select('_id nguoiDungId thoiGianBatDau deThiId')
        .lean();

      const expiredSessions = sessions.filter((phien) => _isExpired(phien, now));
      if (expiredSessions.length === 0) return;

      let ok = 0;
      let fail = 0;

      for (const phien of expiredSessions) {
        try {
          await thiService.nopBai(phien._id, phien.nguoiDungId?.toString() || null, { allowAlreadySubmitted: true });
          ok += 1;
        } catch (err) {
          fail += 1;
          console.error(`[auto-submit] Lỗi phiên ${phien._id}:`, err.message);
        }
      }

      console.log(`[auto-submit] Đã xử lý ${expiredSessions.length} phiên quá giờ (ok=${ok}, fail=${fail})`);
    } catch (err) {
      console.error('[auto-submit] Worker gặp lỗi:', err.message);
    } finally {
      _isRunning = false;
    }
  });

  console.log('✅ Auto-submit worker đã được kích hoạt (cron mỗi phút)');
};

module.exports = { startAutoSubmitWorker };

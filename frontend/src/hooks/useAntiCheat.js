/**
 * @fileoverview Hook phát hiện và báo cáo hành vi vi phạm trong thi.
 * Theo dõi: chuyển tab, thoát fullscreen, copy/paste.
 */

import { useEffect, useCallback, useRef } from 'react';

/**
 * @typedef {'CHUYEN_TAB'|'THOAT_TOAN_MAN_HINH'|'COPY_PASTE'|'RIGHT_CLICK'} HanhViViPham
 */

/**
 * @param {object} options
 * @param {Function} options.onViolation - Callback (hanhVi: HanhViViPham) => void
 * @param {boolean} [options.enabled=true] - Bật/tắt theo dõi
 * @param {boolean} [options.requireFullscreen=true] - Yêu cầu fullscreen khi thi
 */
const useAntiCheat = ({ onViolation, enabled = true, requireFullscreen = true }) => {
  const reportedRef = useRef(new Set());

  /** Báo cáo vi phạm (chống spam nhiều lần cùng loại trong 3s) */
  const report = useCallback(
    (hanhVi) => {
      if (!enabled) return;
      if (reportedRef.current.has(hanhVi)) return;

      reportedRef.current.add(hanhVi);
      onViolation?.(hanhVi);

      // Cho phép báo lại sau 3 giây
      setTimeout(() => reportedRef.current.delete(hanhVi), 3000);
    },
    [enabled, onViolation]
  );

  // Theo dõi chuyển tab / mất focus
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden) report('CHUYEN_TAB');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enabled, report]);

  // Theo dõi thoát fullscreen
  useEffect(() => {
    if (!enabled || !requireFullscreen) return;

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) report('THOAT_TOAN_MAN_HINH');
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [enabled, requireFullscreen, report]);

  // Chặn right-click và copy/paste
  useEffect(() => {
    if (!enabled) return;

    const handleContextMenu = (e) => {
      e.preventDefault();
      report('RIGHT_CLICK');
    };

    const handleCopy = () => report('COPY_PASTE');

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handleCopy);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handleCopy);
    };
  }, [enabled, report]);

  /**
   * Yêu cầu fullscreen (gọi khi bắt đầu thi)
   * @returns {Promise<void>}
   */
  const enterFullscreen = useCallback(() => {
    if (document.documentElement.requestFullscreen) {
      return document.documentElement.requestFullscreen();
    }
    return Promise.resolve();
  }, []);

  return { enterFullscreen };
};

export default useAntiCheat;

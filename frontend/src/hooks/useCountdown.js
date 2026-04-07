/**
 * @fileoverview Hook đếm ngược thời gian thi.
 * Tự động gọi onExpired khi hết giờ.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * @param {object} options
 * @param {Date|string} options.thoiGianBatDau - Thời điểm bắt đầu thi
 * @param {number} options.thoiGianPhut - Thời lượng tính bằng phút
 * @param {Function} [options.onExpired] - Callback khi hết giờ
 * @returns {{ secondsLeft: number, formatted: string, isExpired: boolean }}
 */
const useCountdown = ({ thoiGianBatDau, thoiGianPhut, onExpired }) => {
  const endTime = useRef(
    new Date(thoiGianBatDau).getTime() + thoiGianPhut * 60 * 1000
  );

  const calcSecondsLeft = useCallback(() => {
    return Math.max(0, Math.floor((endTime.current - Date.now()) / 1000));
  }, []);

  const [secondsLeft, setSecondsLeft] = useState(calcSecondsLeft);
  const expiredCalled = useRef(false);

  useEffect(() => {
    if (secondsLeft === 0) {
      if (!expiredCalled.current) {
        expiredCalled.current = true;
        onExpired?.();
      }
      return;
    }

    const interval = setInterval(() => {
      const left = calcSecondsLeft();
      setSecondsLeft(left);
      if (left === 0 && !expiredCalled.current) {
        expiredCalled.current = true;
        clearInterval(interval);
        onExpired?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsLeft, calcSecondsLeft, onExpired]);

  /** Format HH:MM:SS */
  const h = Math.floor(secondsLeft / 3600);
  const m = Math.floor((secondsLeft % 3600) / 60);
  const s = secondsLeft % 60;
  const formatted = [h > 0 ? String(h).padStart(2, '0') : null, String(m).padStart(2, '0'), String(s).padStart(2, '0')]
    .filter(Boolean)
    .join(':');

  return { secondsLeft, formatted, isExpired: secondsLeft === 0 };
};

export default useCountdown;

/**
 * @fileoverview Component hiển thị đồng hồ đếm ngược trong phòng thi.
 * Đổi màu khi còn ít thời gian (< 5 phút).
 */

import useCountdown from '../../hooks/useCountdown';

/**
 * @param {{
 *   thoiGianBatDau: string|Date,
 *   thoiGianPhut: number,
 *   onExpired: Function
 * }} props
 */
const CountdownTimer = ({ thoiGianBatDau, thoiGianPhut, onExpired }) => {
  const { formatted, secondsLeft, isExpired } = useCountdown({
    thoiGianBatDau,
    thoiGianPhut,
    onExpired,
  });

  const isWarning = secondsLeft <= 5 * 60 && !isExpired;
  const isDanger = secondsLeft <= 60 && !isExpired;

  const color = isDanger ? '#dc2626' : isWarning ? '#d97706' : '#059669';
  const bg = isDanger ? '#fee2e2' : isWarning ? '#fef3c7' : '#d1fae5';

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '0.5rem 1rem', borderRadius: '0.5rem',
        background: bg, border: `1px solid ${color}`,
        animation: isDanger ? 'pulse 1s infinite' : 'none',
      }}
    >
      <span style={{ fontSize: '1.25rem' }}>⏱</span>
      <span style={{ fontWeight: 700, fontSize: '1.25rem', color, fontVariantNumeric: 'tabular-nums' }}>
        {isExpired ? 'Hết giờ!' : formatted}
      </span>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }`}</style>
    </div>
  );
};

export default CountdownTimer;

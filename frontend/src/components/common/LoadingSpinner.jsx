/**
 * @fileoverview Component spinner loading có thể dùng ở nhiều kích cỡ.
 */

/**
 * @param {{ size?: 'sm'|'md'|'lg', text?: string, fullPage?: boolean }} props
 */
const LoadingSpinner = ({ size = 'md', text = 'Đang tải...', fullPage = false }) => {
  const sizeMap = { sm: 20, md: 36, lg: 56 };
  const px = sizeMap[size] || 36;

  const spinner = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <svg
        width={px}
        height={px}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ animation: 'spin 0.8s linear infinite' }}
      >
        <circle cx="12" cy="12" r="10" stroke="var(--border-default)" strokeWidth="3" />
        <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </svg>
      {text && <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{text}</span>}
    </div>
  );

  if (fullPage) {
    return (
      <div
        style={{
          position: 'fixed', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          background: 'var(--overlay-bg)', zIndex: 9999,
        }}
      >
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;

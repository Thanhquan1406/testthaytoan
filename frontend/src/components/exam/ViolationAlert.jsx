/**
 * @fileoverview Component cảnh báo vi phạm hiển thị trong phòng thi.
 */

/**
 * @param {{ soLan: number, message?: string, onDismiss?: Function }} props
 */
const ViolationAlert = ({ soLan, message, onDismiss }) => {
  if (!soLan || soLan === 0) return null;

  return (
    <div
      style={{
        position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)',
        background: '#7f1d1d', color: '#fff', padding: '0.75rem 1.5rem',
        borderRadius: '0.75rem', boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        zIndex: 9999, display: 'flex', alignItems: 'center', gap: '1rem',
        animation: 'slideDown 0.3s ease',
        maxWidth: '90vw',
      }}
    >
      <style>{`@keyframes slideDown { from { transform: translateX(-50%) translateY(-20px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }`}</style>
      <span style={{ fontSize: '1.5rem' }}>⚠️</span>
      <div>
        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
          Cảnh báo vi phạm ({soLan} lần)
        </div>
        <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
          {message || 'Bài thi đang bị giám sát. Vui lòng không rời khỏi trang thi.'}
        </div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.25rem' }}
        >
          ×
        </button>
      )}
    </div>
  );
};

export default ViolationAlert;

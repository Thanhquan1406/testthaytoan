const ConfirmDialog = ({
  isOpen,
  title = 'Xác nhận thao tác',
  message = '',
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  onConfirm,
  onCancel,
  dangerous = false,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10001,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: 'var(--bg-surface)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-default)',
          borderRadius: '0.85rem',
          padding: '1rem',
          boxShadow: '0 14px 30px rgba(0,0,0,0.25)',
        }}
      >
        <h3 style={{ margin: 0, marginBottom: '0.5rem', fontSize: '1rem', fontWeight: 700 }}>{title}</h3>
        <p style={{ margin: 0, marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{message}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '0.5rem 0.95rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-default)',
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
            }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: '0.5rem 0.95rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: dangerous ? '#dc2626' : 'var(--primary)',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;


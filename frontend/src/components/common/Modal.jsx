/**
 * @fileoverview Component Modal dùng chung - có header, body, footer chuẩn.
 */

import { useEffect } from 'react';

const styles = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: '1rem',
  },
  modal: {
    background: 'var(--bg-surface)', color: 'var(--text-primary)',
    borderRadius: '0.75rem', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column',
    overflow: 'hidden', border: '1px solid var(--border-default)',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-default)',
  },
  title: { fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)' },
  closeBtn: {
    background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer',
    color: 'var(--text-secondary)', lineHeight: 1, padding: '4px',
  },
  body: { padding: '1.5rem', overflowY: 'auto', flex: 1 },
  footer: {
    padding: '1rem 1.5rem', borderTop: '1px solid var(--border-default)',
    display: 'flex', gap: '0.75rem', justifyContent: 'flex-end',
  },
};

const sizeMap = { sm: '400px', md: '560px', lg: '720px', xl: '900px' };

/**
 * @param {{
 *   isOpen: boolean,
 *   onClose: Function,
 *   title: string,
 *   children: React.ReactNode,
 *   footer?: React.ReactNode,
 *   size?: 'sm'|'md'|'lg'|'xl'
 * }} props
 */
const Modal = ({ isOpen, onClose, title, children, footer, size = 'md' }) => {
  // Ngăn scroll body khi modal mở
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Đóng khi nhấn Esc
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' && isOpen) onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div
        style={{ ...styles.modal, maxWidth: sizeMap[size] || sizeMap.md }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div style={styles.header}>
          <h2 id="modal-title" style={styles.title}>{title}</h2>
          <button style={styles.closeBtn} onClick={onClose} aria-label="Đóng">×</button>
        </div>
        <div style={styles.body}>{children}</div>
        {footer && <div style={styles.footer}>{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;

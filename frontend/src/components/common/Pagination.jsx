/**
 * @fileoverview Component phân trang chuẩn.
 */

/**
 * @param {{
 *   meta: { page: number, totalPages: number, hasNext: boolean, hasPrev: boolean },
 *   onPageChange: (page: number) => void
 * }} props
 */
const Pagination = ({ meta, onPageChange }) => {
  if (!meta || meta.totalPages <= 1) return null;

  const { page, totalPages, hasNext, hasPrev } = meta;

  const btnStyle = (disabled, active) => ({
    padding: '0.375rem 0.75rem', border: '1px solid', borderRadius: '0.375rem',
    cursor: disabled ? 'not-allowed' : 'pointer', fontWeight: active ? 600 : 400,
    background: active ? '#4f46e5' : 'var(--bg-surface)',
    borderColor: active ? '#4f46e5' : 'var(--border-default)',
    color: active ? '#fff' : disabled ? 'var(--text-secondary)' : 'var(--text-primary)',
    opacity: disabled ? 0.6 : 1,
    fontSize: '0.875rem',
  });

  // Hiển thị trang xung quanh trang hiện tại
  const pages = [];
  const delta = 2;
  for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) {
    pages.push(i);
  }

  return (
    <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
      <button style={btnStyle(!hasPrev)} disabled={!hasPrev} onClick={() => onPageChange(page - 1)}>
        ‹ Trước
      </button>

      {pages[0] > 1 && (
        <>
          <button style={btnStyle(false, page === 1)} onClick={() => onPageChange(1)}>1</button>
          {pages[0] > 2 && <span style={{ padding: '0 4px', color: '#9ca3af' }}>…</span>}
        </>
      )}

      {pages.map((p) => (
        <button key={p} style={btnStyle(false, p === page)} onClick={() => onPageChange(p)}>
          {p}
        </button>
      ))}

      {pages.at(-1) < totalPages && (
        <>
          {pages.at(-1) < totalPages - 1 && <span style={{ padding: '0 4px', color: '#9ca3af' }}>…</span>}
          <button style={btnStyle(false, page === totalPages)} onClick={() => onPageChange(totalPages)}>
            {totalPages}
          </button>
        </>
      )}

      <button style={btnStyle(!hasNext)} disabled={!hasNext} onClick={() => onPageChange(page + 1)}>
        Sau ›
      </button>
    </div>
  );
};

export default Pagination;

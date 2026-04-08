const cardStyle = {
  flex: '1 1 180px',
  background: 'var(--bg-surface)',
  border: '1px solid var(--border-default)',
  borderRadius: '0.9rem',
  padding: '1rem',
  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.04)',
};

const AnalyticsSummaryCards = ({ tongBai = 0, diemTrungBinh = 0, diemCaoNhat = 0, soLuongDat = 0 }) => {
  return (
    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
      <div style={cardStyle}>
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Tong bai nop</p>
        <p style={{ margin: '0.4rem 0 0', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{tongBai}</p>
      </div>
      <div style={cardStyle}>
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Diem trung binh</p>
        <p style={{ margin: '0.4rem 0 0', fontSize: '1.5rem', fontWeight: 700, color: '#4f46e5' }}>
          {Number(diemTrungBinh || 0).toFixed(2)}
        </p>
      </div>
      <div style={cardStyle}>
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Diem cao nhat</p>
        <p style={{ margin: '0.4rem 0 0', fontSize: '1.5rem', fontWeight: 700, color: '#0f766e' }}>
          {Number(diemCaoNhat || 0).toFixed(2)}
        </p>
      </div>
      <div style={cardStyle}>
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>So luong dat (&gt;=5)</p>
        <p style={{ margin: '0.4rem 0 0', fontSize: '1.5rem', fontWeight: 700, color: '#166534' }}>{soLuongDat}</p>
      </div>
    </div>
  );
};

export default AnalyticsSummaryCards;

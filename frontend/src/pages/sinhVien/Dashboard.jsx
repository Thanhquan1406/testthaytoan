/**
 * @fileoverview Dashboard Sinh viên - tổng quan lớp và lịch sử thi.
 */

import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getPhongThi } from '../../services/lopHocService';
import { layLichSuThi } from '../../services/thiService';
import useAuth from '../../hooks/useAuth';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: lopHocs } = useQuery({ queryKey: ['sv-lop'], queryFn: getPhongThi });
  const { data: lichSu } = useQuery({ queryKey: ['sv-lich-su', 1], queryFn: () => layLichSuThi(1) });

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Xin chào, {user?.ten}! 🎓</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Chào mừng bạn trở lại</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Lớp học', value: lopHocs?.length || 0, icon: '🏫', color: '#4f46e5' },
          { label: 'Lượt đã thi', value: lichSu?.meta?.total || 0, icon: '✅', color: '#059669' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: '0.75rem', boxShadow: 'var(--shadow)', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '4px' }}>{icon}</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/sinh-vien/phong-thi')} style={{ padding: '0.6rem 1.25rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 500 }}>
          🚪 Vào phòng thi
        </button>
        <button onClick={() => navigate('/sinh-vien/lich-su')} style={{ padding: '0.6rem 1.25rem', background: 'var(--bg-surface-muted)', color: 'var(--text-primary)', border: '1px solid var(--border-default)', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 500 }}>
          📋 Lịch sử thi
        </button>
        <button onClick={() => navigate('/thi-mo')} style={{ padding: '0.6rem 1.25rem', background: 'var(--bg-surface-muted)', color: 'var(--text-primary)', border: '1px solid var(--border-default)', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 500 }}>
          🔗 Thi qua link
        </button>
      </div>

      <div style={{ background: 'var(--bg-surface)', borderRadius: '0.75rem', padding: '1.5rem', boxShadow: 'var(--shadow)' }}>
        <h2 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '1rem' }}>📚 Lớp học của tôi</h2>
        {lopHocs?.length ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
            {lopHocs.map((l) => (
              <div key={l._id} onClick={() => navigate(`/sinh-vien/phong-thi/${l._id}`)}
                style={{ padding: '1rem', background: 'var(--bg-surface-muted)', borderRadius: '0.5rem', cursor: 'pointer', border: '1px solid var(--border-default)' }}>
                <div style={{ fontWeight: 600 }}>{l.ten}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>GV: {l.giaoVienId?.ho} {l.giaoVienId?.ten}</div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>Bạn chưa tham gia lớp học nào</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

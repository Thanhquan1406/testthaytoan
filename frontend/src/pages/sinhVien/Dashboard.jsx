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
      <p style={{ color: '#6b7280', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Chào mừng bạn trở lại</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Lớp học', value: lopHocs?.length || 0, icon: '🏫', color: '#4f46e5' },
          { label: 'Lượt đã thi', value: lichSu?.meta?.total || 0, icon: '✅', color: '#059669' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} style={{ background: '#fff', padding: '1.25rem', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '4px' }}>{icon}</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/sinh-vien/phong-thi')} style={{ padding: '0.6rem 1.25rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 500 }}>
          🚪 Vào phòng thi
        </button>
        <button onClick={() => navigate('/sinh-vien/lich-su')} style={{ padding: '0.6rem 1.25rem', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 500 }}>
          📋 Lịch sử thi
        </button>
        <button onClick={() => navigate('/thi-mo')} style={{ padding: '0.6rem 1.25rem', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 500 }}>
          🔗 Thi qua link
        </button>
      </div>

      <div style={{ background: '#fff', borderRadius: '0.75rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '1rem' }}>📚 Lớp học của tôi</h2>
        {lopHocs?.length ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
            {lopHocs.map((l) => (
              <div key={l._id} onClick={() => navigate(`/sinh-vien/phong-thi/${l._id}`)}
                style={{ padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem', cursor: 'pointer', border: '1px solid #e5e7eb' }}>
                <div style={{ fontWeight: 600 }}>{l.ten}</div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>GV: {l.giaoVienId?.ho} {l.giaoVienId?.ten}</div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#9ca3af', textAlign: 'center', padding: '1rem' }}>Bạn chưa tham gia lớp học nào</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

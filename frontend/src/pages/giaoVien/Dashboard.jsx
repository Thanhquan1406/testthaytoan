/**
 * @fileoverview Dashboard Giáo viên - tổng quan đề thi và lớp học.
 */

import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getDanhSach } from '../../services/deThiService';
import { getDanhSach as getDanhSachLop } from '../../services/lopHocService';
import useAuth from '../../hooks/useAuth';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: deThiData, isLoading: loadDeThi } = useQuery({
    queryKey: ['gv-de-thi-recent'],
    queryFn: () => getDanhSach({ limit: 5 }),
  });

  const { data: lopHocs, isLoading: loadLop } = useQuery({
    queryKey: ['gv-lop-hoc'],
    queryFn: getDanhSachLop,
  });

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
        Xin chào, {user?.ho} {user?.ten}! 👋
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        Đây là tổng quan hoạt động của bạn
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {/* Đề thi gần đây */}
        <div style={{ background: 'var(--bg-surface)', borderRadius: '0.75rem', padding: '1.5rem', boxShadow: 'var(--shadow)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontWeight: 600, fontSize: '1rem' }}>📄 Đề thi gần đây</h2>
            <button onClick={() => navigate('/giao-vien/de-thi')} style={{ fontSize: '0.8rem', color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer' }}>Xem tất cả →</button>
          </div>
          {loadDeThi ? <LoadingSpinner size="sm" /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {deThiData?.data?.slice(0, 5).map((d) => (
                <div key={d._id} style={{ padding: '0.625rem', background: 'var(--bg-surface-muted)', borderRadius: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{d.ten}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{d.monHocId?.ten} • {d.thoiGianPhut} phút</div>
                  </div>
                </div>
              ))}
              {(!deThiData?.data?.length) && <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.875rem' }}>Chưa có đề thi nào</p>}
            </div>
          )}
        </div>

        {/* Lớp học */}
        <div style={{ background: 'var(--bg-surface)', borderRadius: '0.75rem', padding: '1.5rem', boxShadow: 'var(--shadow)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontWeight: 600, fontSize: '1rem' }}>🏫 Lớp học</h2>
            <button onClick={() => navigate('/giao-vien/lop-hoc')} style={{ fontSize: '0.8rem', color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer' }}>Xem tất cả →</button>
          </div>
          {loadLop ? <LoadingSpinner size="sm" /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {lopHocs?.slice(0, 5).map((l) => (
                <div key={l._id} style={{ padding: '0.625rem', background: 'var(--bg-surface-muted)', borderRadius: '0.5rem' }}>
                  <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{l.ten}</div>
                </div>
              ))}
              {!lopHocs?.length && <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.875rem' }}>Chưa có lớp học nào</p>}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {[
          { label: '+ Tạo đề thi', path: '/giao-vien/de-thi', bg: '#4f46e5' },
          { label: '📚 Ngân hàng câu hỏi', path: '/giao-vien/ngan-hang', bg: '#0891b2' },
          { label: '👥 Tạo lớp học', path: '/giao-vien/lop-hoc', bg: '#059669' },
          { label: '📊 Xem kết quả', path: '/giao-vien/ket-qua', bg: '#7c3aed' },
        ].map(({ label, path, bg }) => (
          <button key={path} onClick={() => navigate(path)} style={{ padding: '0.6rem 1.25rem', background: bg, color: '#fff', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 500 }}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;

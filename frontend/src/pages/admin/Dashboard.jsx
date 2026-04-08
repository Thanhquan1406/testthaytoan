/**
 * @fileoverview Dashboard Admin - thống kê hệ thống.
 */

import { useQuery } from '@tanstack/react-query';
import { getDashboard } from '../../services/adminService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const StatCard = ({ icon, label, value, color }) => (
  <div style={{
    background: 'var(--bg-surface)', borderRadius: '0.75rem', padding: '1.5rem',
    boxShadow: 'var(--shadow)', border: `3px solid ${color}20`,
    display: 'flex', alignItems: 'center', gap: '1rem',
  }}>
    <div style={{ fontSize: '2.5rem', background: `${color}20`, borderRadius: '50%', width: 60, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
    <div>
      <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{label}</div>
      <div style={{ fontSize: '2rem', fontWeight: 700, color }}>{value?.toLocaleString() ?? '...'}</div>
    </div>
  </div>
);

const Dashboard = () => {
  const { data, isLoading, error } = useQuery({ queryKey: ['admin-dashboard'], queryFn: getDashboard });

  if (isLoading) return <LoadingSpinner size="lg" />;
  if (error) return <div style={{ color: '#ef4444' }}>Lỗi: {error.message}</div>;

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
        Dashboard Quản trị
      </h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <StatCard icon="👨‍🎓" label="Sinh viên" value={data?.tongSinhVien} color="#4f46e5" />
        <StatCard icon="👨‍🏫" label="Giáo viên" value={data?.tongGiaoVien} color="#0891b2" />
        <StatCard icon="📄" label="Đề thi" value={data?.tongDeThi} color="#059669" />
        <StatCard icon="❓" label="Câu hỏi" value={data?.tongCauHoi} color="#d97706" />
        <StatCard icon="✅" label="Lượt thi" value={data?.tongLuotThi} color="#7c3aed" />
      </div>
    </div>
  );
};

export default Dashboard;

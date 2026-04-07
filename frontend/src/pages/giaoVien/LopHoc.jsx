/**
 * @fileoverview Quản lý lớp học (Giáo viên).
 */
import { useQuery } from '@tanstack/react-query';
import { getDanhSach } from '../../services/lopHocService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const LopHoc = () => {
  const { data, isLoading } = useQuery({ queryKey: ['gv-lop-hoc'], queryFn: getDanhSach });
  if (isLoading) return <LoadingSpinner />;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Quản lý lớp học</h1>
        <button style={{ padding: '0.5rem 1.25rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>+ Tạo lớp</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
        {data?.map((l) => (
          <div key={l._id} style={{ background: '#fff', padding: '1.25rem', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{l.ten}</h3>
            <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>Ngày tạo: {new Date(l.thoiGianTao).toLocaleDateString('vi')}</p>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
              <button style={{ flex: 1, padding: '5px', background: '#dbeafe', color: '#1d4ed8', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8rem' }}>Chi tiết</button>
              <button style={{ flex: 1, padding: '5px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8rem' }}>Xóa</button>
            </div>
          </div>
        ))}
        {!data?.length && <p style={{ color: '#9ca3af', gridColumn: '1/-1', textAlign: 'center', padding: '2rem' }}>Chưa có lớp học nào</p>}
      </div>
    </div>
  );
};
export default LopHoc;
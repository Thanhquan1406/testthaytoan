/**
 * @fileoverview Quản lý đề thi (Giáo viên) - CRUD, soft-delete, link công khai.
 * TODO: Implement full UI dựa theo deThiService.js
 */
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getDanhSach } from '../../services/deThiService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const DeThi = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ['gv-de-thi'], queryFn: () => getDanhSach({}) });
  if (isLoading) return <LoadingSpinner />;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Quản lý đề thi</h1>
        <button style={{ padding: '0.5rem 1.25rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>+ Tạo đề thi</button>
      </div>
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {data?.data?.map((d) => (
          <div key={d._id} style={{ background: '#fff', padding: '1rem 1.25rem', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600 }}>{d.ten}</div>
              <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{d.monHocId?.ten} • {d.thoiGianPhut} phút • {d.cauHois?.length || 0} câu</div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button style={{ padding: '4px 12px', background: '#dbeafe', color: '#1d4ed8', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}>Sửa</button>
              <button style={{ padding: '4px 12px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}>Xóa</button>
            </div>
          </div>
        ))}
        {!data?.data?.length && <p style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>Chưa có đề thi nào. Tạo đề thi đầu tiên!</p>}
      </div>
    </div>
  );
};
export default DeThi;
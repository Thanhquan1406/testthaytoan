/**
 * @fileoverview Ngân hàng câu hỏi (Giáo viên) - CRUD câu hỏi theo chủ đề.
 */
import { useQuery } from '@tanstack/react-query';
import { getDanhSach } from '../../services/cauHoiService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination from '../../components/common/Pagination';
import { useState } from 'react';

const NganHangCauHoi = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({ queryKey: ['gv-cau-hoi', page], queryFn: () => getDanhSach({ page, limit: 10 }) });
  if (isLoading) return <LoadingSpinner />;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Ngân hàng câu hỏi</h1>
        <button style={{ padding: '0.5rem 1.25rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>+ Thêm câu hỏi</button>
      </div>
      <div style={{ background: '#fff', borderRadius: '0.75rem', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              {['Nội dung', 'Chủ đề', 'Loại', 'Độ khó', 'Thao tác'].map(h => (
                <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: '#6b7280' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.data?.map((c) => (
              <tr key={c._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '0.75rem 1rem', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.noiDung}</td>
                <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#6b7280' }}>{c.chuDeId?.ten}</td>
                <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem' }}>{c.loaiCauHoi}</td>
                <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem' }}>{c.doKho}</td>
                <td style={{ padding: '0.75rem 1rem', display: 'flex', gap: '0.5rem' }}>
                  <button style={{ padding: '3px 8px', background: '#dbeafe', color: '#1d4ed8', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.75rem' }}>Sửa</button>
                  <button style={{ padding: '3px 8px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.75rem' }}>Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: '1rem' }}><Pagination meta={data?.meta} onPageChange={setPage} /></div>
    </div>
  );
};
export default NganHangCauHoi;
/**
 * @fileoverview Trang xem danh sách đề thi (Admin).
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDanhSachDeThi, xoaHanDeThi } from '../../services/adminService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination from '../../components/common/Pagination';

const DeThi = () => {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-de-thi', page],
    queryFn: () => getDanhSachDeThi({ page, limit: 10 }),
  });

  const deleteMutation = useMutation({
    mutationFn: xoaHanDeThi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-de-thi'] }),
  });

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '1.5rem' }}>Quản lý đề thi</h1>

      {isLoading ? <LoadingSpinner /> : (
        <>
          <div style={{ background: '#fff', borderRadius: '0.75rem', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  {['Tên đề thi', 'Môn học', 'Giáo viên', 'Trạng thái', 'Thao tác'].map(h => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data?.data?.map((d) => (
                  <tr key={d._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{d.ten}</td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>{d.monHocId?.ten || '—'}</td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>{d.nguoiDungId?.hoTen || '—'}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600,
                        background: d.trangThai === 'CONG_KHAI' ? '#d1fae5' : '#f3f4f6',
                        color: d.trangThai === 'CONG_KHAI' ? '#059669' : '#6b7280',
                      }}>
                        {d.trangThai === 'CONG_KHAI' ? 'Công khai' : 'Nháp'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <button
                        onClick={() => confirm('Xóa vĩnh viễn đề thi này?') && deleteMutation.mutate(d._id)}
                        style={{ padding: '4px 10px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8rem' }}
                      >Xóa hẳn</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <Pagination meta={data?.meta} onPageChange={setPage} />
          </div>
        </>
      )}
    </div>
  );
};

export default DeThi;

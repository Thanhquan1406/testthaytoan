/**
 * @fileoverview Trang xem danh sách đề thi (Admin).
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDanhSachDeThi, getThongKeDeThi, xoaHanDeThi } from '../../services/adminService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination from '../../components/common/Pagination';

const iconWrap = {
  width: 56,
  height: 56,
  borderRadius: '0.65rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

/** Icon trắng 24px trong ô màu */
const IcDeThi = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="14 2 14 8 20 8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="8" y1="13" x2="16" y2="13" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    <line x1="8" y1="17" x2="14" y2="17" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const IcNhap = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M12 20h9" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IcCongKhai = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="2" />
    <line x1="2" y1="12" x2="22" y2="12" stroke="#fff" strokeWidth="2" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="#fff" strokeWidth="2" />
  </svg>
);
const IcGiangVien = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
    <rect x="2" y="7" width="20" height="14" rx="2" stroke="#fff" strokeWidth="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    <line x1="12" y1="11" x2="12" y2="11.01" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const DeThiStatCard = ({ Icon, value, label, bg }) => (
  <div
    style={{
      background: '#fff',
      borderRadius: '0.75rem',
      padding: '1.25rem 1.35rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      flex: '1 1 0',
      minWidth: '200px',
    }}
  >
    <div style={{ ...iconWrap, background: bg }}>
      <Icon />
    </div>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', lineHeight: 1.15 }}>
        {value?.toLocaleString?.('vi-VN') ?? '0'}
      </div>
      <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '4px', fontWeight: 500 }}>{label}</div>
    </div>
  </div>
);

const DeThi = () => {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-de-thi-thong-ke'],
    queryFn: getThongKeDeThi,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-de-thi', page],
    queryFn: () => getDanhSachDeThi({ page, limit: 10 }),
  });

  const deleteMutation = useMutation({
    mutationFn: xoaHanDeThi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-de-thi'] });
      queryClient.invalidateQueries({ queryKey: ['admin-de-thi-thong-ke'] });
    },
  });

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '1.25rem' }}>Quản lý đề thi</h1>

      {statsLoading ? (
        <div style={{ marginBottom: '1.5rem' }}>
          <LoadingSpinner />
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <DeThiStatCard Icon={IcDeThi} value={stats?.tongDeThi} label="Tổng đề thi" bg="#7c3aed" />
          <DeThiStatCard Icon={IcNhap} value={stats?.deNhap} label="Đề nháp" bg="#ea580c" />
          <DeThiStatCard Icon={IcCongKhai} value={stats?.congKhai} label="Công khai" bg="#059669" />
          <DeThiStatCard Icon={IcGiangVien} value={stats?.soGiangVien} label="Giảng viên" bg="#2563eb" />
        </div>
      )}

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
                        type="button"
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

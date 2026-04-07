/**
 * @fileoverview Lịch sử thi của Sinh viên.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const LichSuThi = () => {
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['sv-lich-su', page],
    queryFn: () => api.get('/sinh-vien/lich-su-thi', { params: { page, limit: 10 } }).then((r) => r),
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Lịch sử thi</h1>

      {data?.data?.length ? (
        <>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {data.data.map((p) => (
              <div key={p._id} style={{ background: '#fff', padding: '1.25rem', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{p.deThiId?.ten || 'Đề thi'}</h3>
                  <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                    Nộp lúc: {new Date(p.thoiGianNop).toLocaleString('vi')} •  {p.deThiId?.thoiGianPhut} phút
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.5rem', color: (p.ketQua?.tongDiem || 0) >= 5 ? '#059669' : '#dc2626' }}>
                    {p.ketQua?.tongDiem?.toFixed(2) ?? '—'}
                  </div>
                  <button
                    onClick={() => navigate(`/sinh-vien/lich-su/${p._id}`)}
                    style={{ fontSize: '0.75rem', color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer', marginTop: '4px' }}
                  >
                    Xem chi tiết →
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '1rem' }}>
            <Pagination meta={data?.meta} onPageChange={setPage} />
          </div>
        </>
      ) : (
        <div style={{ background: '#fff', padding: '3rem', borderRadius: '0.75rem', textAlign: 'center', color: '#9ca3af', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
          <p>Bạn chưa thi lần nào. Vào phòng thi để bắt đầu!</p>
        </div>
      )}
    </div>
  );
};

export default LichSuThi;

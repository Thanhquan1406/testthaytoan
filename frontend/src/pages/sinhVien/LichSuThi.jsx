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

  const { data, isLoading, error } = useQuery({
    queryKey: ['sv-lich-su', page],
    queryFn: () => api.get('/sinh-vien/lich-su-thi', { params: { page, limit: 10 } }),
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div style={{ padding: '2rem', color: '#ef4444' }}>Không tải được lịch sử thi: {error.message}</div>;

  const historyItems = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
  const meta = data?.meta || {};

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Lịch sử thi</h1>

      {historyItems.length ? (
        <>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {historyItems.map((p) => {
              const anDiem = p.anDiem;
              const choPhepXemDapAn = p.choPhepXemDapAn !== false;
              return (
                <div key={p._id} style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: '0.75rem', boxShadow: 'var(--shadow)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{p.deThiId?.ten || 'Đề thi'}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Nộp lúc: {new Date(p.thoiGianNop).toLocaleString('vi')} • {p.deThiId?.thoiGianPhut} phút
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {anDiem ? (
                      <div style={{ fontSize: '0.8125rem', color: '#92400e', background: '#fef9c3', padding: '4px 10px', borderRadius: '0.375rem', fontWeight: 500 }}>
                        🔒 Chưa công bố điểm
                      </div>
                    ) : (
                      <div style={{ fontWeight: 800, fontSize: '1.5rem', color: (p.ketQua?.tongDiem || 0) >= 5 ? '#059669' : '#dc2626' }}>
                        {p.ketQua?.tongDiem?.toFixed(2) ?? '—'}
                      </div>
                    )}
                    {choPhepXemDapAn && (
                      <button
                        onClick={() => navigate(`/sinh-vien/lich-su/${p._id}`)}
                        style={{ fontSize: '0.75rem', color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer', marginTop: '4px' }}
                      >
                        Xem chi tiết →
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: '1rem' }}>
            <Pagination meta={meta} onPageChange={setPage} />
          </div>
        </>
      ) : (
        <div style={{ background: 'var(--bg-surface)', padding: '3rem', borderRadius: '0.75rem', textAlign: 'center', color: 'var(--text-secondary)', boxShadow: 'var(--shadow)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
          <p>Bạn chưa thi lần nào. Vào phòng thi để bắt đầu!</p>
        </div>
      )}
    </div>
  );
};

export default LichSuThi;

/**
 * @fileoverview Trang kết quả sau khi nộp bài.
 */

import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getKetQua } from '../../services/thiService';

const KetQua = () => {
  const { phienThiId } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['sv-ket-qua', phienThiId],
    queryFn: () => getKetQua(phienThiId),
  });

  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>Đang tải kết quả...</div>;
  if (error) return <div style={{ padding: '2rem', color: '#ef4444' }}>Lỗi: {error.message}</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ background: '#fff', borderRadius: '1rem', padding: '2.5rem 2rem', maxWidth: '480px', width: '100%', textAlign: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{data?.tongDiem >= 5 ? '🎉' : '😔'}</div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1e1b4b' }}>
          {data?.tongDiem >= 5 ? 'Chúc mừng!' : 'Tiếp tục cố gắng!'}
        </h1>
        <p style={{ color: '#6b7280', marginBottom: '2rem' }}>{data?.deThi?.ten}</p>

        <div style={{ background: '#f9fafb', borderRadius: '0.75rem', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '3.5rem', fontWeight: 800, color: data?.tongDiem >= 5 ? '#059669' : '#dc2626' }}>
            {data?.tongDiem?.toFixed(2) ?? '—'}
          </div>
          <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>điểm / 10</div>
          {data?.soCauDung !== undefined && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#374151' }}>
              {data.soCauDung}/{data.tongSoCau} câu đúng
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/sinh-vien')} style={{ padding: '0.6rem 1.25rem', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 500 }}>
            Về trang chủ
          </button>
          {data?.deThi?.choPhepXemLai && (
            <Link to={`/sinh-vien/lich-su/${phienThiId}`} style={{ padding: '0.6rem 1.25rem', background: '#4f46e5', color: '#fff', textDecoration: 'none', borderRadius: '0.5rem', fontWeight: 500 }}>
              Xem chi tiết bài làm
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default KetQua;

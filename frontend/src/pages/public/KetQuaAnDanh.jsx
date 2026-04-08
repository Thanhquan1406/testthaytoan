/**
 * @fileoverview Trang kết quả thi ẩn danh (sau khi nộp bài qua link công khai).
 */

import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getKetQuaAnDanh } from '../../services/thiService';

const cheDoLabel = {
  KHONG: 'Giáo viên đã tắt hiển thị điểm cho đề thi này.',
  TAT_CA_XONG: 'Điểm sẽ được công bố sau khi tất cả thí sinh hoàn thành bài thi.',
};

const KetQuaAnDanh = () => {
  const { phienThiId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const token = sessionStorage.getItem('anon_token');

  const fromSubmit = state?.ketQua;

  const { data: fetched, isLoading, error } = useQuery({
    queryKey: ['anon-ket-qua', phienThiId],
    queryFn: () => getKetQuaAnDanh(phienThiId, token),
    enabled: !fromSubmit && !!token,
  });

  const data = fromSubmit || fetched;
  const loading = !fromSubmit && isLoading;

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>Đang tải kết quả...</div>;
  if (!fromSubmit && error) return <div style={{ padding: '2rem', color: '#ef4444' }}>Lỗi: {error.message}</div>;

  const anDiem = data?.anDiem;
  const choPhepXemDapAn = data?.choPhepXemDapAn;

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ background: '#fff', borderRadius: '1rem', padding: '2.5rem 2rem', maxWidth: '480px', width: '100%', textAlign: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>

        {anDiem ? (
          <>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📝</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1e1b4b' }}>
              Bạn đã nộp bài!
            </h1>
            <div style={{ background: '#fef9c3', borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1.5rem', border: '1px solid #fde68a' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🔒</div>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#92400e', lineHeight: 1.5 }}>
                {cheDoLabel[data?.cheDoXemDiem] || 'Điểm chưa được công bố.'}
              </p>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{data?.tongDiem >= 5 ? '🎉' : '😔'}</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1e1b4b' }}>
              {data?.tongDiem >= 5 ? 'Chúc mừng!' : 'Tiếp tục cố gắng!'}
            </h1>

            <div style={{ background: '#f9fafb', borderRadius: '0.75rem', padding: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '3.5rem', fontWeight: 800, color: data?.tongDiem >= 5 ? '#059669' : '#dc2626' }}>
                {data?.tongDiem?.toFixed(2) ?? '—'}
              </div>
              <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>điểm / 10</div>
              {data?.soCauDung != null && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#374151' }}>
                  {data.soCauDung}/{data.tongSoCau} câu đúng
                </div>
              )}
            </div>
          </>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/thi-mo')}
            style={{ padding: '0.6rem 1.25rem', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 500 }}
          >
            Quay lại
          </button>
          {choPhepXemDapAn && token && (
            <button
              onClick={() => navigate(`/chi-tiet-an-danh/${phienThiId}`)}
              style={{ padding: '0.6rem 1.25rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 500 }}
            >
              Xem chi tiết bài làm
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default KetQuaAnDanh;

/**
 * @fileoverview Trang kết quả sau khi nộp bài.
 */

import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getKetQua } from '../../services/thiService';

const cheDoLabel = {
  KHONG: 'Giáo viên đã tắt hiển thị điểm cho đề thi này.',
  TAT_CA_XONG: 'Điểm sẽ được công bố sau khi tất cả thí sinh hoàn thành bài thi.',
};

const cheDoLabelDapAn = {
  KHONG: 'Giáo viên không cho phép xem đáp án.',
  TAT_CA_XONG: 'Đáp án sẽ được mở sau khi tất cả thí sinh hoàn thành.',
  DAT_DIEM: 'Bạn chưa đạt đủ điểm yêu cầu để xem đáp án.',
};

const KetQua = () => {
  const { phienThiId } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['sv-ket-qua', phienThiId],
    queryFn: () => getKetQua(phienThiId),
  });

  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>Đang tải kết quả...</div>;
  if (error) return <div style={{ padding: '2rem', color: '#ef4444' }}>Lỗi: {error.message}</div>;

  const anDiem = data?.anDiem;
  const choPhepXemDapAn = data?.choPhepXemDapAn;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ background: 'var(--bg-surface)', borderRadius: '1rem', padding: '2.5rem 2rem', maxWidth: '480px', width: '100%', textAlign: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>

        {anDiem ? (
          <>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📝</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              Bạn đã nộp bài!
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{data?.deThi?.ten}</p>
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
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              {data?.tongDiem >= 5 ? 'Chúc mừng!' : 'Tiếp tục cố gắng!'}
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>{data?.deThi?.ten}</p>

            <div style={{ background: 'var(--bg-surface-muted)', borderRadius: '0.75rem', padding: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '3.5rem', fontWeight: 800, color: data?.tongDiem >= 5 ? '#059669' : '#dc2626' }}>
                {data?.tongDiem?.toFixed(2) ?? '—'}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>điểm / 10</div>
              {data?.soCauDung !== undefined && data?.soCauDung !== null && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                  {data.soCauDung}/{data.tongSoCau} câu đúng
                </div>
              )}
            </div>
          </>
        )}

        {!choPhepXemDapAn && !anDiem && (
          <div style={{ background: 'var(--bg-surface-muted)', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            {cheDoLabelDapAn[data?.cheDoXemDapAn] || 'Đáp án chưa được mở.'}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/sinh-vien')} style={{ padding: '0.6rem 1.25rem', background: 'var(--bg-surface-muted)', border: '1px solid var(--border-default)', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 500 }}>
            Về trang chủ
          </button>
          {choPhepXemDapAn && (
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

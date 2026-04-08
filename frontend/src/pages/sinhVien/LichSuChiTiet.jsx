/**
 * @fileoverview Xem chi tiết lịch sử bài làm của Sinh viên.
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import QuestionCard from '../../components/exam/QuestionCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const LichSuChiTiet = () => {
  const { phienThiId } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['sv-lich-su-ct', phienThiId],
    queryFn: () => api.get(`/sinh-vien/lich-su-thi/${phienThiId}/chi-tiet`).then((r) => r.data),
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) {
    const is403 = error?.response?.status === 403 || error?.message?.includes('chưa được phép');
    return (
      <div style={{ padding: '2rem' }}>
        <button onClick={() => navigate('/sinh-vien/lich-su')} style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', fontWeight: 500, marginBottom: '1rem' }}>← Lịch sử thi</button>
        <div style={{ background: 'var(--bg-surface)', borderRadius: '0.75rem', padding: '2.5rem', textAlign: 'center', boxShadow: 'var(--shadow)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{is403 ? '🔒' : '❌'}</div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            {is403 ? 'Chưa được phép xem đáp án' : 'Không thể xem bài'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '360px', margin: '0 auto' }}>
            {is403
              ? 'Giáo viên đã cấu hình chưa cho phép xem đáp án bài thi này. Vui lòng quay lại sau hoặc liên hệ giáo viên.'
              : error.message}
          </p>
        </div>
      </div>
    );
  }

  const answers = {};
  data?.cauTraLois?.forEach((c) => { answers[c.cauHoiId] = c.noiDungTraLoi; });
  const cauHois = data?.deThiId?.cauHois?.map((c) => c.cauHoiId).filter(Boolean) || [];

  return (
    <div>
      <button onClick={() => navigate('/sinh-vien/lich-su')} style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', fontWeight: 500, marginBottom: '1rem' }}>← Lịch sử thi</button>
      <div style={{ background: 'var(--bg-surface)', borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1.5rem', boxShadow: 'var(--shadow)' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>{data?.deThiId?.ten}</h1>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          <span>Điểm: <strong style={{ color: '#4f46e5', fontSize: '1.1rem' }}>{data?.ketQua?.tongDiem?.toFixed(2)}</strong></span>
          <span>Nộp: {data?.thoiGianNop ? new Date(data.thoiGianNop).toLocaleString('vi') : '—'}</span>
          <span>Vi phạm: {data?.viPhams?.length || 0}</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {cauHois.map((cau, i) => (
          <QuestionCard
            key={cau._id}
            cauHoi={cau}
            soThuTu={i + 1}
            selectedAnswer={answers[cau._id] || null}
            onAnswer={() => {}}
            readonly={true}
          />
        ))}
      </div>
    </div>
  );
};

export default LichSuChiTiet;

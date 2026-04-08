/**
 * @fileoverview Giáo viên xem chi tiết bài làm của sinh viên.
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { xemBaiThi } from '../../services/ketQuaService';
import QuestionCard from '../../components/exam/QuestionCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const XemBaiThi = () => {
  const { phienThiId } = useParams();
  const navigate = useNavigate();

  const { data: phienThi, isLoading, error } = useQuery({
    queryKey: ['gv-xem-bai', phienThiId],
    queryFn: () => xemBaiThi(phienThiId),
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div style={{ color: '#ef4444', padding: '2rem' }}>Lỗi: {error.message}</div>;

  const answers = {};
  phienThi?.cauTraLois?.forEach((c) => { answers[c.cauHoiId] = c.noiDungTraLoi; });

  const cauHois = phienThi?.deThiId?.cauHois?.map((c) => c.cauHoiId).filter(Boolean) || [];

  return (
    <div>
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', fontWeight: 500, marginBottom: '1rem', fontSize: '0.9rem' }}>
        ← Quay lại
      </button>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        Bài làm của: {phienThi?.nguoiDungId ? `${phienThi.nguoiDungId.ho} ${phienThi.nguoiDungId.ten}` : 'Ẩn danh'}
      </h1>
      <div style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        Điểm: <strong style={{ color: '#4f46e5' }}>{phienThi?.ketQua?.tongDiem?.toFixed(2) ?? '—'}</strong> •
        Nộp lúc: {phienThi?.thoiGianNop ? new Date(phienThi.thoiGianNop).toLocaleString('vi') : '—'} •
        Vi phạm: {phienThi?.viPhams?.length || 0} lần
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {cauHois.map((cau, i) => (
          <QuestionCard
            key={cau._id}
            cauHoi={cau}
            soThuTu={i + 1}
            selectedAnswer={answers[cau._id]}
            onAnswer={() => {}}
            readonly={true}
          />
        ))}
      </div>
    </div>
  );
};

export default XemBaiThi;

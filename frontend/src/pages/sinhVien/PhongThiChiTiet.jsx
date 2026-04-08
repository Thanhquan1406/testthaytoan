/**
 * @fileoverview Chi tiết phòng thi - danh sách đề thi trong lớp.
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getPhongThiChiTiet, getDeThibyLop } from '../../services/lopHocService';
import { batDau } from '../../services/thiService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const PhongThiChiTiet = () => {
  const { lopId } = useParams();
  const navigate = useNavigate();

  const { data: lop, isLoading: loadLop } = useQuery({
    queryKey: ['sv-lop', lopId],
    queryFn: () => getPhongThiChiTiet(lopId),
  });

  const { data: deThi, isLoading: loadDe } = useQuery({
    queryKey: ['sv-lop-de-thi', lopId],
    queryFn: () => getDeThibyLop(lopId),
  });

  const batDauMutation = useMutation({
    mutationFn: (deThiId) => batDau(deThiId, lopId),
    onSuccess: (data) => navigate(`/sinh-vien/lam-bai/${data.phienThiId}`),
  });

  if (loadLop) return <LoadingSpinner />;

  return (
    <div>
      <button onClick={() => navigate('/sinh-vien/phong-thi')} style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', fontWeight: 500, marginBottom: '1rem' }}>← Phòng thi</button>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>{lop?.ten}</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>GV: {lop?.giaoVienId?.ho} {lop?.giaoVienId?.ten}</p>

      {loadDe ? <LoadingSpinner size="sm" /> : (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {deThi?.map((d) => (
            <div key={d._id} style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: '0.75rem', boxShadow: 'var(--shadow)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{d.ten}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{d.monHocId?.ten} • {d.thoiGianPhut} phút • {d.cauHois?.length || '?'} câu</p>
                {d.thoiGianDong && (
                  <p style={{ fontSize: '0.75rem', color: new Date(d.thoiGianDong) < new Date() ? '#dc2626' : '#d97706', marginTop: '2px' }}>
                    Hết hạn: {new Date(d.thoiGianDong).toLocaleString('vi')}
                  </p>
                )}
              </div>
              <button
                onClick={() => batDauMutation.mutate(d._id)}
                disabled={batDauMutation.isPending || !d.cauHois?.length}
                style={{
                  padding: '0.5rem 1.25rem',
                  background: d.cauHois?.length ? '#4f46e5' : '#9ca3af',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: batDauMutation.isPending || !d.cauHois?.length ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                {batDauMutation.isPending ? 'Đang vào...' : d.cauHois?.length ? 'Vào thi →' : 'Chưa có câu hỏi'}
              </button>
            </div>
          ))}
          {!deThi?.length && <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem', background: 'var(--bg-surface)', borderRadius: '0.75rem' }}>Chưa có đề thi nào được xuất bản trong lớp này</p>}
        </div>
      )}
    </div>
  );
};

export default PhongThiChiTiet;

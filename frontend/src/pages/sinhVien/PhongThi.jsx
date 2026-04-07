/**
 * @fileoverview Phòng thi - danh sách lớp học của sinh viên.
 */

import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getPhongThi } from '../../services/lopHocService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const PhongThi = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ['sv-lop'], queryFn: getPhongThi });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Phòng thi</h1>
      {data?.length ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
          {data.map((l) => (
            <div
              key={l._id}
              onClick={() => navigate(`/sinh-vien/phong-thi/${l._id}`)}
              style={{ background: '#fff', padding: '1.5rem', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', cursor: 'pointer', border: '2px solid transparent', transition: 'all 0.15s' }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#4f46e5'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏫</div>
              <h3 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>{l.ten}</h3>
              <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>GV: {l.giaoVienId?.ho} {l.giaoVienId?.ten}</p>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px' }}>
                {new Date(l.thoiGianTao).toLocaleDateString('vi')}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background: '#fff', padding: '3rem', borderRadius: '0.75rem', textAlign: 'center', color: '#9ca3af', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏫</div>
          <p>Bạn chưa tham gia lớp học nào. Hãy liên hệ giáo viên để được thêm vào lớp.</p>
        </div>
      )}
    </div>
  );
};

export default PhongThi;

/**
 * @fileoverview Danh sách sinh viên (Giáo viên xem).
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSinhVien } from '../../services/lopHocService';

const SinhVien = () => {
  const [keyword, setKeyword] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['gv-sinh-vien', keyword],
    queryFn: () => getSinhVien(keyword),
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Danh sách sinh viên</h1>
        <input type="text" placeholder="Tìm kiếm..." value={keyword} onChange={(e) => setKeyword(e.target.value)}
          style={{ padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', width: '250px' }} />
      </div>
      <div style={{ background: '#fff', borderRadius: '0.75rem', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              {['Mã SV', 'Họ và tên', 'Email'].map(h => (
                <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: '#6b7280' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.map((sv) => (
              <tr key={sv._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '0.75rem 1rem', color: '#6b7280', fontSize: '0.85rem' }}>{sv.maNguoiDung}</td>
                <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{sv.ho} {sv.ten}</td>
                <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>{sv.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {isLoading && <p style={{ textAlign: 'center', padding: '1rem', color: '#9ca3af' }}>Đang tải...</p>}
        {!isLoading && !data?.length && <p style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>Không tìm thấy sinh viên</p>}
      </div>
    </div>
  );
};

export default SinhVien;

/**
 * @fileoverview Trang xem câu hỏi theo giáo viên (Admin view).
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDanhSachCauHoi } from '../../services/adminService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination from '../../components/common/Pagination';

const LOAI_LABEL = {
  TRAC_NGHIEM: 'Trắc nghiệm',
  DUNG_SAI: 'Đúng/Sai',
  TU_LUAN: 'Tự luận',
};

const DO_KHO_LABEL = {
  NB: 'Nhận biết',
  TH: 'Thông hiểu',
  VH: 'Vận dụng',
};

const CauHoi = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-cau-hoi', page, search],
    queryFn: () => getDanhSachCauHoi({ page, limit: 10, search }),
  });

  const getTenGiaoVien = (cauHoi) => {
    const gv = cauHoi?.nguoiDungId;
    if (!gv) return '—';
    const hoTen = [gv.ho, gv.ten].filter(Boolean).join(' ').trim();
    return hoTen || gv.email || gv.maNguoiDung || '—';
  };

  const getMonHoc = (cauHoi) => (
    cauHoi?.chuDeId?.monHocId?.ten ||
    cauHoi?.nganHangId?.monHocId?.ten ||
    '—'
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>Quản lý câu hỏi</h1>
        <input
          type="text"
          placeholder="Tìm theo nội dung câu hỏi..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', width: '280px' }}
        />
      </div>

      {isLoading ? <LoadingSpinner /> : (
        <>
          <div style={{ background: '#fff', borderRadius: '0.75rem', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  {['Nội dung', 'Môn học', 'Loại', 'Độ khó', 'Giáo viên', 'Ngày tạo'].map((h) => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data?.data?.map((q) => (
                  <tr key={q._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', maxWidth: '420px' }}>
                      <div style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {q.noiDung || '—'}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>{getMonHoc(q)}</td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>{LOAI_LABEL[q.loaiCauHoi] || q.loaiCauHoi || '—'}</td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>{DO_KHO_LABEL[q.doKho] || q.doKho || '—'}</td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>{getTenGiaoVien(q)}</td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#6b7280' }}>
                      {q.thoiGianTao ? new Date(q.thoiGianTao).toLocaleDateString('vi-VN') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!data?.data?.length && (
              <p style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>Chưa có câu hỏi nào.</p>
            )}
          </div>
          <div style={{ marginTop: '1rem' }}>
            <Pagination meta={data?.meta} onPageChange={setPage} />
          </div>
        </>
      )}
    </div>
  );
};

export default CauHoi;

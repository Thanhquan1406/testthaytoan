/**
 * @fileoverview Trang xem câu hỏi theo giáo viên (Admin view).
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDanhSachCauHoi } from '../../services/adminService';
import Pagination from '../../components/common/Pagination';
import MathText from '../../components/common/MathText';
import { SkeletonTable } from '../../components/common/Skeleton';

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
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Quản lý câu hỏi</h1>
        <input
          type="text"
          placeholder="Tìm theo nội dung câu hỏi..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--border-default)', borderRadius: '0.5rem', width: '280px' }}
        />
      </div>

      {isLoading ? <SkeletonTable rows={8} cols={6} /> : (
        <>
          <div style={{ background: 'var(--bg-surface)', borderRadius: '0.75rem', overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-surface-muted)', borderBottom: '1px solid var(--border-default)' }}>
                  {['Nội dung', 'Môn học', 'Loại', 'Độ khó', 'Giáo viên', 'Ngày tạo'].map((h) => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data?.data?.map((q) => (
                  <tr key={q._id} style={{ borderBottom: '1px solid var(--border-default)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', maxWidth: '420px' }}>
                      <div style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        <MathText>{q.noiDung || '—'}</MathText>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>{getMonHoc(q)}</td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>{LOAI_LABEL[q.loaiCauHoi] || q.loaiCauHoi || '—'}</td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>{DO_KHO_LABEL[q.doKho] || q.doKho || '—'}</td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>{getTenGiaoVien(q)}</td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {q.thoiGianTao ? new Date(q.thoiGianTao).toLocaleDateString('vi-VN') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!data?.data?.length && (
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>Chưa có câu hỏi nào.</p>
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

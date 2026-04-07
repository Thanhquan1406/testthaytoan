/**
 * @fileoverview Xem kết quả thi theo đề và lớp (Giáo viên).
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getKetQua, getDanhSachDeThi, getDanhSachLop, capNhatGhiChu } from '../../services/ketQuaService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const KetQua = () => {
  const [deThiId, setDeThiId] = useState('');
  const [lopHocId, setLopHocId] = useState('');
  const queryClient = useQueryClient();

  const { data: deThi } = useQuery({ queryKey: ['gv-ket-qua-de-thi'], queryFn: getDanhSachDeThi });
  const { data: lopHoc } = useQuery({ queryKey: ['gv-ket-qua-lop'], queryFn: getDanhSachLop });

  const { data: ketQua, isLoading } = useQuery({
    queryKey: ['gv-ket-qua', deThiId, lopHocId],
    queryFn: () => getKetQua({ deThiId, lopHocId }),
    enabled: !!deThiId,
  });

  const selectStyle = { padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', background: '#fff', fontSize: '0.875rem' };

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Kết quả thi</h1>

      {/* Filter */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <select value={deThiId} onChange={(e) => setDeThiId(e.target.value)} style={selectStyle}>
          <option value="">-- Chọn đề thi --</option>
          {deThi?.map((d) => <option key={d._id} value={d._id}>{d.ten}</option>)}
        </select>
        <select value={lopHocId} onChange={(e) => setLopHocId(e.target.value)} style={selectStyle}>
          <option value="">-- Tất cả lớp --</option>
          {lopHoc?.map((l) => <option key={l._id} value={l._id}>{l.ten}</option>)}
        </select>
      </div>

      {!deThiId && (
        <div style={{ background: '#f9fafb', borderRadius: '0.75rem', padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
          Chọn một đề thi để xem kết quả
        </div>
      )}

      {isLoading && deThiId && <LoadingSpinner />}

      {ketQua && !isLoading && (
        <div style={{ background: '#fff', borderRadius: '0.75rem', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['STT', 'Học viên', 'Lớp', 'Điểm', 'Thời gian nộp', 'Ghi chú', 'Thao tác'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: '#6b7280' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ketQua.map((k, i) => (
                <tr key={k._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '0.75rem 1rem', color: '#6b7280' }}>{i + 1}</td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>
                    {k.nguoiDungId ? `${k.nguoiDungId.ho} ${k.nguoiDungId.ten}` : k.hoTenAnDanh || 'Ẩn danh'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#6b7280' }}>{k.lopHocId?.ten || '—'}</td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#4f46e5' }}>{k.ketQua?.tongDiem?.toFixed(2) ?? '—'}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#6b7280' }}>
                    {k.thoiGianNop ? new Date(k.thoiGianNop).toLocaleString('vi') : '—'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem' }}>{k.ketQua?.ghiChu || '—'}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <button style={{ padding: '3px 8px', background: '#dbeafe', color: '#1d4ed8', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.75rem' }}>Xem bài</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!ketQua.length && <p style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>Chưa có kết quả nào</p>}
        </div>
      )}
    </div>
  );
};

export default KetQua;

/**
 * @fileoverview Theo dõi phiên thi real-time (Giáo viên giám sát).
 * Phase 1: snapshot tĩnh (polling). Phase 2: Socket.io realtime.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const TRANG_THAI_COLORS = {
  DANG_THI: '#059669', DA_NOP_BAI: '#4f46e5',
  CHUA_VAO_THI: '#9ca3af', DA_VAO_CHUA_NOP: '#d97706',
};
const TRANG_THAI_LABEL = {
  DANG_THI: 'Đang thi', DA_NOP_BAI: 'Đã nộp',
  CHUA_VAO_THI: 'Chưa vào', DA_VAO_CHUA_NOP: 'Đang làm',
};

const TheoDoi = () => {
  const [deThiId, setDeThiId] = useState('');
  const [refreshInterval, setRefreshInterval] = useState(10000);

  const { data: deThi } = useQuery({
    queryKey: ['gv-theo-doi-de-thi'],
    queryFn: () => api.get('/giao-vien/theo-doi-thi/de-thi').then((r) => r.data),
  });

  const { data: phienThis, isLoading } = useQuery({
    queryKey: ['gv-theo-doi', deThiId],
    queryFn: () => api.get('/giao-vien/theo-doi-thi', { params: { deThiId } }).then((r) => r.data),
    enabled: !!deThiId,
    refetchInterval: refreshInterval,
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Theo dõi thi</h1>
        <select value={refreshInterval} onChange={(e) => setRefreshInterval(Number(e.target.value))} style={{ padding: '0.4rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.8rem' }}>
          <option value={5000}>Tự động làm mới 5s</option>
          <option value={10000}>Tự động làm mới 10s</option>
          <option value={30000}>Tự động làm mới 30s</option>
          <option value={0}>Không tự động</option>
        </select>
      </div>

      <select value={deThiId} onChange={(e) => setDeThiId(e.target.value)} style={{ width: '100%', maxWidth: 400, padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
        <option value="">-- Chọn đề thi để theo dõi --</option>
        {deThi?.map((d) => <option key={d._id} value={d._id}>{d.ten}</option>)}
      </select>

      {!deThiId && <div style={{ background: '#f9fafb', borderRadius: '0.75rem', padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>Chọn đề thi để xem danh sách sinh viên đang thi</div>}
      {isLoading && deThiId && <LoadingSpinner />}

      {phienThis && !isLoading && (
        <div style={{ background: '#fff', borderRadius: '0.75rem', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e5e7eb', color: '#6b7280', fontSize: '0.875rem' }}>
            Tổng: {phienThis.length} phiên • Đang thi: {phienThis.filter(p => p.trangThai === 'DANG_THI').length} • Đã nộp: {phienThis.filter(p => p.trangThai === 'DA_NOP_BAI').length}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['Học viên', 'Lớp', 'Trạng thái', 'Bắt đầu', 'Vi phạm'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: '#6b7280' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {phienThis.map((p) => (
                <tr key={p._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>
                    {p.nguoiDungId ? `${p.nguoiDungId.ho} ${p.nguoiDungId.ten}` : p.hoTenAnDanh || 'Ẩn danh'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#6b7280' }}>{p.lopHocId?.ten || '—'}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, background: `${TRANG_THAI_COLORS[p.trangThai]}20`, color: TRANG_THAI_COLORS[p.trangThai] }}>
                      {TRANG_THAI_LABEL[p.trangThai] || p.trangThai}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#6b7280' }}>
                    {p.thoiGianBatDau ? new Date(p.thoiGianBatDau).toLocaleTimeString('vi') : '—'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {p.soViPham > 0 ? (
                      <span style={{ padding: '2px 8px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, background: '#fee2e2', color: '#dc2626' }}>
                        {p.soViPham} vi phạm
                      </span>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!phienThis.length && <p style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>Chưa có sinh viên nào vào thi</p>}
        </div>
      )}
    </div>
  );
};

export default TheoDoi;

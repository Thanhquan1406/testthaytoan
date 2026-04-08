/**
 * @fileoverview Xem kết quả thi theo đề và lớp (Giáo viên).
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getKetQua, getDanhSachDeThi, getDanhSachLop, capNhatGhiChu } from '../../services/ketQuaService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const KetQua = () => {
  const [deThiId, setDeThiId] = useState('');
  const [lopHocId, setLopHocId] = useState('');
  const [editingNotes, setEditingNotes] = useState({});
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: deThi } = useQuery({ queryKey: ['gv-ket-qua-de-thi'], queryFn: getDanhSachDeThi });
  const { data: lopHoc } = useQuery({ queryKey: ['gv-ket-qua-lop'], queryFn: getDanhSachLop });

  const { data: ketQua, isLoading } = useQuery({
    queryKey: ['gv-ket-qua', deThiId, lopHocId],
    queryFn: () => getKetQua({ deThiId, lopHocId }),
    enabled: !!deThiId,
  });

  const updateGhiChuMutation = useMutation({
    mutationFn: ({ phienThiId, ghiChu }) => capNhatGhiChu(phienThiId, ghiChu),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gv-ket-qua', deThiId, lopHocId] });
    },
  });

  const selectStyle = {
    padding: '0.65rem 0.85rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.7rem',
    background: '#fff',
    fontSize: '0.875rem',
    minWidth: '220px',
    color: '#111827',
  };

  const scoreList = ketQua?.map((item) => item?.ketQua?.tongDiem).filter((score) => typeof score === 'number') ?? [];
  const tongBai = ketQua?.length ?? 0;
  const diemTrungBinh = scoreList.length ? scoreList.reduce((sum, score) => sum + score, 0) / scoreList.length : 0;
  const diemCaoNhat = scoreList.length ? Math.max(...scoreList) : 0;
  const soLuongDat = scoreList.filter((score) => score >= 5).length;

  const formatScore = (score) => (typeof score === 'number' ? score.toFixed(2) : '—');
  const getScorePillStyle = (score) => {
    if (typeof score !== 'number') return { background: '#f3f4f6', color: '#6b7280' };
    if (score >= 8) return { background: '#dcfce7', color: '#166534' };
    if (score >= 5) return { background: '#dbeafe', color: '#1d4ed8' };
    return { background: '#fee2e2', color: '#b91c1c' };
  };

  const statCardStyle = {
    flex: '1 1 220px',
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '0.9rem',
    padding: '1rem',
    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.04)',
  };

  return (
    <div style={{ paddingBottom: '1rem' }}>
      <div
        style={{
          marginBottom: '1.2rem',
          padding: '1.1rem 1.2rem',
          borderRadius: '1rem',
          background: 'linear-gradient(135deg, #1d4ed8, #4338ca)',
          color: '#ffffff',
        }}
      >
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.35rem' }}>Dashboard kết quả thi</h1>
        <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.95 }}>
          Theo dõi kết quả theo đề thi, lớp học và cập nhật ghi chú nhanh cho từng học viên.
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          marginBottom: '1.1rem',
          flexWrap: 'wrap',
          alignItems: 'center',
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '0.9rem',
          padding: '1rem',
        }}
      >
        <select value={deThiId} onChange={(e) => setDeThiId(e.target.value)} style={selectStyle}>
          <option value="">Chọn đề thi</option>
          {deThi?.map((d) => <option key={d._id} value={d._id}>{d.ten}</option>)}
        </select>
        <select value={lopHocId} onChange={(e) => setLopHocId(e.target.value)} style={selectStyle}>
          <option value="">Tất cả lớp</option>
          {lopHoc?.map((l) => <option key={l._id} value={l._id}>{l.ten}</option>)}
        </select>
      </div>

      {!deThiId && (
        <div
          style={{
            background: '#f8fafc',
            borderRadius: '0.9rem',
            border: '1px dashed #cbd5e1',
            padding: '3rem',
            textAlign: 'center',
            color: '#64748b',
          }}
        >
          Chọn một đề thi để xem kết quả
        </div>
      )}

      {isLoading && deThiId && <LoadingSpinner />}

      {ketQua && !isLoading && (
        <div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <div style={statCardStyle}>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>Tổng bài nộp</p>
              <p style={{ margin: '0.4rem 0 0', fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>{tongBai}</p>
            </div>
            <div style={statCardStyle}>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>Điểm trung bình</p>
              <p style={{ margin: '0.4rem 0 0', fontSize: '1.5rem', fontWeight: 700, color: '#4f46e5' }}>{formatScore(diemTrungBinh)}</p>
            </div>
            <div style={statCardStyle}>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>Điểm cao nhất</p>
              <p style={{ margin: '0.4rem 0 0', fontSize: '1.5rem', fontWeight: 700, color: '#0f766e' }}>{formatScore(diemCaoNhat)}</p>
            </div>
            <div style={statCardStyle}>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>Số lượng đạt (>= 5)</p>
              <p style={{ margin: '0.4rem 0 0', fontSize: '1.5rem', fontWeight: 700, color: '#166534' }}>{soLuongDat}</p>
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: '0.9rem', border: '1px solid #e5e7eb', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '920px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                {['STT', 'Học viên', 'Lớp', 'Điểm', 'Thời gian nộp', 'Ghi chú', 'Thao tác'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: '#6b7280' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ketQua.map((k, i) => {
                const currentNote = editingNotes[k._id] ?? k.ketQua?.ghiChu ?? '';
                const score = k.ketQua?.tongDiem;
                const scorePillStyle = getScorePillStyle(score);
                return (
                <tr key={k._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem 1rem', color: '#6b7280' }}>{i + 1}</td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>
                    {k.nguoiDungId ? `${k.nguoiDungId.ho} ${k.nguoiDungId.ten}` : k.hoTenAnDanh || 'Ẩn danh'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#6b7280' }}>{k.lopHocId?.ten || '—'}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        minWidth: '56px',
                        textAlign: 'center',
                        fontWeight: 700,
                        borderRadius: '999px',
                        padding: '0.2rem 0.55rem',
                        fontSize: '0.8rem',
                        ...scorePillStyle,
                      }}
                    >
                      {formatScore(score)}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#6b7280' }}>
                    {k.thoiGianNop ? new Date(k.thoiGianNop).toLocaleString('vi') : '—'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <input
                        value={currentNote}
                        onChange={(e) => setEditingNotes((prev) => ({ ...prev, [k._id]: e.target.value }))}
                        placeholder="Nhập ghi chú"
                        style={{ padding: '0.4rem 0.55rem', border: '1px solid #d1d5db', borderRadius: '0.45rem', minWidth: '180px' }}
                      />
                      <button
                        onClick={() => updateGhiChuMutation.mutate({ phienThiId: k._id, ghiChu: currentNote.trim() })}
                        style={{ padding: '4px 9px', background: '#e0e7ff', color: '#3730a3', border: 'none', borderRadius: '0.45rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                      >
                        Lưu
                      </button>
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <button
                      onClick={() => navigate(`/giao-vien/ket-qua/xem/${k._id}`)}
                      style={{ padding: '4px 9px', background: '#dbeafe', color: '#1d4ed8', border: 'none', borderRadius: '0.45rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                    >
                      Xem bài
                    </button>
                  </td>
                </tr>
                );
              })}
            </tbody>
            </table>
            {!ketQua.length && <p style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Chưa có kết quả nào</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default KetQua;

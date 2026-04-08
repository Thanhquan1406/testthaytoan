/**
 * @fileoverview Xem kết quả thi theo đề và lớp (Giáo viên).
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getKetQua,
  getDanhSachDeThi,
  getDanhSachLop,
  capNhatGhiChu,
  getHistogram,
  getQuestionDifficulty,
  getClassComparison,
  exportKetQuaExcel,
  exportKetQuaPDF,
} from '../../services/ketQuaService';
import { SkeletonTable } from '../../components/common/Skeleton';
import AnalyticsSummaryCards from '../../components/giaoVien/analytics/AnalyticsSummaryCards';
import ScoreHistogramChart from '../../components/giaoVien/analytics/ScoreHistogramChart';
import QuestionDifficultyChart from '../../components/giaoVien/analytics/QuestionDifficultyChart';
import ClassComparisonChart from '../../components/giaoVien/analytics/ClassComparisonChart';
import { notify } from '../../utils/notify';

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

  const { data: histogram } = useQuery({
    queryKey: ['gv-ket-qua-histogram', deThiId, lopHocId],
    queryFn: () => getHistogram({ deThiId, lopHocId, binSize: 1 }),
    enabled: !!deThiId,
  });

  const { data: questionDifficulty } = useQuery({
    queryKey: ['gv-ket-qua-difficulty', deThiId, lopHocId],
    queryFn: () => getQuestionDifficulty({ deThiId, lopHocId }),
    enabled: !!deThiId,
  });

  const { data: classComparison } = useQuery({
    queryKey: ['gv-ket-qua-class-comparison', deThiId],
    queryFn: () => getClassComparison({ deThiId }),
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
    border: '1px solid var(--border-default)',
    borderRadius: '0.7rem',
    background: 'var(--bg-surface)',
    fontSize: '0.875rem',
    minWidth: '220px',
    color: 'var(--text-primary)',
  };

  const scoreList = ketQua?.map((item) => item?.ketQua?.tongDiem).filter((score) => typeof score === 'number') ?? [];
  const tongBai = ketQua?.length ?? 0;
  const diemTrungBinh = scoreList.length ? scoreList.reduce((sum, score) => sum + score, 0) / scoreList.length : 0;
  const diemCaoNhat = scoreList.length ? Math.max(...scoreList) : 0;
  const soLuongDat = scoreList.filter((score) => score >= 5).length;

  const formatScore = (score) => (typeof score === 'number' ? score.toFixed(2) : '—');
  const getScorePillStyle = (score) => {
    if (typeof score !== 'number') return { background: 'var(--bg-surface-muted)', color: 'var(--text-secondary)' };
    if (score >= 8) return { background: '#dcfce7', color: '#166534' };
    if (score >= 5) return { background: '#dbeafe', color: '#1d4ed8' };
    return { background: '#fee2e2', color: '#b91c1c' };
  };

  const handleDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onExportExcel = async () => {
    if (!deThiId) {
      notify.warning('Vui lòng chọn đề thi trước khi xuất báo cáo.');
      return;
    }
    try {
      const blob = await exportKetQuaExcel({ deThiId, lopHocId });
      handleDownload(blob, `bao-cao-ket-qua-${Date.now()}.xlsx`);
    } catch (err) {
      notify.error(err.message);
    }
  };

  const onExportPDF = async () => {
    if (!deThiId) {
      notify.warning('Vui lòng chọn đề thi trước khi xuất báo cáo.');
      return;
    }
    try {
      const blob = await exportKetQuaPDF({ deThiId, lopHocId });
      handleDownload(blob, `bao-cao-ket-qua-${Date.now()}.pdf`);
    } catch (err) {
      notify.error(err.message);
    }
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
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
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
        <button
          onClick={onExportExcel}
          style={{ padding: '0.6rem 0.8rem', border: 'none', borderRadius: '0.7rem', background: '#0f766e', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
        >
          Xuat Excel
        </button>
        <button
          onClick={onExportPDF}
          style={{ padding: '0.6rem 0.8rem', border: 'none', borderRadius: '0.7rem', background: '#b91c1c', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
        >
          Xuat PDF
        </button>
      </div>

      {!deThiId && (
        <div
          style={{
            background: 'var(--bg-surface-muted)',
            borderRadius: '0.9rem',
            border: '1px dashed #cbd5e1',
            padding: '3rem',
            textAlign: 'center',
            color: 'var(--text-secondary)',
          }}
        >
          Chọn một đề thi để xem kết quả
        </div>
      )}

      {isLoading && deThiId && <SkeletonTable rows={6} cols={7} />}

      {ketQua && !isLoading && (
        <div>
          <AnalyticsSummaryCards
            tongBai={tongBai}
            diemTrungBinh={diemTrungBinh}
            diemCaoNhat={diemCaoNhat}
            soLuongDat={soLuongDat}
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
            <ScoreHistogramChart bins={histogram?.bins || []} />
            <QuestionDifficultyChart data={questionDifficulty?.data || []} />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <ClassComparisonChart data={classComparison?.data || []} />
          </div>

          <div style={{ background: 'var(--bg-surface)', borderRadius: '0.9rem', border: '1px solid var(--border-default)', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '920px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface-muted)', borderBottom: '1px solid var(--border-default)' }}>
                {['STT', 'Học viên', 'Lớp', 'Điểm', 'Thời gian nộp', 'Ghi chú', 'Thao tác'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ketQua.map((k, i) => {
                const currentNote = editingNotes[k._id] ?? k.ketQua?.ghiChu ?? '';
                const score = k.ketQua?.tongDiem;
                const scorePillStyle = getScorePillStyle(score);
                return (
                <tr key={k._id} style={{ borderBottom: '1px solid var(--border-default)' }}>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{i + 1}</td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>
                    {k.nguoiDungId ? `${k.nguoiDungId.ho} ${k.nguoiDungId.ten}` : k.hoTenAnDanh || 'Ẩn danh'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{k.lopHocId?.ten || '—'}</td>
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
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {k.thoiGianNop ? new Date(k.thoiGianNop).toLocaleString('vi') : '—'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <input
                        value={currentNote}
                        onChange={(e) => setEditingNotes((prev) => ({ ...prev, [k._id]: e.target.value }))}
                        placeholder="Nhập ghi chú"
                        style={{ padding: '0.4rem 0.55rem', border: '1px solid var(--border-default)', borderRadius: '0.45rem', minWidth: '180px' }}
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

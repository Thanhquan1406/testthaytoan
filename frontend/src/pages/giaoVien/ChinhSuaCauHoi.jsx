/**
 * @fileoverview Chỉnh sửa câu hỏi trong đề thi (Giáo viên).
 * Tải chi tiết đề thi, hiển thị danh sách câu hỏi, cho phép sửa / xóa từng câu.
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getById as getDeThiById, removeQuestion } from '../../services/deThiService';
import { update as updateCauHoi } from '../../services/cauHoiService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';

const DO_KHO_MAP = { NB: 'Nhận biết', TH: 'Thông hiểu', VH: 'Vận dụng' };
const LOAI_MAP = { TRAC_NGHIEM: 'Trắc nghiệm', DUNG_SAI: 'Đúng/Sai', TU_LUAN: 'Tự luận' };

const inputStyle = {
  width: '100%', padding: '0.5rem 0.75rem', marginTop: '4px',
  border: '1px solid var(--border-default)', borderRadius: '0.5rem',
  boxSizing: 'border-box', fontSize: '0.875rem',
};

const ChinhSuaCauHoi = () => {
  const { deThiId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [editingIdx, setEditingIdx] = useState(null);
  const [editData, setEditData] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: deThi, isLoading, error } = useQuery({
    queryKey: ['gv-de-thi-detail', deThiId],
    queryFn: () => getDeThiById(deThiId),
    enabled: !!deThiId,
  });

  const updateMut = useMutation({
    mutationFn: ({ cauHoiId, body }) => updateCauHoi(cauHoiId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gv-de-thi-detail', deThiId] });
      setEditingIdx(null);
      setEditData(null);
    },
  });

  const removeMut = useMutation({
    mutationFn: (cauHoiId) => removeQuestion(deThiId, cauHoiId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gv-de-thi-detail', deThiId] });
      setDeleteTarget(null);
    },
  });

  const openEdit = (idx, cauHoi) => {
    const q = cauHoi.cauHoiId || cauHoi;
    setEditingIdx(idx);
    setEditData({
      _id: q._id,
      noiDung: q.noiDung || '',
      loaiCauHoi: q.loaiCauHoi || 'TRAC_NGHIEM',
      doKho: q.doKho || 'TH',
      luaChonA: q.luaChonA || '',
      luaChonB: q.luaChonB || '',
      luaChonC: q.luaChonC || '',
      luaChonD: q.luaChonD || '',
      dapAnDung: q.dapAnDung || '',
    });
  };

  const cancelEdit = () => { setEditingIdx(null); setEditData(null); };

  const saveEdit = () => {
    if (!editData) return;
    updateMut.mutate({
      cauHoiId: editData._id,
      body: {
        noiDung: editData.noiDung.trim(),
        loaiCauHoi: editData.loaiCauHoi,
        doKho: editData.doKho,
        luaChonA: editData.luaChonA.trim(),
        luaChonB: editData.luaChonB.trim(),
        luaChonC: editData.luaChonC.trim(),
        luaChonD: editData.luaChonD.trim(),
        dapAnDung: editData.dapAnDung.trim(),
      },
    });
  };

  const setField = (key) => (e) => setEditData((p) => ({ ...p, [key]: e.target.value }));

  if (isLoading) return <LoadingSpinner />;
  if (error) return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <p style={{ color: '#dc2626', fontSize: '1rem' }}>Không thể tải đề thi. {error.message}</p>
      <button onClick={() => navigate(-1)} style={{ marginTop: '1rem', padding: '0.5rem 1.25rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>Quay lại</button>
    </div>
  );

  const cauHois = deThi?.cauHois || [];

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => navigate('/giao-vien/de-thi')}
          style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', fontWeight: 500, fontSize: '0.9rem' }}
        >
          ← Quay lại
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>Chỉnh sửa câu hỏi</h1>
          <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {deThi?.ten} • {cauHois.length} câu hỏi
          </p>
        </div>
      </div>

      {/* Danh sách câu hỏi */}
      {!cauHois.length ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--bg-surface)', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <p style={{ fontSize: '2.5rem', margin: '0 0 0.75rem' }}>📋</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>Đề thi chưa có câu hỏi nào.</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.5rem 0 0' }}>Hãy thêm câu hỏi từ ngân hàng hoặc import file.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {cauHois.map((item, idx) => {
            const q = item.cauHoiId || item;
            const isEditing = editingIdx === idx;

            return (
              <div
                key={q._id || idx}
                style={{
                  background: 'var(--bg-surface)', borderRadius: '0.75rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden',
                  border: isEditing ? '2px solid #3b82f6' : '1px solid transparent',
                }}
              >
                {/* Card header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'var(--bg-surface-muted)', borderBottom: '1px solid var(--border-default)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#4f46e5' }}>Câu {idx + 1}</span>
                    <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '9999px', background: '#dbeafe', color: '#1d4ed8' }}>
                      {LOAI_MAP[q.loaiCauHoi] || q.loaiCauHoi}
                    </span>
                    <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '9999px', background: '#fef3c7', color: '#92400e' }}>
                      {DO_KHO_MAP[q.doKho] || q.doKho}
                    </span>
                    {item.diem != null && (
                      <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '9999px', background: '#f0fdf4', color: '#15803d' }}>
                        {item.diem} điểm
                      </span>
                    )}
                  </div>
                  {!isEditing && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => openEdit(idx, item)}
                        style={{ padding: '4px 10px', background: '#dbeafe', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 500 }}
                      >
                        ✏️ Sửa
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ cauHoiId: q._id, stt: idx + 1, noiDung: q.noiDung })}
                        style={{ padding: '4px 10px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 500 }}
                      >
                        🗑️ Xóa
                      </button>
                    </div>
                  )}
                </div>

                {/* Card body */}
                {isEditing && editData ? (
                  <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    {/* Nội dung câu hỏi */}
                    <div>
                      <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>Nội dung câu hỏi</label>
                      <textarea
                        rows={3} value={editData.noiDung} onChange={setField('noiDung')}
                        style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                      />
                    </div>

                    {/* Loại & Độ khó */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>Loại câu hỏi</label>
                        <select value={editData.loaiCauHoi} onChange={setField('loaiCauHoi')} style={inputStyle}>
                          <option value="TRAC_NGHIEM">Trắc nghiệm</option>
                          <option value="DUNG_SAI">Đúng/Sai</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>Độ khó</label>
                        <select value={editData.doKho} onChange={setField('doKho')} style={inputStyle}>
                          <option value="NB">Nhận biết</option>
                          <option value="TH">Thông hiểu</option>
                          <option value="VH">Vận dụng</option>
                        </select>
                      </div>
                    </div>

                    {/* Lựa chọn A-D (cho trắc nghiệm) */}
                    {editData.loaiCauHoi === 'TRAC_NGHIEM' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        {['A', 'B', 'C', 'D'].map((letter) => (
                          <div key={letter}>
                            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                              Lựa chọn {letter}
                            </label>
                            <input
                              type="text"
                              value={editData[`luaChon${letter}`]}
                              onChange={setField(`luaChon${letter}`)}
                              style={inputStyle}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Đáp án đúng */}
                    <div>
                      <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>Đáp án đúng</label>
                      {editData.loaiCauHoi === 'TRAC_NGHIEM' ? (
                        <select value={editData.dapAnDung} onChange={setField('dapAnDung')} style={{ ...inputStyle, width: '200px' }}>
                          <option value="">-- Chọn đáp án --</option>
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                        </select>
                      ) : editData.loaiCauHoi === 'DUNG_SAI' ? (
                        <select value={editData.dapAnDung} onChange={setField('dapAnDung')} style={{ ...inputStyle, width: '200px' }}>
                          <option value="">-- Chọn --</option>
                          <option value="DUNG">Đúng</option>
                          <option value="SAI">Sai</option>
                        </select>
                      ) : (
                        <textarea
                          rows={2} value={editData.dapAnDung} onChange={setField('dapAnDung')}
                          placeholder="Nhập đáp án mẫu..."
                          style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                        />
                      )}
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid var(--border-default)' }}>
                      <button
                        onClick={cancelEdit}
                        disabled={updateMut.isPending}
                        style={{ padding: '0.45rem 1rem', border: '1px solid var(--border-default)', borderRadius: '0.5rem', background: 'var(--bg-surface)', cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        Hủy
                      </button>
                      <button
                        onClick={saveEdit}
                        disabled={updateMut.isPending || !editData.noiDung.trim()}
                        style={{
                          padding: '0.45rem 1.25rem', background: editData.noiDung.trim() ? '#2563eb' : '#93c5fd',
                          color: '#fff', border: 'none', borderRadius: '0.5rem',
                          cursor: editData.noiDung.trim() ? 'pointer' : 'not-allowed',
                          fontWeight: 600, fontSize: '0.85rem',
                        }}
                      >
                        {updateMut.isPending ? 'Đang lưu...' : 'Lưu câu hỏi'}
                      </button>
                    </div>

                    {updateMut.isError && (
                      <p style={{ color: '#dc2626', fontSize: '0.8125rem', margin: 0, background: '#fef2f2', padding: '0.5rem 0.75rem', borderRadius: '0.375rem' }}>
                        {updateMut.error?.message || 'Lưu thất bại. Vui lòng thử lại.'}
                      </p>
                    )}
                  </div>
                ) : (
                  <div style={{ padding: '0.875rem 1rem' }}>
                    <p style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                      {q.noiDung}
                    </p>
                    {q.loaiCauHoi === 'TRAC_NGHIEM' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem 1rem', marginTop: '0.5rem' }}>
                        {['A', 'B', 'C', 'D'].map((letter) => {
                          const text = q[`luaChon${letter}`];
                          if (!text) return null;
                          const isCorrect = q.dapAnDung === letter;
                          return (
                            <div
                              key={letter}
                              style={{
                                display: 'flex', alignItems: 'flex-start', gap: '6px',
                                padding: '6px 10px', borderRadius: '0.375rem', fontSize: '0.85rem',
                                background: isCorrect ? '#f0fdf4' : 'transparent',
                                border: isCorrect ? '1px solid #bbf7d0' : '1px solid transparent',
                                color: isCorrect ? '#15803d' : 'var(--text-primary)',
                                fontWeight: isCorrect ? 600 : 400,
                              }}
                            >
                              <span style={{ fontWeight: 600, flexShrink: 0 }}>{letter}.</span>
                              <span>{text}</span>
                              {isCorrect && <span style={{ marginLeft: 'auto', flexShrink: 0 }}>✓</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {q.loaiCauHoi === 'DUNG_SAI' && q.dapAnDung && (
                      <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: '#15803d', fontWeight: 500 }}>
                        Đáp án: {q.dapAnDung === 'DUNG' ? 'Đúng' : 'Sai'}
                      </p>
                    )}
                    {q.loaiCauHoi === 'TU_LUAN' && q.dapAnDung && (
                      <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <strong>Đáp án mẫu:</strong> {q.dapAnDung}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal xác nhận xóa câu hỏi khỏi đề */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => { if (!removeMut.isPending) setDeleteTarget(null); }}
        title="Xóa câu hỏi khỏi đề"
        size="sm"
        footer={
          <>
            <button
              onClick={() => setDeleteTarget(null)}
              disabled={removeMut.isPending}
              style={{ padding: '0.5rem 1rem', border: '1px solid var(--border-default)', borderRadius: '0.5rem', background: 'var(--bg-surface)', cursor: 'pointer' }}
            >
              Hủy
            </button>
            <button
              onClick={() => removeMut.mutate(deleteTarget.cauHoiId)}
              disabled={removeMut.isPending}
              style={{ padding: '0.5rem 1.25rem', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600 }}
            >
              {removeMut.isPending ? 'Đang xóa...' : 'Xóa khỏi đề'}
            </button>
          </>
        }
      >
        <div style={{ padding: '0.5rem 0' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '2rem', lineHeight: 1 }}>⚠️</span>
            <div>
              <p style={{ margin: '0 0 0.5rem', fontWeight: 500 }}>
                Xóa Câu {deleteTarget?.stt} khỏi đề thi?
              </p>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'var(--bg-surface-muted)', padding: '6px 10px', borderRadius: '0.375rem' }}>
                {deleteTarget?.noiDung?.length > 120
                  ? deleteTarget.noiDung.slice(0, 120) + '...'
                  : deleteTarget?.noiDung}
              </p>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)', background: '#fef9c3', padding: '8px 12px', borderRadius: '0.375rem' }}>
            Câu hỏi sẽ bị gỡ khỏi đề thi nhưng vẫn còn trong ngân hàng câu hỏi.
          </p>
          {removeMut.isError && (
            <p style={{ margin: '0.75rem 0 0', color: '#dc2626', fontSize: '0.85rem', background: '#fef2f2', padding: '0.5rem 0.75rem', borderRadius: '0.375rem' }}>
              {removeMut.error?.message || 'Xóa thất bại. Vui lòng thử lại.'}
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ChinhSuaCauHoi;

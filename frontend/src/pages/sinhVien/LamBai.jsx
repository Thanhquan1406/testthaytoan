/**
 * @fileoverview Trang làm bài thi - giao diện thi chính.
 * Tích hợp: đếm ngược, anti-cheat, lưu đáp án realtime, nộp bài.
 */

import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getNoiDung, luuTraLoi, nopBai, viPham } from '../../services/thiService';
import QuestionCard from '../../components/exam/QuestionCard';
import CountdownTimer from '../../components/exam/CountdownTimer';
import ViolationAlert from '../../components/exam/ViolationAlert';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import useAntiCheat from '../../hooks/useAntiCheat';
import { notify } from '../../utils/notify';

const LamBai = () => {
  const { phienThiId } = useParams();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState({});
  const [violations, setViolations] = useState(0);
  const [showViolation, setShowViolation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTimeExpired, setIsTimeExpired] = useState(false);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const draftKey = `sv_exam_draft_${phienThiId}`;
  const normalizeId = (id) => {
    if (!id) return '';
    if (typeof id === 'string') return id;
    if (typeof id === 'object' && id._id) return String(id._id);
    return String(id);
  };

  const { data: baiThi, isLoading, error } = useQuery({
    queryKey: ['sv-lam-bai', phienThiId],
    queryFn: () => getNoiDung(phienThiId),
  });

  useEffect(() => {
    if (!baiThi) return;
    const existing = {};
    baiThi.cauTraLois?.forEach((c) => {
      const cauHoiId = normalizeId(c.cauHoiId);
      if (c.noiDungTraLoi && cauHoiId) existing[cauHoiId] = c.noiDungTraLoi;
    });
    try {
      const localDraft = JSON.parse(localStorage.getItem(draftKey) || '{}');
      setAnswers({ ...existing, ...localDraft });
    } catch {
      setAnswers(existing);
    }
  }, [baiThi]);

  const saveMutation = useMutation({ mutationFn: ({ cauHoiId, noiDungTraLoi }) => luuTraLoi(phienThiId, cauHoiId, noiDungTraLoi) });

  const handleViolation = useCallback(async (hanhVi) => {
    setViolations((v) => v + 1);
    setShowViolation(true);
    try { await viPham(phienThiId, hanhVi); } catch { /* ignore */ }
  }, [phienThiId]);

  const { enterFullscreen } = useAntiCheat({ onViolation: handleViolation, enabled: true });

  const handleAnswer = useCallback((cauHoiId, noiDungTraLoi) => {
    if (isTimeExpired || isSubmitting) return;
    const normalizedCauHoiId = normalizeId(cauHoiId);
    setAnswers((prev) => {
      const next = { ...prev, [normalizedCauHoiId]: noiDungTraLoi };
      localStorage.setItem(draftKey, JSON.stringify(next));
      return next;
    });
    saveMutation.mutate({ cauHoiId: normalizedCauHoiId, noiDungTraLoi });
  }, [saveMutation, draftKey, isTimeExpired, isSubmitting]);

  const handleLuuBai = async ({ silent = false } = {}) => {
    if (isTimeExpired && !silent) {
      notify.warning('Đã hết thời gian làm bài. Hệ thống đang tự nộp.');
      return;
    }
    const entries = Object.entries(answers).filter(([, value]) => value !== null && value !== undefined && value !== '');
    if (!entries.length) {
      if (!silent) notify.warning('Chưa có đáp án nào để lưu.');
      return;
    }
    setIsSaving(true);
    try {
      const results = await Promise.allSettled(
        entries.map(([cauHoiId, noiDungTraLoi]) => luuTraLoi(phienThiId, cauHoiId, noiDungTraLoi))
      );
      const failed = results.filter((r) => r.status === 'rejected').length;
      if (failed > 0) {
        if (!silent) notify.warning(`Đã lưu ${entries.length - failed}/${entries.length} câu. Vui lòng bấm Lưu bài lại để đồng bộ đủ.`);
      } else {
        setLastSavedAt(new Date());
        if (!silent) notify.success('Đã lưu bài thành công.');
      }
      localStorage.setItem(draftKey, JSON.stringify(answers));
    } catch {
      if (!silent) notify.error('Lưu bài thất bại. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNopBai = async () => {
    setConfirmSubmitOpen(true);
  };

  const submitConfirmed = async () => {
    setConfirmSubmitOpen(false);
    setIsSubmitting(true);
    try {
      await handleLuuBai({ silent: true });
      await nopBai(phienThiId);
      localStorage.removeItem(draftKey);
      navigate(`/sinh-vien/ket-qua/${phienThiId}`);
    } catch (err) {
      notify.error(err.message);
      setIsSubmitting(false);
    }
  };

  const autoSubmitOnExpired = useCallback(async () => {
    if (isSubmitting) return;
    setIsTimeExpired(true);
    setIsSubmitting(true);
    try {
      await handleLuuBai({ silent: true });
      await nopBai(phienThiId);
      localStorage.removeItem(draftKey);
      navigate(`/sinh-vien/ket-qua/${phienThiId}`);
    } catch {
      notify.warning('Đã hết giờ. Nếu mạng không ổn định, hệ thống sẽ tự nộp bài phía server trong tối đa 1 phút.');
      setIsSubmitting(false);
    }
  }, [isSubmitting, handleLuuBai, phienThiId, draftKey, navigate]);

  if (isLoading) return <LoadingSpinner fullPage />;
  if (error) return <div style={{ padding: '2rem', color: '#ef4444' }}>Lỗi: {error.message}</div>;

  const cauHois = baiThi?.cauHois || [];
  const answered = Object.values(answers).filter(Boolean).length;
  const jumpToQuestion = (questionId) => {
    const el = document.getElementById(`question-${questionId}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', display: 'flex', flexDirection: 'column' }}>
      {/* Header cố định */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100, background: '#1e1b4b',
        padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: '1rem',
      }}>
        <div style={{ color: '#fff' }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{baiThi?.tenDeThi}</div>
          <div style={{ fontSize: '0.75rem', color: '#a5b4fc' }}>{answered}/{cauHois.length} câu đã trả lời</div>
        </div>
        {baiThi?.thoiGianBatDau && (
          <CountdownTimer
            thoiGianBatDau={baiThi.thoiGianBatDau}
            thoiGianPhut={baiThi.thoiGianPhut}
            onExpired={autoSubmitOnExpired}
          />
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {lastSavedAt && (
            <span style={{ color: '#c7d2fe', fontSize: '0.75rem' }}>
              Đã lưu: {lastSavedAt.toLocaleTimeString('vi')}
            </span>
          )}
          <button
            onClick={handleLuuBai}
            disabled={isSaving || isSubmitting || isTimeExpired}
            style={{
              padding: '0.5rem 1.1rem', background: '#0ea5e9', color: '#fff',
              border: 'none', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer',
            }}
          >
            {isSaving ? 'Đang lưu...' : 'Lưu bài'}
          </button>
          <button
            onClick={handleNopBai}
            disabled={isSubmitting || isTimeExpired}
            style={{
              padding: '0.5rem 1.25rem', background: '#ef4444', color: '#fff',
              border: 'none', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer',
            }}
          >
            {isSubmitting ? 'Đang nộp...' : 'Nộp bài'}
          </button>
        </div>
      </header>

      <ViolationAlert soLan={violations} onDismiss={() => setShowViolation(false)} />
      <ConfirmDialog
        isOpen={confirmSubmitOpen}
        title="Xác nhận nộp bài"
        message="Bạn có chắc muốn nộp bài? Sau khi nộp không thể sửa."
        confirmText="Nộp bài"
        dangerous
        onCancel={() => setConfirmSubmitOpen(false)}
        onConfirm={submitConfirmed}
      />

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar câu hỏi */}
        <div style={{ width: '200px', background: 'var(--bg-surface)', padding: '1rem', borderRight: '1px solid var(--border-default)', position: 'sticky', top: '64px', height: 'calc(100vh - 64px)', overflowY: 'auto', flexShrink: 0 }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', fontWeight: 600 }}>Danh sách câu hỏi</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px' }}>
            {cauHois.map((c, i) => (
              <button
                key={c._id}
                onClick={() => jumpToQuestion(normalizeId(c._id))}
                style={{
                  aspect: '1/1', fontSize: '0.75rem', fontWeight: 600,
                  background: answers[normalizeId(c._id)] ? '#4f46e5' : 'var(--bg-surface-muted)',
                  color: answers[normalizeId(c._id)] ? '#fff' : 'var(--text-primary)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '0.375rem', cursor: 'pointer',
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Nội dung câu hỏi */}
        <div style={{ flex: 1, padding: '1.5rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {cauHois.map((cau, idx) => (
              <div key={normalizeId(cau._id)} id={`question-${normalizeId(cau._id)}`}>
                <QuestionCard
                  cauHoi={cau}
                  soThuTu={idx + 1}
                  selectedAnswer={answers[normalizeId(cau._id)] || null}
                  onAnswer={handleAnswer}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LamBai;

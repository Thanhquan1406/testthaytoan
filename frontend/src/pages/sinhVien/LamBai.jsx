/**
 * @fileoverview Trang làm bài thi - giao diện thi chính.
 * Tích hợp: đếm ngược, anti-cheat, lưu đáp án realtime, nộp bài.
 */

import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getNoiDung, luuTraLoi, nopBai, viPham } from '../../services/thiService';
import QuestionCard from '../../components/exam/QuestionCard';
import CountdownTimer from '../../components/exam/CountdownTimer';
import ViolationAlert from '../../components/exam/ViolationAlert';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import useAntiCheat from '../../hooks/useAntiCheat';

const LamBai = () => {
  const { phienThiId } = useParams();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState({});
  const [violations, setViolations] = useState(0);
  const [showViolation, setShowViolation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);

  const { data: baiThi, isLoading, error } = useQuery({
    queryKey: ['sv-lam-bai', phienThiId],
    queryFn: () => getNoiDung(phienThiId),
    onSuccess: (data) => {
      // Khôi phục câu trả lời cũ nếu có
      const existing = {};
      data.cauTraLois?.forEach((c) => {
        if (c.noiDungTraLoi) existing[c.cauHoiId] = c.noiDungTraLoi;
      });
      setAnswers(existing);
    },
  });

  const saveMutation = useMutation({ mutationFn: ({ cauHoiId, noiDungTraLoi }) => luuTraLoi(phienThiId, cauHoiId, noiDungTraLoi) });

  const handleViolation = useCallback(async (hanhVi) => {
    setViolations((v) => v + 1);
    setShowViolation(true);
    try { await viPham(phienThiId, hanhVi); } catch { /* ignore */ }
  }, [phienThiId]);

  const { enterFullscreen } = useAntiCheat({ onViolation: handleViolation, enabled: true });

  const handleAnswer = useCallback((cauHoiId, noiDungTraLoi) => {
    setAnswers((prev) => ({ ...prev, [cauHoiId]: noiDungTraLoi }));
    saveMutation.mutate({ cauHoiId, noiDungTraLoi });
  }, [saveMutation]);

  const handleNopBai = async () => {
    if (!confirm('Bạn có chắc muốn nộp bài? Sau khi nộp không thể sửa.')) return;
    setIsSubmitting(true);
    try {
      await nopBai(phienThiId);
      navigate(`/sinh-vien/ket-qua/${phienThiId}`);
    } catch (err) {
      alert(err.message);
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <LoadingSpinner fullPage />;
  if (error) return <div style={{ padding: '2rem', color: '#ef4444' }}>Lỗi: {error.message}</div>;

  const cauHois = baiThi?.cauHois || [];
  const answered = Object.values(answers).filter(Boolean).length;

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', display: 'flex', flexDirection: 'column' }}>
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
            onExpired={handleNopBai}
          />
        )}
        <button
          onClick={handleNopBai}
          disabled={isSubmitting}
          style={{
            padding: '0.5rem 1.25rem', background: '#ef4444', color: '#fff',
            border: 'none', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer',
          }}
        >
          {isSubmitting ? 'Đang nộp...' : 'Nộp bài'}
        </button>
      </header>

      <ViolationAlert soLan={violations} onDismiss={() => setShowViolation(false)} />

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar câu hỏi */}
        <div style={{ width: '200px', background: '#fff', padding: '1rem', borderRight: '1px solid #e5e7eb', position: 'sticky', top: '64px', height: 'calc(100vh - 64px)', overflowY: 'auto', flexShrink: 0 }}>
          <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.75rem', fontWeight: 600 }}>Danh sách câu hỏi</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px' }}>
            {cauHois.map((c, i) => (
              <button
                key={c._id}
                onClick={() => setCurrentQ(i)}
                style={{
                  aspect: '1/1', fontSize: '0.75rem', fontWeight: 600,
                  background: answers[c._id] ? '#4f46e5' : currentQ === i ? '#e0e7ff' : '#f9fafb',
                  color: answers[c._id] ? '#fff' : '#374151',
                  border: currentQ === i ? '2px solid #4f46e5' : '1px solid #e5e7eb',
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
          {cauHois[currentQ] && (
            <QuestionCard
              cauHoi={cauHois[currentQ]}
              soThuTu={currentQ + 1}
              selectedAnswer={answers[cauHois[currentQ]._id] || null}
              onAnswer={handleAnswer}
            />
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
            <button
              onClick={() => setCurrentQ((p) => Math.max(0, p - 1))}
              disabled={currentQ === 0}
              style={{ padding: '0.5rem 1.25rem', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '0.5rem', cursor: currentQ === 0 ? 'not-allowed' : 'pointer', opacity: currentQ === 0 ? 0.5 : 1 }}
            >
              ← Câu trước
            </button>
            <button
              onClick={() => setCurrentQ((p) => Math.min(cauHois.length - 1, p + 1))}
              disabled={currentQ === cauHois.length - 1}
              style={{ padding: '0.5rem 1.25rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '0.5rem', cursor: currentQ === cauHois.length - 1 ? 'not-allowed' : 'pointer', opacity: currentQ === cauHois.length - 1 ? 0.5 : 1 }}
            >
              Câu tiếp →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LamBai;

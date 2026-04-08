/**
 * @fileoverview Trang làm bài thi ẩn danh (giống LamBai nhưng dùng anonymous token).
 */

import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getNoiDungAnDanh, luuTraLoiAnDanh, nopBaiAnDanh, viPhamAnDanh } from '../../services/thiService';
import QuestionCard from '../../components/exam/QuestionCard';
import CountdownTimer from '../../components/exam/CountdownTimer';
import ViolationAlert from '../../components/exam/ViolationAlert';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import useAntiCheat from '../../hooks/useAntiCheat';

const LamBaiAnDanh = () => {
  const { phienThiId } = useParams();
  const navigate = useNavigate();
  const token = sessionStorage.getItem('anon_token');

  const [baiThi, setBaiThi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState({});
  const [violations, setViolations] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const draftKey = `anon_exam_draft_${phienThiId}`;
  const normalizeId = (id) => {
    if (!id) return '';
    if (typeof id === 'string') return id;
    if (typeof id === 'object' && id._id) return String(id._id);
    return String(id);
  };

  useEffect(() => {
    if (!token) { navigate('/thi-mo'); return; }
    getNoiDungAnDanh(phienThiId, token)
      .then((data) => {
        setBaiThi(data);
        const existing = {};
        data.cauTraLois?.forEach((c) => {
          const cauHoiId = normalizeId(c.cauHoiId);
          if (c.noiDungTraLoi && cauHoiId) existing[cauHoiId] = c.noiDungTraLoi;
        });
        try {
          const localDraft = JSON.parse(sessionStorage.getItem(draftKey) || '{}');
          setAnswers({ ...existing, ...localDraft });
        } catch {
          setAnswers(existing);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [phienThiId, token, navigate]);

  const handleViolation = useCallback(async (hanhVi) => {
    setViolations((v) => v + 1);
    try { await viPhamAnDanh(phienThiId, token, hanhVi); } catch { /* ignore */ }
  }, [phienThiId, token]);

  useAntiCheat({ onViolation: handleViolation, enabled: true });

  const handleAnswer = (cauHoiId, noiDungTraLoi) => {
    const normalizedCauHoiId = normalizeId(cauHoiId);
    setAnswers((prev) => {
      const next = { ...prev, [normalizedCauHoiId]: noiDungTraLoi };
      sessionStorage.setItem(draftKey, JSON.stringify(next));
      return next;
    });
    luuTraLoiAnDanh(phienThiId, token, normalizedCauHoiId, noiDungTraLoi).catch(() => {});
  };

  const handleLuuBai = async ({ silent = false } = {}) => {
    const entries = Object.entries(answers).filter(([, value]) => value !== null && value !== undefined && value !== '');
    if (!entries.length) {
      if (!silent) alert('Chưa có đáp án nào để lưu.');
      return;
    }
    setSaving(true);
    try {
      const results = await Promise.allSettled(
        entries.map(([cauHoiId, noiDungTraLoi]) => luuTraLoiAnDanh(phienThiId, token, cauHoiId, noiDungTraLoi))
      );
      const failed = results.filter((r) => r.status === 'rejected').length;
      if (failed > 0) {
        if (!silent) alert(`Đã lưu ${entries.length - failed}/${entries.length} câu. Vui lòng bấm Lưu bài lại để đồng bộ đủ.`);
      } else {
        setLastSavedAt(new Date());
        if (!silent) alert('Đã lưu bài thành công.');
      }
      sessionStorage.setItem(draftKey, JSON.stringify(answers));
    } catch {
      if (!silent) alert('Lưu bài thất bại. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const handleNopBai = async () => {
    if (!confirm('Bạn có chắc muốn nộp bài?')) return;
    setSubmitting(true);
    try {
      await handleLuuBai({ silent: true });
      const result = await nopBaiAnDanh(phienThiId, token);
      sessionStorage.removeItem('anon_token');
      sessionStorage.removeItem(draftKey);
      navigate(`/ket-qua-an-danh/${phienThiId}`, { state: { ketQua: result } });
    } catch (err) { alert(err.message); setSubmitting(false); }
  };

  if (loading) return <LoadingSpinner fullPage />;
  if (error) return <div style={{ padding: '2rem', color: '#ef4444' }}>Lỗi: {error}</div>;

  const cauHois = baiThi?.cauHois || [];
  const jumpToQuestion = (questionId) => {
    const el = document.getElementById(`anon-question-${questionId}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', display: 'flex', flexDirection: 'column' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 100, background: '#1e1b4b', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div style={{ color: '#fff' }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{baiThi?.tenDeThi}</div>
          <div style={{ fontSize: '0.75rem', color: '#a5b4fc' }}>{baiThi?.hoTenAnDanh || 'Ẩn danh'} • {Object.values(answers).filter(Boolean).length}/{cauHois.length} câu</div>
        </div>
        {baiThi?.thoiGianBatDau && (
          <CountdownTimer thoiGianBatDau={baiThi.thoiGianBatDau} thoiGianPhut={baiThi.thoiGianPhut} onExpired={handleNopBai} />
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {lastSavedAt && (
            <span style={{ color: '#c7d2fe', fontSize: '0.75rem' }}>
              Đã lưu: {lastSavedAt.toLocaleTimeString('vi')}
            </span>
          )}
          <button onClick={() => handleLuuBai()} disabled={saving || submitting} style={{ padding: '0.5rem 1.1rem', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer' }}>
            {saving ? 'Đang lưu...' : 'Lưu bài'}
          </button>
          <button onClick={handleNopBai} disabled={submitting} style={{ padding: '0.5rem 1.25rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer' }}>
            {submitting ? 'Đang nộp...' : 'Nộp bài'}
          </button>
        </div>
      </header>

      <ViolationAlert soLan={violations} />

      <div style={{ display: 'flex', flex: 1 }}>
        <div style={{ width: '200px', background: '#fff', padding: '1rem', borderRight: '1px solid #e5e7eb', position: 'sticky', top: '64px', height: 'calc(100vh - 64px)', overflowY: 'auto', flexShrink: 0 }}>
          <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.75rem', fontWeight: 600 }}>Danh sách câu hỏi</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px' }}>
            {cauHois.map((c, i) => (
              <button
                key={c._id}
                onClick={() => jumpToQuestion(normalizeId(c._id))}
                style={{
                  aspect: '1/1',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  background: answers[normalizeId(c._id)] ? '#4f46e5' : '#f9fafb',
                  color: answers[normalizeId(c._id)] ? '#fff' : '#374151',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, padding: '1.5rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {cauHois.map((cau, idx) => (
              <div key={normalizeId(cau._id)} id={`anon-question-${normalizeId(cau._id)}`}>
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

export default LamBaiAnDanh;

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
  const [currentQ, setCurrentQ] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) { navigate('/thi-mo'); return; }
    getNoiDungAnDanh(phienThiId, token)
      .then((data) => {
        setBaiThi(data);
        const existing = {};
        data.cauTraLois?.forEach((c) => { if (c.noiDungTraLoi) existing[c.cauHoiId] = c.noiDungTraLoi; });
        setAnswers(existing);
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
    setAnswers((prev) => ({ ...prev, [cauHoiId]: noiDungTraLoi }));
    luuTraLoiAnDanh(phienThiId, token, cauHoiId, noiDungTraLoi).catch(() => {});
  };

  const handleNopBai = async () => {
    if (!confirm('Bạn có chắc muốn nộp bài?')) return;
    setSubmitting(true);
    try {
      const result = await nopBaiAnDanh(phienThiId, token);
      sessionStorage.removeItem('anon_token');
      navigate(`/ket-qua-an-danh/${phienThiId}`, { state: { ketQua: result } });
    } catch (err) { alert(err.message); setSubmitting(false); }
  };

  if (loading) return <LoadingSpinner fullPage />;
  if (error) return <div style={{ padding: '2rem', color: '#ef4444' }}>Lỗi: {error}</div>;

  const cauHois = baiThi?.cauHois || [];

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
        <button onClick={handleNopBai} disabled={submitting} style={{ padding: '0.5rem 1.25rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer' }}>
          {submitting ? 'Đang nộp...' : 'Nộp bài'}
        </button>
      </header>

      <ViolationAlert soLan={violations} />

      <div style={{ flex: 1, padding: '1.5rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        {cauHois[currentQ] && (
          <QuestionCard cauHoi={cauHois[currentQ]} soThuTu={currentQ + 1} selectedAnswer={answers[cauHois[currentQ]._id] || null} onAnswer={handleAnswer} />
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
          <button onClick={() => setCurrentQ((p) => Math.max(0, p - 1))} disabled={currentQ === 0} style={{ padding: '0.5rem 1.25rem', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '0.5rem', cursor: 'pointer' }}>← Câu trước</button>
          <button onClick={() => setCurrentQ((p) => Math.min(cauHois.length - 1, p + 1))} disabled={currentQ === cauHois.length - 1} style={{ padding: '0.5rem 1.25rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>Câu tiếp →</button>
        </div>
      </div>
    </div>
  );
};

export default LamBaiAnDanh;

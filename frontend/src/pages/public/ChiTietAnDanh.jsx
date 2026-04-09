/**
 * @fileoverview Xem chi tiết bài thi ẩn danh (câu hỏi + đáp án đúng/sai).
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import QuestionCard from '../../components/exam/QuestionCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const ANON_BASE = '/public/thi-an-danh/phien';

const ChiTietAnDanh = () => {
  const { phienThiId } = useParams();
  const navigate = useNavigate();
  const token = sessionStorage.getItem('anon_token');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) { setError('Phiên thi ẩn danh đã hết hạn.'); setLoading(false); return; }

    const api = axios.create({
      baseURL: import.meta.env.VITE_API_URL || '/api',
      headers: { Authorization: `Bearer ${token}` },
    });

    api.get(`${ANON_BASE}/${phienThiId}/chi-tiet`)
      .then((r) => setData(r.data.data))
      .catch((err) => {
        const msg = err.response?.data?.message || err.message;
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [phienThiId, token]);

  if (loading) return <LoadingSpinner />;

  if (error) {
    const is403 = error.includes('chưa được phép') || error.includes('không cho phép');
    return (
      <div style={{ padding: '2rem' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', fontWeight: 500, marginBottom: '1rem' }}>← Quay lại</button>
        <div style={{ background: '#fff', borderRadius: '0.75rem', padding: '2.5rem', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{is403 ? '🔒' : '❌'}</div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1e1b4b', marginBottom: '0.5rem' }}>
            {is403 ? 'Chưa được phép xem đáp án' : 'Không thể xem bài'}
          </h2>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', maxWidth: '360px', margin: '0 auto' }}>{error}</p>
        </div>
      </div>
    );
  }

  const answers = {};
  data?.cauTraLois?.forEach((c) => { answers[c.cauHoiId] = c.noiDungTraLoi; });
  const cauHois = data?.deThiId?.cauHois?.map((c) => c.cauHoiId).filter(Boolean) || [];

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', padding: '1.5rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', fontWeight: 500, marginBottom: '1rem' }}>← Quay lại</button>
        <div style={{ background: '#fff', borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>{data?.deThiId?.ten}</h1>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.875rem', color: '#6b7280' }}>
            <span>Điểm: <strong style={{ color: '#4f46e5', fontSize: '1.1rem' }}>{data?.ketQua?.tongDiem?.toFixed(2)}</strong></span>
            <span>Nộp: {data?.thoiGianNop ? new Date(data.thoiGianNop).toLocaleString('vi') : '—'}</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {cauHois.map((cau, i) => (
            <QuestionCard
              key={cau._id}
              cauHoi={cau}
              soThuTu={i + 1}
              selectedAnswer={answers[cau._id] || null}
              onAnswer={() => {}}
              readonly={true}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChiTietAnDanh;

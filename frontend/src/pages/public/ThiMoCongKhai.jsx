/**
 * @fileoverview Trang nhập mã truy cập để thi ẩn danh qua link công khai.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import useAuth from '../../hooks/useAuth';

const ThiMoCongKhai = () => {
  const [searchParams] = useSearchParams();
  const [maTruyCap, setMaTruyCap] = useState('');
  const [hoTen, setHoTen] = useState('');
  const [deThiInfo, setDeThiInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const redirectedToLoginRef = useRef(false);

  const lookupDeThi = useCallback(async (codeOverride) => {
    const code = typeof codeOverride === 'string' ? codeOverride : maTruyCap;
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/public/de-thi-link/${code.trim().toUpperCase()}/thong-tin`);
      setDeThiInfo(res.data);
    } catch (err) {
      setError(err.message || 'Mã truy cập không hợp lệ');
      setDeThiInfo(null);
    } finally { setLoading(false); }
  }, [maTruyCap]);

  useEffect(() => {
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl) {
      setMaTruyCap(codeFromUrl.toUpperCase());
      lookupDeThi(codeFromUrl.toUpperCase());
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const batDauAnDanh = useCallback(async () => {
    if (!hoTen.trim()) { setError('Vui lòng nhập họ tên'); return; }
    const finalCode = (maTruyCap || searchParams.get('code') || '').trim().toUpperCase();
    if (!finalCode) { setError('Mã truy cập không hợp lệ'); return; }
    setLoading(true);
    try {
      const res = await api.post(`/public/de-thi-link/${finalCode}/bat-dau`, { hoTenAnDanh: hoTen.trim() });
      // Lưu anonymous token để dùng trong phiên thi
      sessionStorage.setItem('anon_token', res.data.token);
      navigate(`/lam-bai-an-danh/${res.data.phienThiId}`);
    } catch (err) { setError(err.message || 'Không thể bắt đầu thi. Vui lòng kiểm tra lại link.'); }
    finally { setLoading(false); }
  }, [hoTen, maTruyCap, navigate, searchParams]);

  useEffect(() => {
    const codeFromUrl = (searchParams.get('code') || '').trim().toUpperCase();
    if (codeFromUrl) {
      setMaTruyCap(codeFromUrl);
      lookupDeThi(codeFromUrl);
    }
  }, [searchParams, lookupDeThi]);

  useEffect(() => {
    if (!deThiInfo || !deThiInfo.yeuCauDangNhap || isAuthenticated || redirectedToLoginRef.current) return;
    redirectedToLoginRef.current = true;
    const code = (maTruyCap || searchParams.get('code') || '').trim().toUpperCase();
    navigate('/login', {
      replace: true,
      state: { from: { pathname: '/thi-mo', search: code ? `?code=${code}` : '' } },
    });
  }, [deThiInfo, isAuthenticated, maTruyCap, navigate, searchParams]);

  const batDauDaDangNhap = async () => {
    const code = (maTruyCap || searchParams.get('code') || '').trim().toUpperCase();
    if (!code) { setError('Mã truy cập không hợp lệ'); return; }
    setLoading(true);
    try {
      const res = await api.post(`/public/de-thi-link/${code}/bat-dau-da-dang-nhap`);
      navigate(`/sinh-vien/lam-bai/${res.data.phienThiId}`);
    } catch (err) {
      setError(err.message || 'Không thể bắt đầu thi. Vui lòng kiểm tra quyền truy cập.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #eef2ff, #e0f2fe)', padding: '2rem' }}>
      <div style={{ background: '#fff', borderRadius: '1rem', padding: '2.5rem 2rem', width: '100%', maxWidth: '460px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, textAlign: 'center', marginBottom: '0.5rem', color: '#1e1b4b' }}>🔗 Thi qua link</h1>
        <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '2rem', fontSize: '0.875rem' }}>Nhập mã truy cập để vào bài thi</p>

        {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <input
            type="text" value={maTruyCap}
            onChange={(e) => setMaTruyCap(e.target.value.toUpperCase())}
            placeholder="VD: ABCD1234"
            style={{ flex: 1, padding: '0.6rem 0.875rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem', letterSpacing: '2px', fontWeight: 600, textAlign: 'center' }}
            onKeyDown={(e) => e.key === 'Enter' && lookupDeThi()}
          />
          <button onClick={() => lookupDeThi()} disabled={loading} style={{ padding: '0.6rem 1rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>
            {loading ? '...' : 'Tra cứu'}
          </button>
        </div>

        {deThiInfo && (
          <div style={{ background: '#f9fafb', borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem' }}>{deThiInfo.ten}</h2>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#6b7280', flexWrap: 'wrap' }}>
              <span>📚 {deThiInfo.monHocId?.ten}</span>
              <span>⏱ {deThiInfo.thoiGianPhut} phút</span>
              {deThiInfo.soLanThiToiDa > 0 && <span>🔢 Tối đa {deThiInfo.soLanThiToiDa} lần</span>}
            </div>

            {deThiInfo.yeuCauDangNhap ? (
              <>
                {!isAuthenticated ? (
                  <p style={{ margin: '1rem 0 0', color: '#b45309', fontSize: '0.875rem' }}>
                    Đề thi này yêu cầu đăng nhập tài khoản sinh viên để tham gia.
                  </p>
                ) : user?.vaiTro !== 'SINH_VIEN' ? (
                  <p style={{ margin: '1rem 0 0', color: '#dc2626', fontSize: '0.875rem' }}>
                    Chỉ tài khoản sinh viên mới có thể tham gia đề thi này.
                  </p>
                ) : (
                  <button onClick={batDauDaDangNhap} disabled={loading}
                    style={{ width: '100%', marginTop: '1rem', padding: '0.7rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer', fontSize: '1rem' }}>
                    {loading ? 'Đang vào...' : 'Bắt đầu thi'}
                  </button>
                )}
              </>
            ) : (
              <>
                <div style={{ marginTop: '1rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Họ và tên của bạn *</label>
                  <input
                    type="text" value={hoTen} onChange={(e) => setHoTen(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    style={{ width: '100%', marginTop: '4px', padding: '0.6rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', boxSizing: 'border-box' }}
                  />
                </div>
                <button onClick={batDauAnDanh} disabled={loading}
                  style={{ width: '100%', marginTop: '1rem', padding: '0.7rem', background: '#059669', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer', fontSize: '1rem' }}>
                  {loading ? 'Đang vào...' : 'Bắt đầu thi ngay'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ThiMoCongKhai;

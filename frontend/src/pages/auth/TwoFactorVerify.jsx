import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { verifyTwoFactorLogin } from '../../services/authService';
import useAuth from '../../hooks/useAuth';

const TwoFactorVerify = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const challengeToken = location.state?.challengeToken;
  const email = location.state?.email;
  const fromPathname = location.state?.fromPathname || '/';
  const fromSearch = location.state?.fromSearch || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await verifyTwoFactorLogin({ challengeToken, otpCode });
      login(result);
      const redirect = fromPathname !== '/' ? `${fromPathname}${fromSearch}` : result.nguoiDung?.vaiTro === 'ADMIN' ? '/admin' : result.nguoiDung?.vaiTro === 'GIAO_VIEN' ? '/giao-vien' : '/sinh-vien';
      navigate(redirect, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!challengeToken) {
    return (
      <div className="lowtech-page">
        <div className="lowtech-card">
          <div className="lowtech-alert lowtech-alert-error">Yêu cầu xác thực không hợp lệ. Vui lòng đăng nhập lại.</div>
          <Link to="/login" className="lowtech-link">Quay lại đăng nhập</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="lowtech-page">
      <div className="lowtech-card">
        <div className="lowtech-header">
          <h1 className="lowtech-title">Xác thực 2 bước</h1>
          <p className="lowtech-subtitle">Tài khoản: <strong>{email || 'Không xác định'}</strong></p>
        </div>

        <div className="lowtech-step">
          <div className="lowtech-step-title">Bước 1</div>
          <div className="lowtech-step-text">Mở ứng dụng Google Authenticator trên điện thoại.</div>
        </div>
        <div className="lowtech-step">
          <div className="lowtech-step-title">Bước 2</div>
          <div className="lowtech-step-text">Nhập mã 6 số hiện ra trong ứng dụng, rồi bấm Xác nhận.</div>
        </div>

        {error && <div className="lowtech-alert lowtech-alert-error">{error}</div>}
        <form onSubmit={handleSubmit} className="lowtech-grid">
          <input className="auth-input" type="text" maxLength={6} placeholder="Nhập mã 6 số (ví dụ 123456)" value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))} required />
          <button className="auth-btn auth-btn-primary" type="submit" disabled={loading || otpCode.length !== 6}>
            {loading ? 'Đang xác thực...' : 'Xác nhận'}
          </button>
        </form>
        <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
          <Link to="/login" className="lowtech-link">Quay lại đăng nhập</Link>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorVerify;

import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../../services/authService';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const [matKhauMoi, setMatKhauMoi] = useState('');
  const [matKhauMoi2, setMatKhauMoi2] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (matKhauMoi !== matKhauMoi2) {
      setError('Xác nhận mật khẩu không khớp');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const resMessage = await resetPassword({ token, matKhauMoi });
      setMessage(resMessage || 'Đặt lại mật khẩu thành công');
      setMatKhauMoi('');
      setMatKhauMoi2('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lowtech-page">
      <div className="lowtech-card">
        <div className="lowtech-header">
          <h1 className="lowtech-title">Tạo mật khẩu mới</h1>
          <p className="lowtech-subtitle">Nhập 2 lần cùng một mật khẩu để hoàn tất.</p>
        </div>

        {!token && <div className="lowtech-alert lowtech-alert-error">Liên kết không hợp lệ hoặc đã hết hạn.</div>}
        {message && <div className="lowtech-alert lowtech-alert-success">{message}</div>}
        {error && <div className="lowtech-alert lowtech-alert-error">{error}</div>}

        <div className="lowtech-step">
          <div className="lowtech-step-title">Lưu ý</div>
          <div className="lowtech-step-text">Mật khẩu nên có ít nhất 6 ký tự và bạn dễ nhớ.</div>
        </div>

        <form onSubmit={handleSubmit} className="lowtech-grid">
          <input className="auth-input" type="password" placeholder="Mật khẩu mới" value={matKhauMoi} onChange={(e) => setMatKhauMoi(e.target.value)} minLength={6} required />
          <input className="auth-input" type="password" placeholder="Nhập lại mật khẩu mới" value={matKhauMoi2} onChange={(e) => setMatKhauMoi2(e.target.value)} minLength={6} required />
          <button className="auth-btn auth-btn-primary" type="submit" disabled={loading || !token}>
            {loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
          </button>
        </form>
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <Link to="/login" className="lowtech-link">Đăng nhập</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

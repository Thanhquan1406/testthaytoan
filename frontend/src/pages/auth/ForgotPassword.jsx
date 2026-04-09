import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../../services/authService';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const resMessage = await forgotPassword(email);
      setMessage(resMessage || 'Yêu cầu đã được gửi');
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
          <h1 className="lowtech-title">Quên mật khẩu</h1>
          <p className="lowtech-subtitle">Làm theo 2 bước đơn giản để lấy lại tài khoản.</p>
        </div>

        <div className="lowtech-step">
          <div className="lowtech-step-title">Bước 1: Nhập email đăng ký</div>
          <div className="lowtech-step-text">Hệ thống sẽ gửi liên kết đặt lại mật khẩu vào email này.</div>
        </div>
        <div className="lowtech-step">
          <div className="lowtech-step-title">Bước 2: Mở email và nhấn vào liên kết</div>
          <div className="lowtech-step-text">Nếu chưa thấy email, kiểm tra mục Spam hoặc Thư rác.</div>
        </div>

        {message && <div className="lowtech-alert lowtech-alert-success">{message}</div>}
        {error && <div className="lowtech-alert lowtech-alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="lowtech-grid">
          <input
            className="auth-input"
            type="email"
            placeholder="Ví dụ: nguyenvana@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button className="auth-btn auth-btn-primary" type="submit" disabled={loading || !email.trim()}>
            {loading ? 'Đang gửi...' : 'Gửi liên kết đặt lại'}
          </button>
        </form>
        <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '1rem' }}>
          <Link to="/login" className="lowtech-link">Quay lại đăng nhập</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

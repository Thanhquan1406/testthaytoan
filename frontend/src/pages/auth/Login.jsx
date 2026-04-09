/**
 * @fileoverview Trang đăng nhập cho Sinh viên và Giáo viên.
 */

import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { login, loginGoogle, registerGoogle } from '../../services/authService';
import useAuth from '../../hooks/useAuth';
import CaptchaInput from '../../components/auth/CaptchaInput';

/** Modal bổ sung thông tin sau đăng nhập Google lần đầu */
const GoogleCompleteModal = ({ googleData, onComplete, onClose }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { vaiTro: 'SINH_VIEN' },
  });
  const [serverError, setServerError] = useState('');

  const onSubmit = async (data) => {
    setServerError('');
    try {
      await onComplete(data);
    } catch (err) {
      setServerError(err.message);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem',
    }}>
      <div className="auth-card" style={{ maxWidth: '460px', padding: '2.5rem' }}>
        <h2 className="auth-title" style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>
          Hoàn tất đăng ký
        </h2>
        <p className="auth-subtitle" style={{ marginBottom: '1.5rem' }}>
          Xin chào <strong>{googleData.ho} {googleData.ten}</strong>! Vui lòng bổ sung thông tin để hoàn tất.
        </p>

        {serverError && (
          <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', padding: '0.75rem', borderRadius: '0.75rem', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label className="auth-label">Bạn là</label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {[['SINH_VIEN', 'Sinh viên', '👨‍🎓'], ['GIAO_VIEN', 'Giáo viên', '👨‍🏫']].map(([val, label, icon]) => (
                <label key={val} style={{
                  flex: 1, padding: '0.8rem', border: '2px solid var(--border-default)',
                  borderRadius: '0.75rem', cursor: 'pointer', display: 'flex',
                  alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', fontWeight: 500,
                  transition: 'all 0.2s', background: 'var(--bg-surface)'
                }}
                onMouseOver={(e) => { if (!e.currentTarget.querySelector('input').checked) e.currentTarget.style.borderColor = 'var(--gray-300)' }}
                onMouseOut={(e) => { if (!e.currentTarget.querySelector('input').checked) e.currentTarget.style.borderColor = 'var(--border-default)' }}
                >
                  <input type="radio" value={val} {...register('vaiTro')} 
                    style={{ accentColor: 'var(--primary)', transform: 'scale(1.2)' }}
                    onChange={(e) => {
                      const labels = e.target.closest('div').querySelectorAll('label');
                      labels.forEach(l => {
                        l.style.borderColor = 'var(--border-default)';
                        l.style.background = 'var(--bg-surface)';
                      });
                      e.target.closest('label').style.borderColor = 'var(--primary)';
                      e.target.closest('label').style.background = 'var(--primary-light)';
                    }}
                  />
                  {icon} {label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="auth-label">Số điện thoại</label>
            <input
              type="tel"
              placeholder="09xxxxxxxx"
              className={`auth-input ${errors.soDienThoai ? 'error' : ''}`}
              {...register('soDienThoai', {
                required: 'Vui lòng nhập số điện thoại',
                pattern: { value: /^[0-9]{10,11}$/, message: 'Số điện thoại 10-11 chữ số' },
              })}
            />
            {errors.soDienThoai && (
              <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.2rem', display: 'block' }}>{errors.soDienThoai.message}</span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="auth-btn"
              style={{ flex: 1, background: 'var(--gray-100)', color: 'var(--gray-700)' }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="auth-btn auth-btn-primary"
              style={{ flex: 2 }}
            >
              {isSubmitting ? 'Đang xử lý...' : 'Hoàn tất đăng ký'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Login = () => {
  const { register, handleSubmit, setValue, clearErrors, formState: { errors, isSubmitting } } = useForm();
  const captchaRef = useRef();
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState('');
  const [googlePending, setGooglePending] = useState(null); // { credential, googleData }

  const fromPathname = location.state?.from?.pathname || '/';
  const fromSearch = location.state?.from?.search || '';

  const redirectAfterLogin = (vaiTro) => {
    const redirectTarget = `${fromPathname}${fromSearch}`;
    const redirect = fromPathname !== '/' ? redirectTarget :
      vaiTro === 'GIAO_VIEN' ? '/giao-vien' : '/sinh-vien';
    navigate(redirect, { replace: true });
  };

  const onSubmit = async (data) => {
    setServerError('');
    try {
      const result = await login(data);
      if (result?.requires2FA) {
        navigate('/2fa/verify', {
          state: {
            challengeToken: result.challengeToken,
            email: result.nguoiDung?.email,
            fromPathname,
            fromSearch,
          },
        });
        return;
      }
      authLogin(result);
      redirectAfterLogin(result.nguoiDung.vaiTro);
    } catch (err) {
      setServerError(err.message);
      captchaRef.current?.refresh();
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setServerError('');
    try {
      const result = await loginGoogle(credentialResponse.credential);
      if (result?.needsRegistration) {
        setGooglePending({
          credential: credentialResponse.credential,
          googleData: result.googleData,
        });
      } else {
        if (result?.requires2FA) {
          navigate('/2fa/verify', {
            state: {
              challengeToken: result.challengeToken,
              email: result.nguoiDung?.email,
              fromPathname,
              fromSearch,
            },
          });
          return;
        }
        authLogin(result);
        redirectAfterLogin(result.nguoiDung.vaiTro);
      }
    } catch (err) {
      setServerError(err.message || 'Đăng nhập Google thất bại. Vui lòng thử lại.');
    }
  };

  const handleGoogleError = () => {
    setServerError('Đăng nhập Google thất bại. Vui lòng thử lại.');
  };

  const handleCompleteRegistration = async ({ vaiTro, soDienThoai }) => {
    const result = await registerGoogle({
      credential: googlePending.credential,
      vaiTro,
      soDienThoai,
    });
    authLogin(result);
    setGooglePending(null);
    redirectAfterLogin(result.nguoiDung.vaiTro);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #eef2ff 0%, #e0f2fe 100%)', padding: '2rem'
    }}>
      <div className="auth-card" style={{ maxWidth: '460px', padding: '3rem 2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>🎓</div>
          <h1 className="auth-title">Đăng nhập</h1>
          <p className="auth-subtitle" style={{ margin: 0 }}>
            Hệ thống thi trắc nghiệm trực tuyến
          </p>
        </div>

        {serverError && (
          <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', padding: '0.75rem', borderRadius: '0.75rem', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
            {serverError}
          </div>
        )}

        {/* Nút đăng nhập Google */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            text="signin_with"
            shape="rectangular"
            locale="vi"
            width="100%"
          />
        </div>

        {/* Divider */}
        <div className="auth-divider">
          <span className="auth-divider-text">hoặc đăng nhập bằng email</span>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label className="auth-label">Email hoặc số điện thoại</label>
            <input
              type="text"
              placeholder="Nhập email hoặc SĐT"
              className={`auth-input ${errors.email ? 'error' : ''}`}
              {...register('email', { required: 'Vui lòng nhập email hoặc SĐT' })}
            />
            {errors.email && <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.2rem', display: 'block' }}>{errors.email.message}</span>}
          </div>

          <div>
            <label className="auth-label">Mật khẩu</label>
            <input
              type="password"
              placeholder="Nhập mật khẩu"
              className={`auth-input ${errors.matKhau ? 'error' : ''}`}
              {...register('matKhau', { required: 'Vui lòng nhập mật khẩu' })}
            />
            {errors.matKhau && <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.2rem', display: 'block' }}>{errors.matKhau.message}</span>}
          </div>

          <CaptchaInput
            ref={captchaRef}
            register={register}
            errors={errors}
            setValue={setValue}
            clearErrors={clearErrors}
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="auth-btn auth-btn-primary"
            style={{ marginTop: '0.5rem' }}
          >
            {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
          Chưa có tài khoản?{' '}
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Đăng ký ngay</Link>
        </div>
        <div style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.9rem' }}>
          <Link to="/forgot-password" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
            Quên mật khẩu?
          </Link>
        </div>
        <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem' }}>
          <Link to="/login/admin" style={{ color: 'var(--gray-400)', textDecoration: 'none', fontWeight: 500 }}>
            Đăng nhập với tư cách Admin →
          </Link>
        </div>
      </div>

      {/* Modal bổ sung thông tin cho user Google mới */}
      {googlePending && (
        <GoogleCompleteModal
          googleData={googlePending.googleData}
          onComplete={handleCompleteRegistration}
          onClose={() => setGooglePending(null)}
        />
      )}
    </div>
  );
};

export default Login;

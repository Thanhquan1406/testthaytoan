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

const inputStyle = {
  width: '100%', padding: '0.6rem 0.875rem', border: '1px solid #d1d5db',
  borderRadius: '0.5rem', fontSize: '0.9rem', outline: 'none',
  boxSizing: 'border-box',
};

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
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem',
    }}>
      <div style={{
        background: '#fff', borderRadius: '1rem', padding: '2rem',
        width: '100%', maxWidth: '440px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e1b4b', marginBottom: '0.5rem' }}>
          Hoàn tất đăng ký
        </h2>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          Xin chào <strong>{googleData.ho} {googleData.ten}</strong>! Vui lòng bổ sung thông tin để hoàn tất.
        </p>

        {serverError && (
          <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '0.5rem' }}>
              Bạn là
            </label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {[['SINH_VIEN', 'Sinh viên', '👨‍🎓'], ['GIAO_VIEN', 'Giáo viên', '👨‍🏫']].map(([val, label, icon]) => (
                <label key={val} style={{
                  flex: 1, padding: '0.65rem', border: '2px solid #e5e7eb',
                  borderRadius: '0.5rem', cursor: 'pointer', display: 'flex',
                  alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem',
                }}>
                  <input type="radio" value={val} {...register('vaiTro')} style={{ accentColor: '#4f46e5' }} />
                  {icon} {label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '4px' }}>
              Số điện thoại
            </label>
            <input
              type="tel"
              placeholder="09xxxxxxxx"
              style={{ ...inputStyle, borderColor: errors.soDienThoai ? '#ef4444' : '#d1d5db' }}
              {...register('soDienThoai', {
                required: 'Vui lòng nhập số điện thoại',
                pattern: { value: /^[0-9]{10,11}$/, message: 'Số điện thoại 10-11 chữ số' },
              })}
            />
            {errors.soDienThoai && (
              <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.soDienThoai.message}</span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, padding: '0.65rem', background: '#f3f4f6', color: '#374151',
                border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem',
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                flex: 2, padding: '0.65rem',
                background: isSubmitting ? '#a5b4fc' : '#4f46e5',
                color: '#fff', border: 'none', borderRadius: '0.5rem',
                fontWeight: 600, cursor: isSubmitting ? 'not-allowed' : 'pointer', fontSize: '0.9rem',
              }}
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

  const from = location.state?.from?.pathname || '/';

  const redirectAfterLogin = (vaiTro) => {
    const redirect = from !== '/' ? from :
      vaiTro === 'GIAO_VIEN' ? '/giao-vien' : '/sinh-vien';
    navigate(redirect, { replace: true });
  };

  const onSubmit = async (data) => {
    setServerError('');
    try {
      const result = await login(data);
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
      background: 'linear-gradient(135deg, #eef2ff 0%, #e0f2fe 100%)',
    }}>
      <div style={{
        background: '#fff', borderRadius: '1rem', padding: '2.5rem 2rem',
        boxShadow: '0 10px 40px rgba(0,0,0,0.12)', width: '100%', maxWidth: '420px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎓</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e1b4b' }}>Đăng nhập</h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Hệ thống thi trắc nghiệm trực tuyến
          </p>
        </div>

        {serverError && (
          <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {serverError}
          </div>
        )}

        {/* Nút đăng nhập Google */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            text="signin_with"
            shape="rectangular"
            locale="vi"
            width="340"
          />
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
          <span style={{ color: '#9ca3af', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>hoặc đăng nhập bằng tài khoản</span>
          <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>
              Email hoặc số điện thoại
            </label>
            <input
              type="text"
              placeholder="Nhập email hoặc SĐT"
              style={{ ...inputStyle, borderColor: errors.email ? '#ef4444' : '#d1d5db' }}
              {...register('email', { required: 'Vui lòng nhập email hoặc SĐT' })}
            />
            {errors.email && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.email.message}</span>}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>
              Mật khẩu
            </label>
            <input
              type="password"
              placeholder="Nhập mật khẩu"
              style={{ ...inputStyle, borderColor: errors.matKhau ? '#ef4444' : '#d1d5db' }}
              {...register('matKhau', { required: 'Vui lòng nhập mật khẩu' })}
            />
            {errors.matKhau && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.matKhau.message}</span>}
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
            style={{
              padding: '0.7rem', background: isSubmitting ? '#a5b4fc' : '#4f46e5',
              color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 600,
              cursor: isSubmitting ? 'not-allowed' : 'pointer', fontSize: '1rem',
            }}
          >
            {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
          Chưa có tài khoản?{' '}
          <Link to="/register" style={{ color: '#4f46e5', fontWeight: 600 }}>Đăng ký ngay</Link>
        </div>
        <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.8rem' }}>
          <Link to="/login/admin" style={{ color: '#9ca3af' }}>Đăng nhập với tư cách Admin →</Link>
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

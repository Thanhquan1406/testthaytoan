/**
 * @fileoverview Trang đăng ký tài khoản (Sinh viên hoặc Giáo viên).
 */

import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { register as registerApi, loginGoogle, registerGoogle } from '../../services/authService';
import useAuth from '../../hooks/useAuth';
import CaptchaInput from '../../components/auth/CaptchaInput';

/** Form đăng ký bổ sung sau khi xác thực Google */
const GoogleRegisterForm = ({ googleData, credential, onComplete, onBack }) => {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { vaiTro: 'SINH_VIEN' },
  });
  const [serverError, setServerError] = useState('');

  const onSubmit = async (data) => {
    setServerError('');
    try {
      await onComplete({ ...data, credential });
    } catch (err) {
      setServerError(err.message);
    }
  };

  return (
    <div className="auth-card" style={{ maxWidth: '540px' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>✅</div>
        <h1 className="auth-title">Hoàn tất đăng ký</h1>
        <p className="auth-subtitle" style={{ margin: 0 }}>
          Tài khoản Google: <strong>{googleData.email}</strong>
        </p>
      </div>

      {serverError && (
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', padding: '0.75rem', borderRadius: '0.75rem', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Vai trò */}
        <div>
          <label className="auth-label">Vai trò</label>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {[['SINH_VIEN', 'Sinh viên', '👨‍🎓'], ['GIAO_VIEN', 'Giáo viên', '👨‍🏫']].map(([val, label, icon]) => (
              <label key={val} style={{
                flex: 1, padding: '0.8rem', border: `2px solid ${watch('vaiTro') === val ? 'var(--primary)' : 'var(--border-default)'}`,
                borderRadius: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: watch('vaiTro') === val ? 'var(--primary-light)' : 'var(--bg-surface)',
                transition: 'all 0.2s', fontWeight: 500, fontSize: '0.95rem'
              }}>
                <input type="radio" value={val} {...register('vaiTro')} style={{ display: 'none' }} />
                <span style={{ fontSize: '1.2rem' }}>{icon}</span> {label}
              </label>
            ))}
          </div>
        </div>

        {/* Thông tin từ Google (read-only) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label className="auth-label">Họ</label>
            <input
              type="text"
              value={googleData.ho}
              readOnly
              className="auth-input"
              style={{ background: 'var(--gray-100)', color: 'var(--gray-500)', cursor: 'not-allowed' }}
            />
          </div>
          <div>
            <label className="auth-label">Tên</label>
            <input
              type="text"
              value={googleData.ten}
              readOnly
              className="auth-input"
              style={{ background: 'var(--gray-100)', color: 'var(--gray-500)', cursor: 'not-allowed' }}
            />
          </div>
        </div>

        <div>
          <label className="auth-label">Email</label>
          <input
            type="email"
            value={googleData.email}
            readOnly
            className="auth-input"
            style={{ background: 'var(--gray-100)', color: 'var(--gray-500)', cursor: 'not-allowed' }}
          />
        </div>

        {/* Số điện thoại - bắt buộc */}
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

        <button
          type="submit"
          disabled={isSubmitting}
          className="auth-btn auth-btn-primary"
          style={{ marginTop: '0.5rem' }}
        >
          {isSubmitting ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
        </button>

        <button
          type="button"
          onClick={onBack}
          style={{
            padding: '0.5rem', background: 'none', color: 'var(--text-secondary)',
            border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500,
          }}
          onMouseOver={(e) => e.target.style.color = 'var(--text-primary)'}
          onMouseOut={(e) => e.target.style.color = 'var(--text-secondary)'}
        >
          ← Quay lại
        </button>
      </form>
    </div>
  );
};

const Register = () => {
  const { register, handleSubmit, setValue, clearErrors, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { vaiTro: 'SINH_VIEN' },
  });
  const captchaRef = useRef();
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [googleStep, setGoogleStep] = useState(null); // { credential, googleData }

  const onSubmit = async (data) => {
    setServerError('');
    try {
      const result = await registerApi(data);
      authLogin(result);
      const role = result.nguoiDung.vaiTro;
      navigate(role === 'GIAO_VIEN' ? '/giao-vien' : '/sinh-vien', { replace: true });
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
        setGoogleStep({
          credential: credentialResponse.credential,
          googleData: result.googleData,
        });
      } else {
        // Tài khoản đã tồn tại - đăng nhập luôn
        authLogin(result);
        const role = result.nguoiDung.vaiTro;
        navigate(role === 'GIAO_VIEN' ? '/giao-vien' : '/sinh-vien', { replace: true });
      }
    } catch (err) {
      setServerError(err.message || 'Đăng nhập Google thất bại. Vui lòng thử lại.');
    }
  };

  const handleGoogleError = () => {
    setServerError('Xác thực Google thất bại. Vui lòng thử lại.');
  };

  const handleGoogleRegisterComplete = async ({ credential, vaiTro, soDienThoai }) => {
    const result = await registerGoogle({ credential, vaiTro, soDienThoai });
    authLogin(result);
    const role = result.nguoiDung.vaiTro;
    navigate(role === 'GIAO_VIEN' ? '/giao-vien' : '/sinh-vien', { replace: true });
  };

  // Hiển thị form bổ sung Google
  if (googleStep) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #eef2ff 0%, #e0f2fe 100%)', padding: '2rem',
      }}>
        <GoogleRegisterForm
          googleData={googleStep.googleData}
          credential={googleStep.credential}
          onComplete={handleGoogleRegisterComplete}
          onBack={() => setGoogleStep(null)}
        />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #eef2ff 0%, #e0f2fe 100%)', padding: '2rem',
    }}>
      <div className="auth-card" style={{ maxWidth: '540px' }}>
        <h1 className="auth-title" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          Đăng ký tài khoản
        </h1>

        {serverError && (
          <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', padding: '0.75rem', borderRadius: '0.75rem', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
            {serverError}
          </div>
        )}

        {/* Nút đăng ký bằng Google */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            text="signup_with"
            shape="rectangular"
            locale="vi"
            width="100%"
          />
        </div>

        {/* Divider */}
        <div className="auth-divider">
          <span className="auth-divider-text">hoặc đăng ký bằng email</span>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Vai trò */}
          <div>
            <label className="auth-label">Vai trò</label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {[['SINH_VIEN', 'Sinh viên', '👨‍🎓'], ['GIAO_VIEN', 'Giáo viên', '👨‍🏫']].map(([val, label, icon]) => (
                <label key={val} style={{
                  flex: 1, padding: '0.8rem', border: `2px solid ${watch('vaiTro') === val ? 'var(--primary)' : 'var(--border-default)'}`,
                  borderRadius: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: watch('vaiTro') === val ? 'var(--primary-light)' : 'var(--bg-surface)',
                  transition: 'all 0.2s', fontWeight: 500, fontSize: '0.95rem'
                }}>
                  <input type="radio" value={val} {...register('vaiTro')} style={{ display: 'none' }} />
                  <span style={{ fontSize: '1.2rem' }}>{icon}</span> {label}
                </label>
              ))}
            </div>
          </div>

          {/* Họ và Tên */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="auth-label">Họ</label>
              <input type="text" placeholder="Nguyễn" className={`auth-input ${errors.ho ? 'error' : ''}`}
                {...register('ho', { required: 'Nhập họ' })} />
              {errors.ho && <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.2rem', display: 'block' }}>{errors.ho.message}</span>}
            </div>
            <div>
              <label className="auth-label">Tên</label>
              <input type="text" placeholder="Văn A" className={`auth-input ${errors.ten ? 'error' : ''}`}
                {...register('ten', { required: 'Nhập tên' })} />
              {errors.ten && <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.2rem', display: 'block' }}>{errors.ten.message}</span>}
            </div>
          </div>

          <div>
            <label className="auth-label">Email</label>
            <input type="email" placeholder="example@email.com" className={`auth-input ${errors.email ? 'error' : ''}`}
              {...register('email', { required: 'Nhập email', pattern: { value: /\S+@\S+\.\S+/, message: 'Email không hợp lệ' } })} />
            {errors.email && <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.2rem', display: 'block' }}>{errors.email.message}</span>}
          </div>

          <div>
            <label className="auth-label">Số điện thoại</label>
            <input type="tel" placeholder="09xxxxxxxx" className={`auth-input ${errors.soDienThoai ? 'error' : ''}`}
              {...register('soDienThoai', { required: 'Nhập SĐT', pattern: { value: /^[0-9]{10,11}$/, message: 'SĐT 10-11 số' } })} />
            {errors.soDienThoai && <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.2rem', display: 'block' }}>{errors.soDienThoai.message}</span>}
          </div>

          <div>
            <label className="auth-label">Mật khẩu</label>
            <input type="password" placeholder="Tối thiểu 6 ký tự" className={`auth-input ${errors.matKhau ? 'error' : ''}`}
              {...register('matKhau', { required: 'Nhập mật khẩu', minLength: { value: 6, message: 'Tối thiểu 6 ký tự' } })} />
            {errors.matKhau && <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.2rem', display: 'block' }}>{errors.matKhau.message}</span>}
          </div>

          <CaptchaInput ref={captchaRef} register={register} errors={errors} setValue={setValue} clearErrors={clearErrors} />

          <button
            type="submit"
            disabled={isSubmitting}
            className="auth-btn auth-btn-primary"
            style={{ marginTop: '0.5rem' }}
          >
            {isSubmitting ? 'Đang đăng ký...' : 'Đăng ký'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
          Đã có tài khoản?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Đăng nhập</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;

/**
 * @fileoverview Trang đăng nhập cho Sinh viên và Giáo viên.
 */

import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { login } from '../../services/authService';
import useAuth from '../../hooks/useAuth';
import CaptchaInput from '../../components/auth/CaptchaInput';

const inputStyle = {
  width: '100%', padding: '0.6rem 0.875rem', border: '1px solid #d1d5db',
  borderRadius: '0.5rem', fontSize: '0.9rem', outline: 'none',
  boxSizing: 'border-box',
};

const Login = () => {
  const { register, handleSubmit, setValue, clearErrors, formState: { errors, isSubmitting } } = useForm();
  const captchaRef = useRef();
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState('');

  const from = location.state?.from?.pathname || '/';

  const onSubmit = async (data) => {
    setServerError('');
    try {
      const result = await login(data);
      authLogin(result);

      // Chuyển về trang trước hoặc dashboard theo role
      const role = result.nguoiDung.vaiTro;
      const redirect = from !== '/' ? from :
        role === 'GIAO_VIEN' ? '/giao-vien' : '/sinh-vien';
      navigate(redirect, { replace: true });
    } catch (err) {
      setServerError(err.message);
      captchaRef.current?.refresh();
    }
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
    </div>
  );
};

export default Login;

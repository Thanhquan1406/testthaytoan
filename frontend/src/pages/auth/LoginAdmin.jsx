/**
 * @fileoverview Trang đăng nhập Admin.
 */

import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { loginAdmin } from '../../services/authService';
import useAuth from '../../hooks/useAuth';
import CaptchaInput from '../../components/auth/CaptchaInput';

const LoginAdmin = () => {
  const { register, handleSubmit, setValue, clearErrors, formState: { errors, isSubmitting } } = useForm();
  const captchaRef = useRef();
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const onSubmit = async (data) => {
    setServerError('');
    try {
      const result = await loginAdmin(data);
      if (result?.requires2FA) {
        navigate('/2fa/verify', {
          state: {
            challengeToken: result.challengeToken,
            email: result.nguoiDung?.email,
            fromPathname: '/admin',
            fromSearch: '',
          },
        });
        return;
      }
      authLogin(result);
      navigate('/admin', { replace: true });
    } catch (err) {
      setServerError(err.message);
      captchaRef.current?.refresh();
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', padding: '2rem'
    }}>
      <div className="auth-card" style={{ maxWidth: '420px', padding: '2.5rem 2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🔐</div>
          <h1 className="auth-title" style={{ fontSize: '1.6rem' }}>Đăng nhập Admin</h1>
        </div>

        {serverError && (
          <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', padding: '0.75rem', borderRadius: '0.75rem', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label className="auth-label">Email Admin</label>
            <input type="email" placeholder="admin@example.com"
              className={`auth-input ${errors.email ? 'error' : ''}`}
              {...register('email', { required: 'Nhập email admin' })} />
            {errors.email && <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.2rem', display: 'block' }}>{errors.email.message}</span>}
          </div>
          <div>
            <label className="auth-label">Mật khẩu</label>
            <input type="password" placeholder="Nhập mật khẩu"
              className={`auth-input ${errors.matKhau ? 'error' : ''}`}
              {...register('matKhau', { required: 'Nhập mật khẩu' })} />
            {errors.matKhau && <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.2rem', display: 'block' }}>{errors.matKhau.message}</span>}
          </div>
          <CaptchaInput ref={captchaRef} register={register} errors={errors} setValue={setValue} clearErrors={clearErrors} />
          
          <button
            type="submit" disabled={isSubmitting}
            className="auth-btn auth-btn-primary"
            style={{ marginTop: '0.5rem', background: '#1e1b4b', boxShadow: '0 4px 14px 0 rgba(30, 27, 75, 0.3)' }}
          >
            {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem' }}>
          <Link to="/login" style={{ color: '#6b7280', fontWeight: 500, textDecoration: 'none' }}>← Quay về đăng nhập thường</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginAdmin;

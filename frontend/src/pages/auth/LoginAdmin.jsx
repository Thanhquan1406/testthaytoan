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
      background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
    }}>
      <div style={{
        background: '#fff', borderRadius: '1rem', padding: '2.5rem 2rem',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)', width: '100%', maxWidth: '400px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔐</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e1b4b' }}>Đăng nhập Admin</h1>
        </div>

        {serverError && (
          <div style={{ background: '#fee2e2', color: '#dc2626', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>Email Admin</label>
            <input type="email" placeholder="admin@example.com"
              style={{ width: '100%', padding: '0.6rem 0.875rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', marginTop: '4px' }}
              {...register('email', { required: 'Nhập email admin' })} />
          </div>
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>Mật khẩu</label>
            <input type="password" placeholder="Nhập mật khẩu"
              style={{ width: '100%', padding: '0.6rem 0.875rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', marginTop: '4px' }}
              {...register('matKhau', { required: 'Nhập mật khẩu' })} />
          </div>
          <CaptchaInput ref={captchaRef} register={register} errors={errors} setValue={setValue} clearErrors={clearErrors} />
          <button
            type="submit" disabled={isSubmitting}
            style={{
              padding: '0.7rem', background: isSubmitting ? '#6b7280' : '#1e1b4b',
              color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 600,
              cursor: isSubmitting ? 'not-allowed' : 'pointer', fontSize: '1rem',
            }}
          >
            {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8rem' }}>
          <Link to="/login" style={{ color: '#6b7280' }}>← Quay về đăng nhập thường</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginAdmin;

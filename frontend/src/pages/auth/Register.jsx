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

const inputStyle = {
  width: '100%', padding: '0.6rem 0.875rem', border: '1px solid #d1d5db',
  borderRadius: '0.5rem', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box',
};

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
    <div style={{
      background: '#fff', borderRadius: '1rem', padding: '2.5rem 2rem',
      boxShadow: '0 10px 40px rgba(0,0,0,0.12)', width: '100%', maxWidth: '500px',
    }}>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✅</div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1e1b4b' }}>Hoàn tất đăng ký</h1>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Tài khoản Google: <strong>{googleData.email}</strong>
        </p>
      </div>

      {serverError && (
        <div style={{ background: '#fee2e2', color: '#dc2626', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Vai trò */}
        <div>
          <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>Vai trò</label>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            {[['SINH_VIEN', 'Sinh viên', '👨‍🎓'], ['GIAO_VIEN', 'Giáo viên', '👨‍🏫']].map(([val, label, icon]) => (
              <label key={val} style={{
                flex: 1, padding: '0.75rem', border: `2px solid ${watch('vaiTro') === val ? '#4f46e5' : '#e5e7eb'}`,
                borderRadius: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: watch('vaiTro') === val ? '#eef2ff' : '#fff',
              }}>
                <input type="radio" value={val} {...register('vaiTro')} style={{ display: 'none' }} />
                {icon} {label}
              </label>
            ))}
          </div>
        </div>

        {/* Thông tin từ Google (read-only) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>Họ</label>
            <input
              type="text"
              value={googleData.ho}
              readOnly
              style={{ ...inputStyle, background: '#f9fafb', color: '#6b7280', cursor: 'not-allowed' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>Tên</label>
            <input
              type="text"
              value={googleData.ten}
              readOnly
              style={{ ...inputStyle, background: '#f9fafb', color: '#6b7280', cursor: 'not-allowed' }}
            />
          </div>
        </div>

        <div>
          <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>Email</label>
          <input
            type="email"
            value={googleData.email}
            readOnly
            style={{ ...inputStyle, background: '#f9fafb', color: '#6b7280', cursor: 'not-allowed' }}
          />
        </div>

        {/* Số điện thoại - bắt buộc */}
        <div>
          <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>Số điện thoại</label>
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

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            padding: '0.7rem', background: isSubmitting ? '#a5b4fc' : '#4f46e5',
            color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 600,
            cursor: isSubmitting ? 'not-allowed' : 'pointer', fontSize: '1rem', marginTop: '0.25rem',
          }}
        >
          {isSubmitting ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
        </button>

        <button
          type="button"
          onClick={onBack}
          style={{
            padding: '0.5rem', background: 'none', color: '#6b7280',
            border: 'none', cursor: 'pointer', fontSize: '0.875rem', textDecoration: 'underline',
          }}
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
      <div style={{
        background: '#fff', borderRadius: '1rem', padding: '2.5rem 2rem',
        boxShadow: '0 10px 40px rgba(0,0,0,0.12)', width: '100%', maxWidth: '500px',
      }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e1b4b', marginBottom: '1.5rem', textAlign: 'center' }}>
          Đăng ký tài khoản
        </h1>

        {serverError && (
          <div style={{ background: '#fee2e2', color: '#dc2626', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {serverError}
          </div>
        )}

        {/* Nút đăng ký bằng Google */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            text="signup_with"
            shape="rectangular"
            locale="vi"
            width="440"
          />
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
          <span style={{ color: '#9ca3af', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>hoặc đăng ký bằng email</span>
          <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Vai trò */}
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>Vai trò</label>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              {[['SINH_VIEN', 'Sinh viên', '👨‍🎓'], ['GIAO_VIEN', 'Giáo viên', '👨‍🏫']].map(([val, label, icon]) => (
                <label key={val} style={{
                  flex: 1, padding: '0.75rem', border: `2px solid ${watch('vaiTro') === val ? '#4f46e5' : '#e5e7eb'}`,
                  borderRadius: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: watch('vaiTro') === val ? '#eef2ff' : '#fff',
                }}>
                  <input type="radio" value={val} {...register('vaiTro')} style={{ display: 'none' }} />
                  {icon} {label}
                </label>
              ))}
            </div>
          </div>

          {/* Họ và Tên */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>Họ</label>
              <input type="text" placeholder="Nguyễn" style={inputStyle}
                {...register('ho', { required: 'Nhập họ' })} />
              {errors.ho && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.ho.message}</span>}
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>Tên</label>
              <input type="text" placeholder="Văn A" style={inputStyle}
                {...register('ten', { required: 'Nhập tên' })} />
              {errors.ten && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.ten.message}</span>}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>Email</label>
            <input type="email" placeholder="example@email.com" style={inputStyle}
              {...register('email', { required: 'Nhập email', pattern: { value: /\S+@\S+\.\S+/, message: 'Email không hợp lệ' } })} />
            {errors.email && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.email.message}</span>}
          </div>

          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>Số điện thoại</label>
            <input type="tel" placeholder="09xxxxxxxx" style={inputStyle}
              {...register('soDienThoai', { required: 'Nhập SĐT', pattern: { value: /^[0-9]{10,11}$/, message: 'SĐT 10-11 số' } })} />
            {errors.soDienThoai && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.soDienThoai.message}</span>}
          </div>

          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>Mật khẩu</label>
            <input type="password" placeholder="Tối thiểu 6 ký tự" style={inputStyle}
              {...register('matKhau', { required: 'Nhập mật khẩu', minLength: { value: 6, message: 'Tối thiểu 6 ký tự' } })} />
            {errors.matKhau && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.matKhau.message}</span>}
          </div>

          <CaptchaInput ref={captchaRef} register={register} errors={errors} setValue={setValue} clearErrors={clearErrors} />

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: '0.7rem', background: isSubmitting ? '#a5b4fc' : '#4f46e5',
              color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 600,
              cursor: isSubmitting ? 'not-allowed' : 'pointer', fontSize: '1rem',
            }}
          >
            {isSubmitting ? 'Đang đăng ký...' : 'Đăng ký'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
          Đã có tài khoản?{' '}
          <Link to="/login" style={{ color: '#4f46e5', fontWeight: 600 }}>Đăng nhập</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;

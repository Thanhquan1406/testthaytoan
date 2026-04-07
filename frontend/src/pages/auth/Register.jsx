/**
 * @fileoverview Trang đăng ký tài khoản (Sinh viên hoặc Giáo viên).
 */

import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { register as registerApi } from '../../services/authService';
import useAuth from '../../hooks/useAuth';
import CaptchaInput from '../../components/auth/CaptchaInput';

const inputStyle = {
  width: '100%', padding: '0.6rem 0.875rem', border: '1px solid #d1d5db',
  borderRadius: '0.5rem', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box',
};

const Register = () => {
  const { register, handleSubmit, setValue, clearErrors, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { vaiTro: 'SINH_VIEN' },
  });
  const captchaRef = useRef();
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

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

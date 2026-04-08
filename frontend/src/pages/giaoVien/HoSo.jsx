/**
 * @fileoverview Hồ sơ Giáo viên - xem và chỉnh sửa thông tin.
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import { useState, useEffect } from 'react';

const HoSo = () => {
  const [tab, setTab] = useState('info');
  const [msg, setMsg] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['gv-ho-so'],
    queryFn: () => api.get('/giao-vien/ho-so').then((r) => r.data),
  });

  const { register, handleSubmit, reset } = useForm();
  useEffect(() => { if (data) reset({ ho: data.ho, ten: data.ten, soDienThoai: data.soDienThoai }); }, [data, reset]);

  const updateMutation = useMutation({
    mutationFn: (d) => api.put('/giao-vien/ho-so', d),
    onSuccess: () => setMsg('Cập nhật thành công!'),
  });

  const { register: regPw, handleSubmit: hsPw } = useForm();
  const pwMutation = useMutation({
    mutationFn: (d) => api.post('/giao-vien/ho-so/doi-mat-khau', d),
    onSuccess: () => setMsg('Đổi mật khẩu thành công!'),
  });

  const inputStyle = { width: '100%', padding: '0.6rem 0.75rem', border: '1px solid var(--border-default)', borderRadius: '0.5rem', boxSizing: 'border-box' };
  const tabBtnStyle = (active) => ({
    padding: '0.5rem 1rem', border: 'none', cursor: 'pointer', fontWeight: active ? 600 : 400,
    background: active ? '#4f46e5' : 'var(--bg-surface-muted)', color: active ? '#fff' : 'var(--text-primary)', borderRadius: '0.375rem',
  });

  if (isLoading) return <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Đang tải...</div>;

  return (
    <div style={{ maxWidth: 600 }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Hồ sơ của tôi</h1>
      <div style={{ background: 'var(--bg-surface)', borderRadius: '0.75rem', padding: '1.5rem', boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <button style={tabBtnStyle(tab === 'info')} onClick={() => setTab('info')}>Thông tin</button>
          <button style={tabBtnStyle(tab === 'pw')} onClick={() => setTab('pw')}>Đổi mật khẩu</button>
        </div>
        {msg && <div style={{ background: '#d1fae5', color: '#065f46', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>{msg}</div>}

        {tab === 'info' && (
          <form onSubmit={handleSubmit((d) => updateMutation.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div><label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Họ</label><input {...register('ho')} style={{ ...inputStyle, marginTop: 4 }} /></div>
              <div><label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Tên</label><input {...register('ten')} style={{ ...inputStyle, marginTop: 4 }} /></div>
            </div>
            <div><label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Email</label><input value={data?.email} disabled style={{ ...inputStyle, marginTop: 4, background: 'var(--bg-surface-muted)', color: 'var(--text-secondary)' }} /></div>
            <div><label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Số điện thoại</label><input {...register('soDienThoai')} style={{ ...inputStyle, marginTop: 4 }} /></div>
            <button type="submit" style={{ padding: '0.6rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>Lưu thay đổi</button>
          </form>
        )}

        {tab === 'pw' && (
          <form onSubmit={hsPw((d) => pwMutation.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div><label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Mật khẩu cũ</label><input type="password" {...regPw('matKhauCu')} style={{ ...inputStyle, marginTop: 4 }} /></div>
            <div><label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Mật khẩu mới</label><input type="password" {...regPw('matKhauMoi')} style={{ ...inputStyle, marginTop: 4 }} /></div>
            <div><label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Xác nhận mật khẩu</label><input type="password" {...regPw('matKhauMoi2')} style={{ ...inputStyle, marginTop: 4 }} /></div>
            <button type="submit" style={{ padding: '0.6rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>Đổi mật khẩu</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default HoSo;

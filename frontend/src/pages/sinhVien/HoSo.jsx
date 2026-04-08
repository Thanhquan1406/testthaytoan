/**
 * @fileoverview Hồ sơ Sinh viên - giống GV nhưng role khác.
 */

import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import api from '../../services/api';

const HoSo = () => {
  const [tab, setTab] = useState('info');
  const [msg, setMsg] = useState('');

  const { data } = useQuery({
    queryKey: ['sv-ho-so'],
    queryFn: () => api.get('/sinh-vien/ho-so').then((r) => r.data),
  });

  const { register, handleSubmit, reset } = useForm();
  useEffect(() => { if (data) reset({ ho: data.ho, ten: data.ten, soDienThoai: data.soDienThoai }); }, [data, reset]);

  const { register: regPw, handleSubmit: hsPw } = useForm();

  const inputStyle = { width: '100%', padding: '0.6rem 0.75rem', border: '1px solid var(--border-default)', borderRadius: '0.5rem', boxSizing: 'border-box', marginTop: '4px' };
  const tabBtn = (active) => ({ padding: '0.5rem 1rem', border: 'none', cursor: 'pointer', fontWeight: active ? 600 : 400, background: active ? '#4f46e5' : 'var(--bg-surface-muted)', color: active ? '#fff' : 'var(--text-primary)', borderRadius: '0.375rem' });

  return (
    <div style={{ maxWidth: 600 }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Hồ sơ của tôi</h1>
      <div style={{ background: 'var(--bg-surface)', borderRadius: '0.75rem', padding: '1.5rem', boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <button style={tabBtn(tab === 'info')} onClick={() => setTab('info')}>Thông tin</button>
          <button style={tabBtn(tab === 'pw')} onClick={() => setTab('pw')}>Đổi mật khẩu</button>
        </div>
        {msg && <div style={{ background: '#d1fae5', color: '#065f46', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>{msg}</div>}

        {tab === 'info' && (
          <form onSubmit={handleSubmit(async (d) => {
            await api.put('/sinh-vien/ho-so', d);
            setMsg('Cập nhật thành công!');
          })} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div><label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Họ</label><input {...register('ho')} style={inputStyle} /></div>
              <div><label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Tên</label><input {...register('ten')} style={inputStyle} /></div>
            </div>
            <div><label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Email</label><input value={data?.email || ''} disabled style={{ ...inputStyle, background: 'var(--bg-surface-muted)', color: 'var(--text-secondary)' }} /></div>
            <div><label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Mã sinh viên</label><input value={data?.maNguoiDung || ''} disabled style={{ ...inputStyle, background: 'var(--bg-surface-muted)', color: 'var(--text-secondary)' }} /></div>
            <div><label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Số điện thoại</label><input {...register('soDienThoai')} style={inputStyle} /></div>
            <button type="submit" style={{ padding: '0.6rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>Lưu thay đổi</button>
          </form>
        )}

        {tab === 'pw' && (
          <form onSubmit={hsPw(async (d) => {
            await api.post('/sinh-vien/ho-so/doi-mat-khau', d);
            setMsg('Đổi mật khẩu thành công!');
          })} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div><label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Mật khẩu cũ</label><input type="password" {...regPw('matKhauCu')} style={inputStyle} /></div>
            <div><label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Mật khẩu mới</label><input type="password" {...regPw('matKhauMoi')} style={inputStyle} /></div>
            <div><label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Xác nhận</label><input type="password" {...regPw('matKhauMoi2')} style={inputStyle} /></div>
            <button type="submit" style={{ padding: '0.6rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>Đổi mật khẩu</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default HoSo;

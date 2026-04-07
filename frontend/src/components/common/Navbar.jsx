/**
 * @fileoverview Navbar trên cùng - hiển thị tên user và nút đăng xuất.
 */

import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const vaiTroLabel = { ADMIN: 'Admin', GIAO_VIEN: 'Giáo viên', SINH_VIEN: 'Sinh viên' };

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header
      style={{
        height: '64px', background: '#fff', borderBottom: '1px solid #e5e7eb',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 1.5rem', position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#4f46e5' }}>
          🎓 Thi Trắc Nghiệm
        </span>
      </div>

      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#111827' }}>{user.hoTen}</div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              {vaiTroLabel[user.vaiTro] || user.vaiTro} • {user.maNguoiDung}
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: '0.4rem 1rem', background: '#fee2e2', border: '1px solid #fca5a5',
              borderRadius: '0.5rem', color: '#dc2626', cursor: 'pointer', fontWeight: 500,
              fontSize: '0.875rem',
            }}
          >
            Đăng xuất
          </button>
        </div>
      )}
    </header>
  );
};

export default Navbar;

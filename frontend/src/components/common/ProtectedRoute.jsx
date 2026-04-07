/**
 * @fileoverview Route guard - kiểm tra auth và vai trò trước khi render trang.
 */

import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';

/**
 * @param {{ children: React.ReactNode, requiredRole?: string|string[] }} props
 * - Không truyền requiredRole → chỉ cần đăng nhập
 * - Truyền requiredRole → kiểm tra thêm vai trò
 */
const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner fullPage />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole) {
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!allowedRoles.includes(user?.vaiTro)) {
      // Chuyển về dashboard tương ứng vai trò thực tế
      const fallback = getDashboardByRole(user?.vaiTro);
      return <Navigate to={fallback} replace />;
    }
  }

  return children;
};

/**
 * Lấy đường dẫn dashboard theo vai trò
 * @param {string} vaiTro
 * @returns {string}
 */
const getDashboardByRole = (vaiTro) => {
  switch (vaiTro) {
    case 'ADMIN': return '/admin';
    case 'GIAO_VIEN': return '/giao-vien';
    case 'SINH_VIEN': return '/sinh-vien';
    default: return '/login';
  }
};

export default ProtectedRoute;

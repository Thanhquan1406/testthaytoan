/**
 * @fileoverview Hook wrapper cho AuthContext - tiện lợi hơn khi dùng trong components.
 */

import { useAuthContext } from '../contexts/AuthContext';

/**
 * Lấy auth state và actions từ context
 * @returns {import('../contexts/AuthContext').AuthContextValue & {
 *   isAdmin: boolean,
 *   isGiaoVien: boolean,
 *   isSinhVien: boolean
 * }}
 */
const useAuth = () => {
  const auth = useAuthContext();

  return {
    ...auth,
    isAdmin: auth.user?.vaiTro === 'ADMIN',
    isGiaoVien: auth.user?.vaiTro === 'GIAO_VIEN',
    isSinhVien: auth.user?.vaiTro === 'SINH_VIEN',
  };
};

export default useAuth;

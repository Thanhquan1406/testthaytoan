/**
 * @fileoverview App root - cấu hình routing theo vai trò (role-based routing).
 * Layout: Navbar + Sidebar + Main content cho các trang cần auth.
 */

import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';
import ProtectedRoute from './components/common/ProtectedRoute';
import useAuth from './hooks/useAuth';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import LoginAdmin from './pages/auth/LoginAdmin';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminNguoiDung from './pages/admin/NguoiDung';
import AdminMonHoc from './pages/admin/MonHoc';
import AdminDeThi from './pages/admin/DeThi';
import AdminCauHoi from './pages/admin/CauHoi';

// Giáo viên pages
import GVDashboard from './pages/giaoVien/Dashboard';
import GVDeThi from './pages/giaoVien/DeThi';
import ChonPhuongThucTaoDe from './pages/giaoVien/ChonPhuongThucTaoDe';
import TrangSoanThaoDeThi from './pages/giaoVien/TrangSoanThaoDeThi';
import GVChinhSuaCauHoi from './pages/giaoVien/ChinhSuaCauHoi';
import GVLopHoc from './pages/giaoVien/LopHoc';

// Ngân hàng câu hỏi (Shared)
import NganHangCauHoiList from './pages/giaoVien/NganHangCauHoi';
import XemNganHangCauHoi from './pages/giaoVien/XemNganHangCauHoi';
import ImportFile from './pages/giaoVien/ImportFile';
import TrangSoanThao from './pages/giaoVien/TrangSoanThao';
import TaoMaTranDe from './pages/giaoVien/TaoMaTranDe';
import GVSinhVien from './pages/giaoVien/SinhVien';
import GVKetQua from './pages/giaoVien/KetQua';
import GVTheoDoi from './pages/giaoVien/TheoDoi';
import GVXemBai from './pages/giaoVien/XemBaiThi';
import GVHoSo from './pages/giaoVien/HoSo';

// Sinh viên pages
import SVDashboard from './pages/sinhVien/Dashboard';
import SVPhongThi from './pages/sinhVien/PhongThi';
import SVPhongThiChiTiet from './pages/sinhVien/PhongThiChiTiet';
import SVLamBai from './pages/sinhVien/LamBai';
import SVKetQua from './pages/sinhVien/KetQua';
import SVLichSu from './pages/sinhVien/LichSuThi';
import SVLichSuChiTiet from './pages/sinhVien/LichSuChiTiet';
import SVHoSo from './pages/sinhVien/HoSo';

// Public pages
import ThiMoCongKhai from './pages/public/ThiMoCongKhai';
import LamBaiAnDanh from './pages/public/LamBaiAnDanh';
import KetQuaAnDanh from './pages/public/KetQuaAnDanh';
import ChiTietAnDanh from './pages/public/ChiTietAnDanh';

// ─── SIDEBAR CONFIGS ─────────────────────────────────────────────────────────

const ADMIN_NAV = [
  { to: '/admin', label: 'Dashboard', icon: '📊' },
  { to: '/admin/nguoi-dung', label: 'Người dùng', icon: '👥' },
  { to: '/admin/mon-hoc', label: 'Môn học', icon: '📚' },
  { to: '/admin/de-thi', label: 'Đề thi', icon: '📄' },
  { to: '/admin/cau-hoi', label: 'Ngân hàng câu hỏi', icon: '❓' },
];

const GV_NAV = [
  { to: '/giao-vien', label: 'Dashboard', icon: '📊' },
  { to: '/giao-vien/de-thi', label: 'Đề thi', icon: '📄' },
  { to: '/ngan-hang/dashboard', label: 'Ngân hàng câu hỏi', icon: '❓' },
  { to: '/giao-vien/lop-hoc', label: 'Lớp học', icon: '🏫' },
  { to: '/giao-vien/sinh-vien', label: 'Sinh viên', icon: '👨‍🎓' },
  { to: '/giao-vien/ket-qua', label: 'Kết quả', icon: '📊' },
  { to: '/giao-vien/theo-doi', label: 'Theo dõi thi', icon: '👁' },
  { to: '/giao-vien/ho-so', label: 'Hồ sơ', icon: '👤' },
];

const SV_NAV = [
  { to: '/sinh-vien', label: 'Tổng quan', icon: '🏠' },
  { to: '/sinh-vien/phong-thi', label: 'Phòng thi', icon: '🚪' },
  { to: '/sinh-vien/lich-su', label: 'Lịch sử thi', icon: '📋' },
  { to: '/sinh-vien/ho-so', label: 'Hồ sơ', icon: '👤' },
];

// ─── LAYOUT COMPONENT ────────────────────────────────────────────────────────

/**
 * Layout chuẩn có Navbar + Sidebar + Main content area
 * @param {{ navItems: object[], sidebarTitle?: string }} props
 */
const DashboardLayout = ({ navItems, sidebarTitle }) => (
  <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
    <Navbar />
    <div style={{ display: 'flex', flex: 1 }}>
      <Sidebar items={navItems} title={sidebarTitle} />
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto', maxHeight: 'calc(100vh - 64px)' }}>
        <Outlet />
      </main>
    </div>
  </div>
);

/**
 * Shared Layout dùng cho các trang chức năng chung (ví dụ: Ngân hàng câu hỏi)
 * Tự động chọn NavItems dựa vào Role hiện tại của User
 */
const SharedDashboardLayout = () => {
  const { user } = useAuth();
  const isAdmin = user?.vaiTro === 'ADMIN';
  const navItems = isAdmin ? ADMIN_NAV : GV_NAV;
  const sidebarTitle = isAdmin ? "QUẢN TRỊ" : "GIÁO VIÊN";

  return <DashboardLayout navItems={navItems} sidebarTitle={sidebarTitle} />;
};

// ─── APP ─────────────────────────────────────────────────────────────────────

const App = () => (
  <BrowserRouter>
    <Routes>
      {/* Trang chủ - redirect theo role */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Auth */}
      <Route path="/login" element={<Login />} />
      <Route path="/login/admin" element={<LoginAdmin />} />
      <Route path="/register" element={<Register />} />

      {/* Public - thi ẩn danh */}
      <Route path="/thi-mo" element={<ThiMoCongKhai />} />
      <Route path="/lam-bai-an-danh/:phienThiId" element={<LamBaiAnDanh />} />
      <Route path="/ket-qua-an-danh/:phienThiId" element={<KetQuaAnDanh />} />
      <Route path="/chi-tiet-an-danh/:phienThiId" element={<ChiTietAnDanh />} />

      {/* Admin routes */}
      <Route element={<ProtectedRoute requiredRole="ADMIN"><DashboardLayout navItems={ADMIN_NAV} sidebarTitle="QUẢN TRỊ" /></ProtectedRoute>}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/nguoi-dung" element={<AdminNguoiDung />} />
        <Route path="/admin/mon-hoc" element={<AdminMonHoc />} />
        <Route path="/admin/de-thi" element={<AdminDeThi />} />
        <Route path="/admin/cau-hoi" element={<AdminCauHoi />} />
      </Route>

      {/* Giáo viên routes */}
      <Route element={<ProtectedRoute requiredRole="GIAO_VIEN"><DashboardLayout navItems={GV_NAV} sidebarTitle="GIÁO VIÊN" /></ProtectedRoute>}>
        <Route path="/giao-vien" element={<GVDashboard />} />
        <Route path="/giao-vien/de-thi" element={<GVDeThi />} />
        <Route path="/giao-vien/de-thi/tao-moi" element={<ChonPhuongThucTaoDe />} />
        <Route path="/giao-vien/de-thi/:deThiId/chinh-sua" element={<GVChinhSuaCauHoi />} />
        <Route path="/giao-vien/lop-hoc" element={<GVLopHoc />} />
        <Route path="/giao-vien/sinh-vien" element={<GVSinhVien />} />
        <Route path="/giao-vien/ket-qua" element={<GVKetQua />} />
        <Route path="/giao-vien/ket-qua/xem/:phienThiId" element={<GVXemBai />} />
        <Route path="/giao-vien/theo-doi" element={<GVTheoDoi />} />
        <Route path="/giao-vien/ho-so" element={<GVHoSo />} />
      </Route>

      {/* Shared routes (ADMIN & GIAO_VIEN) - Ngân hàng câu hỏi */}
      <Route element={<ProtectedRoute requiredRole={["ADMIN", "GIAO_VIEN"]}><SharedDashboardLayout /></ProtectedRoute>}>
        <Route path="/ngan-hang/dashboard" element={<NganHangCauHoiList />} />
        <Route path="/ngan-hang/view-ngan-hang" element={<XemNganHangCauHoi />} />
        <Route path="/ngan-hang/choose-import-question-mode" element={<ImportFile />} />
        <Route path="/ngan-hang/editor" element={<TrangSoanThao />} />
        <Route path="/ngan-hang/tao-ma-tran" element={<TaoMaTranDe />} />
      </Route>

      {/* Sinh viên routes */}
      <Route element={<ProtectedRoute requiredRole="SINH_VIEN"><DashboardLayout navItems={SV_NAV} sidebarTitle="SINH VIÊN" /></ProtectedRoute>}>
        <Route path="/sinh-vien" element={<SVDashboard />} />
        <Route path="/sinh-vien/phong-thi" element={<SVPhongThi />} />
        <Route path="/sinh-vien/phong-thi/:lopId" element={<SVPhongThiChiTiet />} />
        <Route path="/sinh-vien/lich-su" element={<SVLichSu />} />
        <Route path="/sinh-vien/lich-su/:phienThiId" element={<SVLichSuChiTiet />} />
        <Route path="/sinh-vien/ho-so" element={<SVHoSo />} />
      </Route>

      {/* Trang làm bài - fullscreen không có sidebar */}
      <Route path="/giao-vien/de-thi/editor" element={
        <ProtectedRoute requiredRole={["ADMIN", "GIAO_VIEN"]}>
          <TrangSoanThaoDeThi />
        </ProtectedRoute>
      } />
      <Route path="/sinh-vien/lam-bai/:phienThiId" element={
        <ProtectedRoute requiredRole="SINH_VIEN">
          <SVLamBai />
        </ProtectedRoute>
      } />
      <Route path="/sinh-vien/ket-qua/:phienThiId" element={
        <ProtectedRoute requiredRole="SINH_VIEN">
          <SVKetQua />
        </ProtectedRoute>
      } />

      {/* 404 */}
      <Route path="*" element={
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '1rem' }}>
          <div style={{ fontSize: '5rem' }}>🔍</div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#1e1b4b' }}>404 - Không tìm thấy trang</h1>
          <a href="/login" style={{ color: '#4f46e5', fontSize: '1rem' }}>Về trang đăng nhập</a>
        </div>
      } />
    </Routes>
  </BrowserRouter>
);

export default App;

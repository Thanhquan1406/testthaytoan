NguoiDung collection:
{
  _id, maNguoiDung, ho, ten, email, soDienThoai,
  matKhau (hashed), vaiTro: ["GIAO_VIEN" | "SINH_VIEN" | "ADMIN"],
  thoiGianTao
}
MonHoc collection:
{ _id, ten, moTa }
ChuDe collection:
{ _id, ten, monHocId (ref MonHoc) }
CauHoi collection:
{
  _id, chuDeId, noiDung, loaiCauHoi, doKho,
  dapAnDung, luaChonA, luaChonB, luaChonC, luaChonD,
  nguoiDungId (ref NguoiDung), thoiGianTao
}
DeThi collection:
{
  _id, monHocId, maDeThi, ten, thoiGianPhut, moTa,
  maTruyCap, duongDanTruyCap,
  thoiGianMo, thoiGianDong, soLanThiToiDa,
  tronCauHoi, tronDapAn, choPhepXemLai,
  nguoiDungId, trangThai,
  cauHois: [{ cauHoiId, thuTu }],   // nhúng thẳng thay DeThiCauHoi
  lopHocIds: [{ lopHocId, thoiGianXuatBan }],  // nhúng thay DeThiLopHoc
  deletedAt, thoiGianTao
}
LopHoc collection:
{
  _id, ten, giaoVienId,
  sinhVienIds: [ObjectId],   // nhúng thay LopHocSinhVien
  thoiGianTao
}
PhienThi collection:
{
  _id, deThiId, nguoiDungId (nullable), hoTenAnDanh,
  maTruyCapDaDung, thoiGianBatDau, thoiGianNop,
  trangThai, cauHoiHienTai, lopHocId,
  cauTraLois: [{ cauHoiId, noiDungTraLoi, trangThaiTraLoi, tuDongCham, diem }],
  viPhams: [{ soLanViPham, hanhVi, thoiGianViPham }],
  ketQua: { tongDiem, trangThaiCham, ghiChu }  // nhúng KetQuaThi
}
Lợi thế: Giảm số collection từ 14 xuống ~7, tránh JOIN phức tạp.

2. Cấu trúc Backend Node.js
backend/src/
├── Config/
│   ├── db.js              # Kết nối MongoDB (mongoose)
│   ├── jwt.js             # JWT config
│   └── multer.js          # Upload file config
│
├── models/                # Mongoose schemas
│   ├── NguoiDung.js
│   ├── MonHoc.js
│   ├── ChuDe.js
│   ├── CauHoi.js
│   ├── DeThi.js
│   ├── LopHoc.js
│   └── PhienThi.js
│
├── controllers/           # Xử lý request (gọi service)
│   ├── auth.controller.js
│   ├── admin/
│   │   ├── dashboard.controller.js
│   │   ├── monHoc.controller.js
│   │   ├── nguoiDung.controller.js
│   │   ├── cauHoi.controller.js
│   │   └── deThi.controller.js
│   ├── giaoVien/
│   │   ├── hoSo.controller.js
│   │   ├── deThi.controller.js
│   │   ├── cauHoi.controller.js      # ngan hang
│   │   ├── lopHoc.controller.js
│   │   ├── ketQua.controller.js
│   │   ├── sinhVien.controller.js
│   │   └── theoDoi.controller.js
│   ├── sinhVien/
│   │   ├── hoSo.controller.js
│   │   ├── thi.controller.js
│   │   ├── lichSuThi.controller.js
│   │   └── phongThi.controller.js
│   └── public/
│       ├── deThiLink.controller.js   # thi an danh
│       └── thiCongKhai.controller.js
│
├── routes/                # Express Router
│   ├── auth.routes.js
│   ├── admin.routes.js
│   ├── giaoVien.routes.js
│   ├── sinhVien.routes.js
│   └── public.routes.js
│
├── middleware/
│   ├── auth.middleware.js      # verifyToken
│   ├── role.middleware.js      # checkRole(ADMIN/GV/SV)
│   ├── errorHandler.js
│   └── captcha.middleware.js
│
├── services/
│   ├── auth.service.js
│   ├── captcha.service.js
│   ├── jwt.service.js
│   ├── deThi.service.js
│   ├── cauHoi.service.js
│   ├── lopHoc.service.js
│   ├── thi.service.js          # core thi logic
│   ├── ketQua.service.js
│   ├── export.service.js       # xlsx export
│   ├── import.service.js       # PDF/DOCX import
│   └── theoDoi.service.js
│
├── realtime/
│   ├── socketHandler.js        # Socket.io init
│   ├── examRoom.js             # phòng thi real-time
│   └── monitorHandler.js      # GV theo dõi SV
│
├── events/
│   ├── eventEmitter.js
│   └── examEvents.js           # SV nộp bài → emit cho GV
│
├── workers/
│   └── autoSubmit.worker.js    # Tự động nộp bài khi hết giờ
│
├── validators/
│   ├── auth.validator.js
│   ├── deThi.validator.js
│   └── cauHoi.validator.js
│
├── utils/
│   ├── apiResponse.js          # chuẩn hóa { success, data, message }
│   ├── pagination.js
│   └── slugify.js
│
├── app.js                      # Express app setup
└── server.js                   # HTTP + Socket.io server
3. Cấu trúc Frontend React
frontend/src/
├── components/
│   ├── common/
│   │   ├── Navbar.jsx
│   │   ├── Sidebar.jsx
│   │   ├── LoadingSpinner.jsx
│   │   ├── Modal.jsx
│   │   ├── Pagination.jsx
│   │   └── ProtectedRoute.jsx
│   ├── auth/
│   │   └── CaptchaInput.jsx
│   └── exam/
│       ├── QuestionCard.jsx
│       ├── CountdownTimer.jsx
│       └── ViolationAlert.jsx
│
├── pages/
│   ├── auth/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   └── LoginAdmin.jsx
│   ├── admin/
│   │   ├── Dashboard.jsx
│   │   ├── MonHoc.jsx
│   │   ├── NguoiDung.jsx
│   │   ├── CauHoi.jsx
│   │   └── DeThi.jsx
│   ├── giaoVien/
│   │   ├── Dashboard.jsx
│   │   ├── DeThi.jsx           # de-thi-quan-ly
│   │   ├── ChinhSuaCauHoi.jsx  # de-thi-chinh-sua-cau-hoi
│   │   ├── NganHangCauHoi.jsx
│   │   ├── LopHoc.jsx
│   │   ├── SinhVien.jsx
│   │   ├── KetQua.jsx
│   │   ├── TheoDoi.jsx         # theo-doi-thi-giao-vien
│   │   ├── XemBaiThi.jsx
│   │   └── HoSo.jsx
│   ├── sinhVien/
│   │   ├── Dashboard.jsx
│   │   ├── PhongThi.jsx
│   │   ├── PhongThiChiTiet.jsx
│   │   ├── LamBai.jsx          # exam room
│   │   ├── KetQua.jsx
│   │   ├── LichSuThi.jsx
│   │   └── HoSo.jsx
│   └── public/
│       ├── ThiMoCongKhai.jsx   # trang nhập link
│       └── LamBaiAnDanh.jsx    # thi ẩn danh
│
├── services/                   # Axios API calls
│   ├── api.js                  # axios instance + interceptors
│   ├── authService.js
│   ├── deThiService.js
│   ├── cauHoiService.js
│   ├── lopHocService.js
│   ├── thiService.js
│   ├── ketQuaService.js
│   └── adminService.js
│
├── contexts/
│   ├── AuthContext.jsx         # user info, token
│   └── SocketContext.jsx       # Socket.io client
│
├── hooks/
│   ├── useAuth.js
│   ├── useSocket.js
│   ├── useCountdown.js         # đếm giờ thi
│   └── useAntiCheat.js         # phát hiện vi phạm
│
├── App.jsx
└── main.jsx
4. Các tính năng đặc biệt cần lưu ý
Real-time theo dõi thi (Socket.io)
Tính năng Theo dõi thi và Làm bài thi dùng WebSocket để:

SV bắt đầu thi → emit join-exam-room
SV lưu câu trả lời → emit answer-update
SV vi phạm (chuyển tab, fullscreen) → emit violation
GV nhận realtime list SV đang thi, trạng thái, vi phạm
// backend/realtime/examRoom.js (ví dụ)
io.on('connection', (socket) => {
  socket.on('join-exam-room', ({ phienThiId, role }) => {
    socket.join(`exam:${phienThiId}`);
    if (role === 'GIAO_VIEN') socket.join(`monitor:${deThiId}`);
  });
  socket.on('violation', ({ phienThiId, hanhVi }) => {
    // lưu DB + broadcast cho GV
    io.to(`monitor:${deThiId}`).emit('student-violation', {...});
  });
});
Anti-cheat (useAntiCheat hook)
// frontend/src/hooks/useAntiCheat.js
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.hidden) reportViolation('CHUYEN_TAB');
  };
  const handleFullscreenChange = () => {
    if (!document.fullscreenElement) reportViolation('THOAT_TOAN_MAN_HINH');
  };
  document.addEventListener('visibilitychange', handleVisibilityChange);
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  return () => { /* cleanup */ };
}, []);
Auto-submit worker
// backend/workers/autoSubmit.worker.js
// Dùng node-cron hoặc BullMQ để tự động nộp bài khi hết giờ
// Mỗi phút scan PhienThi có trangThai=DANG_THI và đã quá thoiGianBatDau + thoiGianPhut
Import PDF/DOCX
Thay Apache POI bằng:

pdf-parse hoặc pdfjs-dist cho PDF
mammoth cho DOCX
Export Excel
Thay Apache POI bằng exceljs hoặc xlsx

5. Mapping API Routes (Node.js)
Spring Endpoint	Node.js Route
POST /api/login
POST /api/auth/login
POST /api/register
POST /api/auth/register
GET /api/giao-vien/de-thi
GET /api/giao-vien/de-thi
POST /api/giao-vien/de-thi
POST /api/giao-vien/de-thi
GET /api/sinh-vien/thi/phien/:id/noi-dung
GET /api/sinh-vien/thi/phien/:id/noi-dung
POST /api/sinh-vien/thi/phien/:id/nop-bai
POST /api/sinh-vien/thi/phien/:id/nop-bai
(tất cả 23 controller đều map 1-1)
6. Các package cần cài
Backend:

{
  "dependencies": {
    "express": "^4.x",
    "mongoose": "^8.x",
    "jsonwebtoken": "^9.x",
    "bcryptjs": "^2.x",
    "socket.io": "^4.x",
    "multer": "^1.x",
    "express-validator": "^7.x",
    "cors": "^2.x",
    "dotenv": "^16.x",
    "pdf-parse": "^1.x",
    "mammoth": "^1.x",
    "exceljs": "^4.x",
    "node-cron": "^3.x",
    "sharp": "^0.x"
  }
}
Frontend:

{
  "dependencies": {
    "react": "^19.x",
    "react-dom": "^19.x",
    "react-router-dom": "^7.x",
    "axios": "^1.x",
    "socket.io-client": "^4.x",
    "@tanstack/react-query": "^5.x",
    "react-hook-form": "^7.x",
    "zod": "^3.x"
  }
}
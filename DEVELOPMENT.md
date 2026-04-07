# Hướng dẫn phát triển

Tài liệu này mô tả cách cài đặt, chạy và phát triển dự án **Hệ thống Thi Trắc Nghiệm** sau khi đã migration sang stack **Node.js + React + MongoDB**.

---

## Yêu cầu môi trường

| Công cụ | Phiên bản tối thiểu |
|---------|---------------------|
| Node.js | 18.x LTS            |
| npm     | 9.x                 |
| MongoDB | 6.x                 |

---

## Cài đặt nhanh

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # Chỉnh sửa .env theo môi trường
npm run dev            # Chạy dev server (nodemon, port 5000)
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env   # VITE_API_URL=http://localhost:5000/api
npm run dev            # Chạy Vite dev server (port 5173)
```

---

## Biến môi trường Backend (`.env`)

```dotenv
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/web_thi_trac_nghiem
JWT_SECRET=your_super_secret_key_change_this
JWT_EXPIRES_IN=7d
JWT_ANONYMOUS_EXPIRES_IN=4h
CLIENT_URL=http://localhost:5173
UPLOAD_DIR=uploads
MAX_FILE_SIZE_MB=10
```

## Biến môi trường Frontend (`.env`)

```dotenv
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## Cấu trúc dự án

### Backend (`backend/src/`)

```
Config/         ← Kết nối DB, JWT config, Multer config
controllers/    ← Request handlers theo role (admin/giaoVien/sinhVien/public)
events/         ← Event emitters (Phase 2)
middleware/     ← Auth, role check, error handler
models/         ← Mongoose models (7 collections)
realtime/       ← Socket.io handlers (Phase 2)
routes/         ← Express router (auth/admin/giaoVien/sinhVien/public)
services/       ← Business logic layer
utils/          ← Constants, API response helpers, pagination, slugify
validators/     ← express-validator schemas
workers/        ← Background jobs (Phase 2)
```

### Frontend (`frontend/src/`)

```
components/
  common/       ← Navbar, Sidebar, Modal, Pagination, ProtectedRoute, LoadingSpinner
  auth/         ← CaptchaInput
  exam/         ← CountdownTimer, QuestionCard, ViolationAlert
contexts/       ← AuthContext, SocketContext (Phase 2)
hooks/          ← useAuth, useCountdown, useAntiCheat, useSocket (Phase 2)
pages/
  auth/         ← Login, Register, LoginAdmin
  admin/        ← Dashboard, NguoiDung, MonHoc, DeThi, CauHoi
  giaoVien/     ← Dashboard, DeThi, NganHangCauHoi, LopHoc, KetQua, TheoDoi, ...
  sinhVien/     ← Dashboard, PhongThi, LamBai, KetQua, LichSuThi, ...
  public/       ← ThiMoCongKhai (thi ẩn danh qua link)
services/       ← Axios API service wrappers theo module
```

---

## Scripts hữu ích

### Backend

| Lệnh | Mô tả |
|------|-------|
| `npm run dev` | Khởi động với nodemon (hot reload) |
| `npm run lint` | Kiểm tra ESLint |
| `npm run lint:fix` | Tự động sửa lỗi ESLint |
| `npm run format` | Format code với Prettier |

### Frontend

| Lệnh | Mô tả |
|------|-------|
| `npm run dev` | Vite dev server |
| `npm run build` | Build production |
| `npm run preview` | Xem trước bản build |
| `npm run lint` | Kiểm tra ESLint |
| `npm run format` | Format code với Prettier |

---

## API Base URL

Tất cả API đều có prefix `/api`:

| Route group | Mô tả | Auth |
|-------------|-------|------|
| `POST /api/auth/*` | Xác thực | Không |
| `GET /api/public/*` | Thi ẩn danh | Không / Anonymous JWT |
| `GET /api/admin/*` | Quản trị | JWT + role ADMIN |
| `GET /api/giao-vien/*` | Giáo viên | JWT + role GIAO_VIEN |
| `GET /api/sinh-vien/*` | Sinh viên | JWT + role SINH_VIEN |

---

## Vai trò người dùng

| Vai trò | Quyền truy cập |
|---------|---------------|
| `ADMIN` | Quản lý toàn bộ: người dùng, môn học, đề thi |
| `GIAO_VIEN` | Quản lý đề thi, câu hỏi, lớp học, xem kết quả |
| `SINH_VIEN` | Thi qua lớp học, xem lịch sử thi |
| Ẩn danh | Thi qua link công khai (không cần tài khoản) |

---

## Phase 2 - Tính năng nâng cao (Backlog)

Các tính năng sau đã có cấu trúc placeholder, cần triển khai ở giai đoạn tiếp theo:

- [ ] **Realtime monitoring** — Socket.io (`backend/src/realtime/socketHandler.js`)
- [ ] **Auto-submit khi hết giờ** — Cron job / BullMQ (`backend/src/workers/autoSubmit.worker.js`)
- [ ] **Import câu hỏi từ PDF/DOCX** — pdf-parse + mammoth (`backend/src/services/importExport.service.js`)
- [ ] **Xuất kết quả ra Excel** — exceljs (`backend/src/services/importExport.service.js`)
- [ ] **Anti-cheat nâng cao** — Kết hợp frontend hook `useAntiCheat` với Socket.io events
- [ ] **Tích hợp SocketContext** — Frontend `src/contexts/SocketContext.jsx`

---

## Coding conventions

- **Ngôn ngữ biến/hàm**: tiếng Việt không dấu camelCase (ví dụ: `deThiId`, `thoiGianPhut`)
- **JSDoc**: Bắt buộc cho tất cả functions public ở services và controllers
- **API Response**: Luôn dùng helper trong `utils/apiResponse.js`
- **Error handling**: Throw `Error` với message tiếng Việt rõ ràng, global handler sẽ catch
- **Mongoose queries**: Dùng `lean()` khi chỉ cần đọc data (performance)
- **Constants**: Import từ `utils/constants.js`, không hardcode string

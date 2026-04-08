/**
 * @fileoverview Routes cho Giáo viên.
 * Prefix: /api/giao-vien
 */

const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/auth.middleware');
const { requireGiaoVien } = require('../middleware/role.middleware');
const { uploadImportMemory } = require('../Config/multer');

const hoSoCtrl = require('../controllers/giaoVien/hoSo.controller');
const deThiCtrl = require('../controllers/giaoVien/deThi.controller');
const cauHoiCtrl = require('../controllers/giaoVien/cauHoi.controller');
const lopHocCtrl = require('../controllers/giaoVien/lopHoc.controller');
const ketQuaCtrl = require('../controllers/giaoVien/ketQua.controller');
const sinhVienCtrl = require('../controllers/giaoVien/sinhVien.controller');
const theoDoiCtrl = require('../controllers/giaoVien/theoDoi.controller');
const nganHangCtrl = require('../controllers/giaoVien/nganHang.controller');
const cauTrucCtrl = require('../controllers/giaoVien/cauTruc.controller');

router.use(verifyToken, requireGiaoVien);

// Hồ sơ
router.get('/ho-so', hoSoCtrl.getProfile);
router.put('/ho-so', hoSoCtrl.updateProfile);
router.post('/ho-so/doi-mat-khau', hoSoCtrl.changePassword);

// Đề thi
router.get('/de-thi/thung-rac', deThiCtrl.getTrash);
router.get('/de-thi/mon-hoc', deThiCtrl.getMonHoc);
router.get('/de-thi', deThiCtrl.getAll);
router.post('/de-thi', deThiCtrl.create);
router.post('/de-thi/tao-tu-ma-tran', deThiCtrl.taoTuMaTran);
router.get('/de-thi/:id', deThiCtrl.getById);
router.put('/de-thi/:id', deThiCtrl.update);
router.delete('/de-thi/:id', deThiCtrl.softDelete);
router.post('/de-thi/:id/khoi-phuc', deThiCtrl.restore);
router.delete('/de-thi/:id/xoa-han', deThiCtrl.forceDelete);

// Import câu hỏi từ file PDF/DOCX vào đề thi
router.post('/de-thi/:id/import', uploadImportMemory.single('file'), deThiCtrl.importFile);

// Câu hỏi trong đề
router.post('/de-thi/:id/cau-hoi', deThiCtrl.addQuestions);
router.delete('/de-thi/:id/cau-hoi/:cauHoiId', deThiCtrl.removeQuestion);

// Xuất bản lớp
router.post('/de-thi/:id/xuat-ban-lop', deThiCtrl.publishToClass);
router.delete('/de-thi/:id/thu-hoi-lop', deThiCtrl.revokeFromClass);

// Link công khai
router.post('/de-thi/:id/link-cong-khai', deThiCtrl.createPublicLink);
router.delete('/de-thi/:id/link-cong-khai', deThiCtrl.revokePublicLink);

// Ngân hàng câu hỏi (cũ - giữ backward compat)
router.get('/ngan-hang-cau-hoi/mon-hoc', cauHoiCtrl.getMonHoc);
router.get('/ngan-hang-cau-hoi/chu-de', cauHoiCtrl.getChuDe);
router.post('/ngan-hang-cau-hoi/chu-de', cauHoiCtrl.createChuDe);
router.get('/ngan-hang-cau-hoi', cauHoiCtrl.getAll);
router.post('/ngan-hang-cau-hoi', cauHoiCtrl.create);
router.put('/ngan-hang-cau-hoi/:id', cauHoiCtrl.update);
router.delete('/ngan-hang-cau-hoi/:id', cauHoiCtrl.remove);

// ─── NGÂN HÀNG CÂU HỎI MỚI ──────────────────────────────────────────────────
router.get('/ngan-hang/mon-hoc', nganHangCtrl.getMonHoc);
router.get('/ngan-hang', nganHangCtrl.getAll);
router.post('/ngan-hang', nganHangCtrl.create);
router.get('/ngan-hang/:id', nganHangCtrl.getById);
router.put('/ngan-hang/:id', nganHangCtrl.update);
router.delete('/ngan-hang/:id', nganHangCtrl.remove);

// Cấu trúc bên trong ngân hàng
router.get('/ngan-hang/:nganHangId/cau-truc', cauTrucCtrl.getAll);
router.post('/ngan-hang/:nganHangId/cau-truc', cauTrucCtrl.create);
router.put('/ngan-hang/:nganHangId/cau-truc/:id', cauTrucCtrl.update);
router.delete('/ngan-hang/:nganHangId/cau-truc/:id', cauTrucCtrl.remove);

// Import file + Câu hỏi trong ngân hàng
router.post('/ngan-hang/:nganHangId/import', uploadImportMemory.single('file'), nganHangCtrl.importFile);
router.post('/ngan-hang/:nganHangId/cau-hoi', nganHangCtrl.saveCauHoi);
router.get('/ngan-hang/:nganHangId/cau-hoi', nganHangCtrl.getCauHoi);
router.post('/ngan-hang/:nganHangId/tao-de-tu-ma-tran', nganHangCtrl.taoDeTuMaTran);

// Lớp học
router.get('/lop-hoc/sinh-vien', lopHocCtrl.getSinhVien);
router.get('/lop-hoc', lopHocCtrl.getAll);
router.post('/lop-hoc', lopHocCtrl.create);
router.get('/lop-hoc/:id', lopHocCtrl.getById);
router.put('/lop-hoc/:id', lopHocCtrl.update);
router.delete('/lop-hoc/:id', lopHocCtrl.remove);

// Kết quả
router.get('/ket-qua/de-thi', ketQuaCtrl.getDanhSachDeThi);
router.get('/ket-qua/lop', ketQuaCtrl.getDanhSachLop);
router.get('/ket-qua/phien/:phienThiId/xem', ketQuaCtrl.xemBaiThi);
router.get('/ket-qua', ketQuaCtrl.getKetQua);
router.put('/ket-qua/:phienThiId/ghi-chu', ketQuaCtrl.updateGhiChu);
router.put('/ket-qua/:phienThiId/diem', ketQuaCtrl.updateDiem);

// Sinh viên
router.get('/sinh-vien', sinhVienCtrl.getSinhVien);

// Theo dõi thi
router.get('/theo-doi-thi/de-thi', theoDoiCtrl.getDeThi);
router.get('/theo-doi-thi', theoDoiCtrl.getTheoDoi);

module.exports = router;


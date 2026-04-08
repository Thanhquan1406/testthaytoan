/**
 * Script tạo tài khoản admin mặc định.
 * Chạy một lần: node scripts/createAdmin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/web_thi_trac_nghiem';

// Schema gọn để không cần import toàn bộ app
const NguoiDungSchema = new mongoose.Schema({
  maNguoiDung: String,
  ho: String,
  ten: String,
  email: { type: String, lowercase: true },
  soDienThoai: String,
  matKhau: String,
  vaiTro: String,
});

const NguoiDung = mongoose.model('NguoiDung', NguoiDungSchema);

const ADMIN = {
  maNguoiDung: 'ADMIN001',
  ho: 'Admin',
  ten: 'Hệ Thống',
  email: 'admin@example.com',
  soDienThoai: '0900000000',
  matKhau: 'Admin@123',
  vaiTro: 'ADMIN',
};

(async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Kết nối MongoDB thành công');

    const existing = await NguoiDung.findOne({ email: ADMIN.email });
    if (existing) {
      console.log(`⚠️  Tài khoản ${ADMIN.email} đã tồn tại. Không tạo lại.`);
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const matKhauHash = await bcrypt.hash(ADMIN.matKhau, salt);

    await NguoiDung.create({ ...ADMIN, matKhau: matKhauHash });

    console.log('🎉 Tạo tài khoản admin thành công!');
    console.log('─────────────────────────────');
    console.log(`  Email   : ${ADMIN.email}`);
    console.log(`  Mật khẩu: ${ADMIN.matKhau}`);
    console.log('─────────────────────────────');
    console.log('⚠️  Hãy đổi mật khẩu sau khi đăng nhập lần đầu!');
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();

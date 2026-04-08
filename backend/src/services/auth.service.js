/**
 * @fileoverview Service xử lý nghiệp vụ xác thực người dùng.
 * Bao gồm: đăng ký, đăng nhập (thường + admin + Google OAuth), kiểm tra email/SĐT tồn tại.
 */

const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const NguoiDung = require('../models/NguoiDung');
const { taoToken } = require('./jwt.service');
const { VAI_TRO } = require('../utils/constants');
const { generateMaSinhVien } = require('../utils/slugify');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const SALT_ROUNDS = 12;

/**
 * @typedef {Object} DangNhapResult
 * @property {string} token - JWT access token
 * @property {object} nguoiDung - Thông tin người dùng (không có matKhau)
 */

/**
 * Đăng ký tài khoản mới (sinh viên hoặc giáo viên)
 * @param {object} data - Dữ liệu đăng ký
 * @param {string} data.ho - Họ
 * @param {string} data.ten - Tên
 * @param {string} data.email - Email
 * @param {string} data.soDienThoai - Số điện thoại
 * @param {string} data.matKhau - Mật khẩu chưa hash
 * @param {string} data.vaiTro - SINH_VIEN | GIAO_VIEN
 * @returns {Promise<DangNhapResult>}
 * @throws {Error} Khi email/SĐT đã tồn tại
 */
const dangKy = async ({ ho, ten, email, soDienThoai, matKhau, vaiTro }) => {
  const emailTonTai = await NguoiDung.exists({ email: email.toLowerCase() });
  if (emailTonTai) {
    throw Object.assign(new Error('Email đã được sử dụng'), { statusCode: 409 });
  }

  const sdtTonTai = await NguoiDung.exists({ soDienThoai });
  if (sdtTonTai) {
    throw Object.assign(new Error('Số điện thoại đã được sử dụng'), { statusCode: 409 });
  }

  // Chỉ cho phép tự đăng ký với 2 vai trò này
  const vaiTroHopLe = [VAI_TRO.SINH_VIEN, VAI_TRO.GIAO_VIEN].includes(vaiTro)
    ? vaiTro
    : VAI_TRO.SINH_VIEN;

  const matKhauHash = await bcrypt.hash(matKhau, SALT_ROUNDS);
  const maNguoiDung = generateMaSinhVien();

  const nguoiDung = await NguoiDung.create({
    maNguoiDung,
    ho,
    ten,
    email: email.toLowerCase(),
    soDienThoai,
    matKhau: matKhauHash,
    vaiTro: vaiTroHopLe,
  });

  const token = taoToken({ id: nguoiDung._id, email: nguoiDung.email, vaiTro: nguoiDung.vaiTro });

  return {
    token,
    nguoiDung: _loaiBoMatKhau(nguoiDung),
  };
};

/**
 * Đăng nhập cho sinh viên và giáo viên
 * @param {string} email - Email đăng nhập (hoặc số điện thoại)
 * @param {string} matKhau - Mật khẩu
 * @returns {Promise<DangNhapResult>}
 * @throws {Error} 401 khi thông tin không đúng
 */
const dangNhap = async (email, matKhau) => {
  // Tìm user và lấy thêm trường matKhau (mặc định bị ẩn)
  const nguoiDung = await NguoiDung.findOne({
    $or: [{ email: email.toLowerCase() }, { soDienThoai: email }],
  }).select('+matKhau');

  if (!nguoiDung) {
    throw Object.assign(new Error('Email hoặc mật khẩu không đúng'), { statusCode: 401 });
  }

  // Admin không được đăng nhập qua endpoint thường
  if (nguoiDung.vaiTro === VAI_TRO.ADMIN) {
    throw Object.assign(new Error('Tài khoản admin phải đăng nhập qua trang admin'), {
      statusCode: 403,
    });
  }

  // Tài khoản Google-only không có mật khẩu
  if (!nguoiDung.matKhau) {
    throw Object.assign(
      new Error('Tài khoản này được đăng ký qua Google. Vui lòng đăng nhập bằng Google.'),
      { statusCode: 400 }
    );
  }

  const matKhauDung = await bcrypt.compare(matKhau, nguoiDung.matKhau);
  if (!matKhauDung) {
    throw Object.assign(new Error('Email hoặc mật khẩu không đúng'), { statusCode: 401 });
  }

  const token = taoToken({ id: nguoiDung._id, email: nguoiDung.email, vaiTro: nguoiDung.vaiTro });
  return { token, nguoiDung: _loaiBoMatKhau(nguoiDung) };
};

/**
 * Đăng nhập dành riêng cho Admin
 * @param {string} email
 * @param {string} matKhau
 * @returns {Promise<DangNhapResult>}
 */
const dangNhapAdmin = async (email, matKhau) => {
  const nguoiDung = await NguoiDung.findOne({ email: email.toLowerCase() }).select('+matKhau');

  if (!nguoiDung || nguoiDung.vaiTro !== VAI_TRO.ADMIN) {
    throw Object.assign(new Error('Tài khoản hoặc mật khẩu admin không đúng'), { statusCode: 401 });
  }

  const matKhauDung = await bcrypt.compare(matKhau, nguoiDung.matKhau);
  if (!matKhauDung) {
    throw Object.assign(new Error('Tài khoản hoặc mật khẩu admin không đúng'), { statusCode: 401 });
  }

  const token = taoToken({ id: nguoiDung._id, email: nguoiDung.email, vaiTro: nguoiDung.vaiTro });
  return { token, nguoiDung: _loaiBoMatKhau(nguoiDung) };
};

/**
 * Đổi mật khẩu
 * @param {string} nguoiDungId - ObjectId người dùng
 * @param {string} matKhauCu - Mật khẩu hiện tại
 * @param {string} matKhauMoi - Mật khẩu mới
 * @returns {Promise<void>}
 */
const doiMatKhau = async (nguoiDungId, matKhauCu, matKhauMoi) => {
  const nguoiDung = await NguoiDung.findById(nguoiDungId).select('+matKhau');
  if (!nguoiDung) {
    throw Object.assign(new Error('Người dùng không tồn tại'), { statusCode: 404 });
  }

  const dung = await bcrypt.compare(matKhauCu, nguoiDung.matKhau);
  if (!dung) {
    throw Object.assign(new Error('Mật khẩu cũ không đúng'), { statusCode: 400 });
  }

  nguoiDung.matKhau = await bcrypt.hash(matKhauMoi, SALT_ROUNDS);
  await nguoiDung.save();
};

/**
 * Verify Google ID token và trả về payload
 * @param {string} credential - Google ID token từ frontend
 * @returns {Promise<{sub, email, given_name, family_name, picture}>}
 */
const _verifyGoogleToken = async (credential) => {
  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  return ticket.getPayload();
};

/**
 * Đăng nhập bằng Google OAuth
 * - Nếu user đã tồn tại (theo googleId hoặc email): trả JWT
 * - Nếu chưa tồn tại: trả needsRegistration=true kèm thông tin Google để hoàn tất đăng ký
 * @param {string} credential - Google ID token
 * @returns {Promise<DangNhapResult | {needsRegistration: true, googleData: object}>}
 */
const dangNhapGoogle = async (credential) => {
  const payload = await _verifyGoogleToken(credential);
  const { sub: googleId, email, given_name, family_name } = payload;

  // Tìm theo googleId trước, rồi theo email
  let nguoiDung = await NguoiDung.findOne({ googleId });
  if (!nguoiDung) {
    nguoiDung = await NguoiDung.findOne({ email: email.toLowerCase() });
  }

  if (nguoiDung) {
    // Gắn googleId nếu đăng nhập lần đầu bằng Google nhưng tài khoản tạo thủ công
    if (!nguoiDung.googleId) {
      nguoiDung.googleId = googleId;
      await nguoiDung.save();
    }

    // Admin không dùng route này
    if (nguoiDung.vaiTro === VAI_TRO.ADMIN) {
      throw Object.assign(new Error('Tài khoản admin không thể đăng nhập bằng Google'), {
        statusCode: 403,
      });
    }

    const token = taoToken({ id: nguoiDung._id, email: nguoiDung.email, vaiTro: nguoiDung.vaiTro });
    return { token, nguoiDung: _loaiBoMatKhau(nguoiDung) };
  }

  // Chưa có tài khoản - yêu cầu bổ sung thông tin
  return {
    needsRegistration: true,
    googleData: {
      email: email.toLowerCase(),
      ho: family_name || '',
      ten: given_name || '',
    },
  };
};

/**
 * Đăng ký tài khoản mới qua Google OAuth
 * @param {object} data
 * @param {string} data.credential - Google ID token (để lấy thông tin)
 * @param {string} data.vaiTro - SINH_VIEN | GIAO_VIEN
 * @param {string} data.soDienThoai - Số điện thoại
 * @returns {Promise<DangNhapResult>}
 */
const dangKyGoogle = async ({ credential, vaiTro, soDienThoai }) => {
  const payload = await _verifyGoogleToken(credential);
  const { sub: googleId, email, given_name, family_name } = payload;

  // Kiểm tra email/googleId chưa tồn tại
  const emailTonTai = await NguoiDung.exists({ email: email.toLowerCase() });
  if (emailTonTai) {
    throw Object.assign(
      new Error('Email này đã được đăng ký. Vui lòng đăng nhập bằng Google.'),
      { statusCode: 409 }
    );
  }

  const sdtTonTai = await NguoiDung.exists({ soDienThoai });
  if (sdtTonTai) {
    throw Object.assign(new Error('Số điện thoại đã được sử dụng'), { statusCode: 409 });
  }

  const vaiTroHopLe = [VAI_TRO.SINH_VIEN, VAI_TRO.GIAO_VIEN].includes(vaiTro)
    ? vaiTro
    : VAI_TRO.SINH_VIEN;

  const maNguoiDung = generateMaSinhVien();

  const nguoiDung = await NguoiDung.create({
    maNguoiDung,
    ho: family_name || 'Google',
    ten: given_name || 'User',
    email: email.toLowerCase(),
    soDienThoai,
    googleId,
    vaiTro: vaiTroHopLe,
    // matKhau không có - tài khoản Google-only
  });

  const token = taoToken({ id: nguoiDung._id, email: nguoiDung.email, vaiTro: nguoiDung.vaiTro });
  return { token, nguoiDung: _loaiBoMatKhau(nguoiDung) };
};

/**
 * Kiểm tra email có tồn tại không
 * @param {string} email
 * @returns {Promise<boolean>}
 */
const kiemTraEmailTonTai = async (email) => {
  return NguoiDung.exists({ email: email.toLowerCase() });
};

/**
 * Kiểm tra số điện thoại có tồn tại không
 * @param {string} soDienThoai
 * @returns {Promise<boolean>}
 */
const kiemTraSdtTonTai = async (soDienThoai) => {
  return NguoiDung.exists({ soDienThoai });
};

/**
 * Loại bỏ trường matKhau khỏi object trước khi trả về client
 * @param {import('mongoose').Document} doc
 * @returns {object}
 */
const _loaiBoMatKhau = (doc) => {
  const obj = doc.toObject({ virtuals: true });
  delete obj.matKhau;
  return obj;
};

module.exports = {
  dangKy,
  dangNhap,
  dangNhapAdmin,
  dangNhapGoogle,
  dangKyGoogle,
  doiMatKhau,
  kiemTraEmailTonTai,
  kiemTraSdtTonTai,
};

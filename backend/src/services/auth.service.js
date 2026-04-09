/**
 * @fileoverview Service xử lý nghiệp vụ xác thực người dùng.
 * Bao gồm: đăng ký, đăng nhập (thường + admin + Google OAuth), kiểm tra email/SĐT tồn tại.
 */

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { OAuth2Client } = require('google-auth-library');
const NguoiDung = require('../models/NguoiDung');
const AuthSession = require('../models/AuthSession');
const RefreshToken = require('../models/RefreshToken');
const PasswordResetToken = require('../models/PasswordResetToken');
const TwoFactorChallenge = require('../models/TwoFactorChallenge');
const { taoToken } = require('./jwt.service');
const { sendResetPasswordEmail } = require('./email.service');
const { generateTotpSecret, generateQrDataUrl, verifyTotp } = require('./totp.service');
const { VAI_TRO } = require('../utils/constants');
const { generateMaSinhVien } = require('../utils/slugify');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const SALT_ROUNDS = 12;
const REFRESH_EXPIRES_DAYS = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS || 14);
const RESET_EXPIRES_MINUTES = Number(process.env.RESET_PASSWORD_EXPIRES_MINUTES || 15);
const TWO_FA_CHALLENGE_MINUTES = Number(process.env.TWO_FA_CHALLENGE_EXPIRES_MINUTES || 5);

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
const dangKy = async ({ ho, ten, email, soDienThoai, matKhau, vaiTro }, context = {}) => {
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

  return _issueTokensForUser(nguoiDung, context);
};

/**
 * Đăng nhập cho sinh viên và giáo viên
 * @param {string} email - Email đăng nhập (hoặc số điện thoại)
 * @param {string} matKhau - Mật khẩu
 * @returns {Promise<DangNhapResult>}
 * @throws {Error} 401 khi thông tin không đúng
 */
const dangNhap = async (email, matKhau, context = {}) => {
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

  if (nguoiDung.is2FAEnabled) {
    return _create2FAChallenge(nguoiDung, context);
  }
  return _issueTokensForUser(nguoiDung, context);
};

/**
 * Đăng nhập dành riêng cho Admin
 * @param {string} email
 * @param {string} matKhau
 * @returns {Promise<DangNhapResult>}
 */
const dangNhapAdmin = async (email, matKhau, context = {}) => {
  const nguoiDung = await NguoiDung.findOne({ email: email.toLowerCase() }).select('+matKhau');

  if (!nguoiDung || nguoiDung.vaiTro !== VAI_TRO.ADMIN) {
    throw Object.assign(new Error('Tài khoản hoặc mật khẩu admin không đúng'), { statusCode: 401 });
  }

  const matKhauDung = await bcrypt.compare(matKhau, nguoiDung.matKhau);
  if (!matKhauDung) {
    throw Object.assign(new Error('Tài khoản hoặc mật khẩu admin không đúng'), { statusCode: 401 });
  }

  if (nguoiDung.is2FAEnabled) {
    return _create2FAChallenge(nguoiDung, context);
  }
  return _issueTokensForUser(nguoiDung, context);
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
  nguoiDung.passwordChangedAt = new Date();
  await nguoiDung.save();
  await revokeAllSessions(nguoiDung._id.toString());
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
const dangNhapGoogle = async (credential, context = {}) => {
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

    if (nguoiDung.is2FAEnabled) {
      return _create2FAChallenge(nguoiDung, context);
    }
    return _issueTokensForUser(nguoiDung, context);
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
const dangKyGoogle = async ({ credential, vaiTro, soDienThoai }, context = {}) => {
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

  return _issueTokensForUser(nguoiDung, context);
};

const forgotPassword = async (email, context = {}) => {
  const normalizedEmail = String(email || '').toLowerCase().trim();
  const user = await NguoiDung.findOne({ email: normalizedEmail });
  if (!user) return;

  await PasswordResetToken.updateMany({ userId: user._id, usedAt: null }, { $set: { usedAt: new Date() } });
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = _hashToken(rawToken);
  const expiresAt = new Date(Date.now() + RESET_EXPIRES_MINUTES * 60 * 1000);

  await PasswordResetToken.create({
    userId: user._id,
    tokenHash,
    expiresAt,
    requestedIp: _resolveIp(context.req),
  });

  const baseResetUrl = process.env.RESET_PASSWORD_URL || `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password`;
  const resetLink = `${baseResetUrl}?token=${rawToken}`;
  await sendResetPasswordEmail({ to: user.email, name: `${user.ho} ${user.ten}`.trim(), resetLink });
};

const resetPassword = async (token, newPassword) => {
  const tokenHash = _hashToken(token);
  const resetDoc = await PasswordResetToken.findOne({ tokenHash, usedAt: null });
  if (!resetDoc || resetDoc.expiresAt < new Date()) {
    throw Object.assign(new Error('Lien ket dat lai mat khau khong hop le hoac da het han'), {
      statusCode: 400,
    });
  }

  const user = await NguoiDung.findById(resetDoc.userId).select('+matKhau');
  if (!user) {
    throw Object.assign(new Error('Nguoi dung khong ton tai'), { statusCode: 404 });
  }
  user.matKhau = await bcrypt.hash(newPassword, SALT_ROUNDS);
  user.passwordChangedAt = new Date();
  await user.save();

  resetDoc.usedAt = new Date();
  await resetDoc.save();

  await revokeAllSessions(user._id.toString());
};

const refreshAccessToken = async (refreshTokenRaw, context = {}) => {
  const tokenHash = _hashToken(refreshTokenRaw);
  const tokenDoc = await RefreshToken.findOne({ tokenHash, revokedAt: null });
  if (!tokenDoc || tokenDoc.expiresAt < new Date()) {
    throw Object.assign(new Error('Refresh token khong hop le hoac da het han'), { statusCode: 401 });
  }

  const user = await NguoiDung.findById(tokenDoc.userId);
  if (!user) {
    throw Object.assign(new Error('Nguoi dung khong ton tai'), { statusCode: 404 });
  }

  tokenDoc.revokedAt = new Date();
  await tokenDoc.save();

  const payload = _buildTokenPayload(user, tokenDoc.sessionId);
  const accessToken = taoToken(payload);
  const newRefreshToken = _generateToken();
  const newTokenHash = _hashToken(newRefreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000);
  await RefreshToken.create({
    userId: user._id,
    sessionId: tokenDoc.sessionId,
    tokenHash: newTokenHash,
    rotatedFrom: tokenHash,
    expiresAt,
    userAgent: context.userAgent || tokenDoc.userAgent,
    ip: _resolveIp(context.req) || tokenDoc.ip,
  });

  await AuthSession.updateOne(
    { sessionId: tokenDoc.sessionId, revokedAt: null },
    { $set: { lastActiveAt: new Date() } }
  );

  return { token: accessToken, refreshToken: newRefreshToken };
};

const listSessions = async (userId) => {
  return AuthSession.find({ userId, revokedAt: null }).sort({ lastActiveAt: -1 }).lean();
};

const logoutSession = async (userId, sessionId) => {
  await AuthSession.updateOne({ userId, sessionId }, { $set: { revokedAt: new Date() } });
  await RefreshToken.updateMany({ userId, sessionId, revokedAt: null }, { $set: { revokedAt: new Date() } });
};

const logoutAllSessions = async (userId) => {
  await revokeAllSessions(userId);
};

const logoutCurrent = async (refreshTokenRaw) => {
  if (!refreshTokenRaw) return;
  const tokenHash = _hashToken(refreshTokenRaw);
  const tokenDoc = await RefreshToken.findOne({ tokenHash });
  if (!tokenDoc) return;
  await logoutSession(tokenDoc.userId, tokenDoc.sessionId);
};

const startTwoFactorSetup = async (userId) => {
  const user = await NguoiDung.findById(userId).select('+totpSecretEncrypted');
  if (!user) throw Object.assign(new Error('Nguoi dung khong ton tai'), { statusCode: 404 });

  const secret = generateTotpSecret(user.email);
  user.totpSecretEncrypted = secret.base32;
  await user.save();

  const qrDataUrl = await generateQrDataUrl(secret.otpauth_url);
  return { secret: secret.base32, otpauthUrl: secret.otpauth_url, qrDataUrl };
};

const verifyTwoFactorSetup = async (userId, otpCode) => {
  const user = await NguoiDung.findById(userId).select('+totpSecretEncrypted');
  if (!user || !user.totpSecretEncrypted) {
    throw Object.assign(new Error('Chua khoi tao 2FA'), { statusCode: 400 });
  }
  const ok = verifyTotp(user.totpSecretEncrypted, otpCode);
  if (!ok) throw Object.assign(new Error('Ma OTP khong dung'), { statusCode: 400 });
  user.is2FAEnabled = true;
  user.totpEnabledAt = new Date();
  await user.save();
};

const verifyTwoFactorLogin = async (challengeToken, otpCode, context = {}) => {
  const challengeHash = _hashToken(challengeToken);
  const challenge = await TwoFactorChallenge.findOne({ challengeHash, usedAt: null });
  if (!challenge || challenge.expiresAt < new Date()) {
    throw Object.assign(new Error('Yeu cau xac thuc 2FA khong hop le hoac da het han'), { statusCode: 400 });
  }

  const user = await NguoiDung.findById(challenge.userId).select('+totpSecretEncrypted');
  if (!user || !user.totpSecretEncrypted) {
    throw Object.assign(new Error('Khong the xac thuc 2FA'), { statusCode: 400 });
  }
  const ok = verifyTotp(user.totpSecretEncrypted, otpCode);
  if (!ok) throw Object.assign(new Error('Ma OTP khong dung'), { statusCode: 400 });

  challenge.usedAt = new Date();
  await challenge.save();

  return _issueTokensForUser(user, { ...context, sessionId: challenge.sessionId });
};

const disableTwoFactor = async (userId, password, otpCode) => {
  const user = await NguoiDung.findById(userId).select('+matKhau +totpSecretEncrypted');
  if (!user || !user.is2FAEnabled || !user.totpSecretEncrypted) {
    throw Object.assign(new Error('Tai khoan chua bat 2FA'), { statusCode: 400 });
  }
  if (!user.matKhau) {
    throw Object.assign(new Error('Tai khoan dang nhap Google can dat mat khau truoc'), { statusCode: 400 });
  }
  const validPassword = await bcrypt.compare(password, user.matKhau);
  if (!validPassword) throw Object.assign(new Error('Mat khau khong dung'), { statusCode: 400 });
  const validOtp = verifyTotp(user.totpSecretEncrypted, otpCode);
  if (!validOtp) throw Object.assign(new Error('Ma OTP khong dung'), { statusCode: 400 });

  user.is2FAEnabled = false;
  user.totpSecretEncrypted = null;
  user.totpEnabledAt = null;
  await user.save();
};

const getTwoFactorStatus = async (userId) => {
  const user = await NguoiDung.findById(userId).select('is2FAEnabled totpEnabledAt');
  if (!user) throw Object.assign(new Error('Nguoi dung khong ton tai'), { statusCode: 404 });
  return {
    is2FAEnabled: !!user.is2FAEnabled,
    totpEnabledAt: user.totpEnabledAt || null,
  };
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
  delete obj.totpSecretEncrypted;
  return obj;
};

const revokeAllSessions = async (userId) => {
  const now = new Date();
  await AuthSession.updateMany({ userId, revokedAt: null }, { $set: { revokedAt: now } });
  await RefreshToken.updateMany({ userId, revokedAt: null }, { $set: { revokedAt: now } });
};

const _issueTokensForUser = async (nguoiDung, context = {}) => {
  const sessionId = context.sessionId || uuidv4();
  const payload = _buildTokenPayload(nguoiDung, sessionId);
  const token = taoToken(payload);
  const refreshToken = _generateToken();
  const tokenHash = _hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000);

  await AuthSession.updateOne(
    { sessionId },
    {
      $set: {
        userId: nguoiDung._id,
        deviceName: context.deviceName || '',
        userAgent: context.userAgent || '',
        ip: _resolveIp(context.req),
        lastActiveAt: new Date(),
        revokedAt: null,
      },
    },
    { upsert: true }
  );

  await RefreshToken.create({
    userId: nguoiDung._id,
    sessionId,
    tokenHash,
    expiresAt,
    userAgent: context.userAgent || '',
    ip: _resolveIp(context.req),
  });

  return { token, refreshToken, sessionId, nguoiDung: _loaiBoMatKhau(nguoiDung) };
};

const _create2FAChallenge = async (nguoiDung, context = {}) => {
  const rawChallenge = _generateToken();
  const challengeHash = _hashToken(rawChallenge);
  const sessionId = context.sessionId || uuidv4();
  const expiresAt = new Date(Date.now() + TWO_FA_CHALLENGE_MINUTES * 60 * 1000);

  await TwoFactorChallenge.create({
    challengeHash,
    userId: nguoiDung._id,
    sessionId,
    expiresAt,
    ip: _resolveIp(context.req),
    userAgent: context.userAgent || '',
  });

  return {
    requires2FA: true,
    challengeToken: rawChallenge,
    expiresAt,
    nguoiDung: { _id: nguoiDung._id, email: nguoiDung.email, vaiTro: nguoiDung.vaiTro },
  };
};

const _buildTokenPayload = (nguoiDung, sessionId) => ({
  id: nguoiDung._id,
  email: nguoiDung.email,
  vaiTro: nguoiDung.vaiTro,
  sessionId,
});

const _generateToken = () => crypto.randomBytes(48).toString('hex');
const _hashToken = (value) => crypto.createHash('sha256').update(String(value || '')).digest('hex');
const _resolveIp = (req) =>
  req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() || req?.ip || req?.socket?.remoteAddress || '';

module.exports = {
  dangKy,
  dangNhap,
  dangNhapAdmin,
  dangNhapGoogle,
  dangKyGoogle,
  doiMatKhau,
  forgotPassword,
  resetPassword,
  refreshAccessToken,
  listSessions,
  logoutSession,
  logoutAllSessions,
  logoutCurrent,
  startTwoFactorSetup,
  verifyTwoFactorSetup,
  verifyTwoFactorLogin,
  disableTwoFactor,
  getTwoFactorStatus,
  kiemTraEmailTonTai,
  kiemTraSdtTonTai,
};

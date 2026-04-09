const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

const APP_ISSUER = process.env.TOTP_ISSUER || 'WEB_THI_TRAC_NGHIEM';

const generateTotpSecret = (email) => {
  return speakeasy.generateSecret({
    name: `${APP_ISSUER}:${email}`,
    issuer: APP_ISSUER,
    length: 20,
  });
};

const generateQrDataUrl = async (otpauthUrl) => {
  return QRCode.toDataURL(otpauthUrl);
};

const verifyTotp = (secret, token) => {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token: String(token || ''),
    // Nới cửa sổ kiểm tra để giảm lỗi do lệch thời gian thiết bị.
    window: 2,
  });
};

module.exports = { generateTotpSecret, generateQrDataUrl, verifyTotp };

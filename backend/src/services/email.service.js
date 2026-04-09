const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: SMTP_SECURE === 'true',
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
};

const sendResetPasswordEmail = async ({ to, name, resetLink }) => {
  const mailer = getTransporter();
  if (!mailer) {
    // Fallback cho môi trường local chưa cấu hình SMTP.
    // eslint-disable-next-line no-console
    console.log('[MAIL_DEBUG] reset password:', { to, name, resetLink });
    return;
  }

  const from = process.env.MAIL_FROM || process.env.SMTP_USER;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <h2>Khôi phục mật khẩu</h2>
      <p>Xin chào ${name || ''},</p>
      <p>Bạn vừa yêu cầu đặt lại mật khẩu. Nhấn vào liên kết bên dưới để tiếp tục:</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p>Liên kết có hiệu lực trong 15 phút.</p>
      <p>Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
    </div>
  `;

  await mailer.sendMail({
    from,
    to,
    subject: 'Yeu cau dat lai mat khau',
    html,
  });
};

module.exports = { sendResetPasswordEmail };

/**
 * @fileoverview Service xử lý CAPTCHA toán học đơn giản (in-memory).
 * Thay thế session-based CAPTCHA từ Spring Boot cũ.
 *
 * Cơ chế: Tạo phép tính số học đơn giản, lưu đáp án theo captchaId (UUID) trong Map.
 * Tự động xóa sau 5 phút để tránh memory leak.
 */

const { v4: uuidv4 } = require('uuid');

/** Map lưu {captchaId → {answer, expiredAt}} */
const captchaStore = new Map();

const CAPTCHA_TTL_MS = 5 * 60 * 1000; // 5 phút

/**
 * @typedef {Object} CaptchaResult
 * @property {string} captchaId - ID duy nhất để submit kèm khi login
 * @property {string} question - Câu hỏi hiển thị cho người dùng (vd: "3 + 7 = ?")
 */

/**
 * Tạo CAPTCHA mới (phép cộng/trừ/nhân ngẫu nhiên)
 * @returns {CaptchaResult}
 */
const generateCaptcha = () => {
  const ops = ['+', '-', '*'];
  const op = ops[Math.floor(Math.random() * ops.length)];
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;

  let answer;
  let question;
  switch (op) {
    case '+':
      answer = a + b;
      question = `${a} + ${b} = ?`;
      break;
    case '-':
      // Đảm bảo kết quả dương
      answer = Math.abs(a - b);
      question = `${Math.max(a, b)} - ${Math.min(a, b)} = ?`;
      break;
    case '*':
      answer = a * b;
      question = `${a} × ${b} = ?`;
      break;
  }

  const captchaId = uuidv4();
  captchaStore.set(captchaId, {
    answer: String(answer),
    expiredAt: Date.now() + CAPTCHA_TTL_MS,
  });

  return { captchaId, question };
};

/**
 * Xác thực câu trả lời CAPTCHA và xóa khỏi store (single-use)
 * @param {string} captchaId - ID CAPTCHA được cấp khi tạo
 * @param {string|number} userAnswer - Câu trả lời người dùng nhập
 * @returns {boolean} true nếu đúng
 */
const validateCaptcha = (captchaId, userAnswer) => {
  const entry = captchaStore.get(captchaId);

  if (!entry) return false;
  if (Date.now() > entry.expiredAt) {
    captchaStore.delete(captchaId);
    return false;
  }

  const isCorrect = String(userAnswer).trim() === entry.answer;
  // Single-use: xóa sau khi dùng dù đúng hay sai
  captchaStore.delete(captchaId);
  return isCorrect;
};

/**
 * Xóa một CAPTCHA khỏi store (dùng khi logout hoặc hủy form)
 * @param {string} captchaId
 */
const removeCaptcha = (captchaId) => {
  captchaStore.delete(captchaId);
};

// Dọn dẹp các CAPTCHA hết hạn mỗi 10 phút
setInterval(() => {
  const now = Date.now();
  for (const [id, entry] of captchaStore.entries()) {
    if (now > entry.expiredAt) captchaStore.delete(id);
  }
}, 10 * 60 * 1000);

module.exports = { generateCaptcha, validateCaptcha, removeCaptcha };

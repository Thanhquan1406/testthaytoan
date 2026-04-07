/**
 * @fileoverview Kết nối MongoDB qua Mongoose.
 * Kết nối được thiết lập một lần khi server khởi động.
 */

const mongoose = require('mongoose');

/**
 * Kết nối tới MongoDB theo URI cấu hình trong .env
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI chưa được cấu hình trong file .env');
  }

  try {
    const conn = await mongoose.connect(uri, {
      // Mongoose 8.x không cần các options legacy (useNewUrlParser, useUnifiedTopology)
    });
    console.log(`MongoDB đã kết nối: ${conn.connection.host}`);
  } catch (err) {
    console.error('Lỗi kết nối MongoDB:', err.message);
    // Thoát process để container/PM2 tự restart
    process.exit(1);
  }
};

module.exports = connectDB;

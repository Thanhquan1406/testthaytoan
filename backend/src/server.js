/**
 * @fileoverview Entry point - khởi động HTTP server và kết nối MongoDB.
 * Socket.io sẽ được tích hợp tại đây ở Phase 2 (realtime).
 */

require('dotenv').config();

const http = require('http');
const app = require('./app');
const connectDB = require('./Config/db');
const { initSocket } = require('./realtime/socketHandler');
const { startAutoSubmitWorker } = require('./workers/autoSubmit.worker');

const PORT = process.env.PORT || 5000;

/** Khởi động server sau khi kết nối DB thành công */
const startServer = async () => {
  await connectDB();
  startAutoSubmitWorker();

  const server = http.createServer(app);
  initSocket(server);

  server.listen(PORT, () => {
    console.log(`🚀 Server chạy tại http://localhost:${PORT}`);
    console.log(`📋 Môi trường: ${process.env.NODE_ENV || 'development'}`);
  });

  // Xử lý lỗi server không bắt được
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} đang được sử dụng. Vui lòng đổi PORT trong .env`);
    } else {
      console.error('Lỗi server:', err);
    }
    process.exit(1);
  });

  // Graceful shutdown
  const shutdown = (signal) => {
    console.log(`\n${signal} nhận được. Đang dừng server...`);
    server.close(() => {
      console.log('Server đã dừng.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

startServer().catch((err) => {
  console.error('Không thể khởi động server:', err);
  process.exit(1);
});

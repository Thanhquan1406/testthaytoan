/**
 * @fileoverview Socket.io server setup - Phase 2 placeholder.
 * Khi tích hợp realtime:
 *   1. Import và gọi initSocket(server) trong server.js
 *   2. Triển khai các handlers trong examRoom.js và monitorHandler.js
 *
 * @see examRoom.js - Phòng thi realtime (SV làm bài)
 * @see monitorHandler.js - Giáo viên theo dõi SV
 */

/**
 * Khởi tạo Socket.io và đăng ký các event handlers
 * @param {import('http').Server} server - HTTP server instance
 * @returns {import('socket.io').Server}
 */
const initSocket = (server) => {
  // TODO Phase 2: Bật Socket.io
  // const { Server } = require('socket.io');
  // const io = new Server(server, {
  //   cors: { origin: process.env.CLIENT_URL, credentials: true },
  // });
  //
  // // Middleware auth cho socket
  // io.use((socket, next) => {
  //   const token = socket.handshake.auth.token;
  //   try {
  //     socket.data.user = require('../services/jwt.service').kiemTraToken(token);
  //     next();
  //   } catch (err) {
  //     next(new Error('Unauthorized'));
  //   }
  // });
  //
  // io.on('connection', (socket) => {
  //   require('./examRoom').register(io, socket);
  //   require('./monitorHandler').register(io, socket);
  // });
  //
  // return io;

  console.log('ℹ️  Socket.io chưa được kích hoạt (Phase 2)');
  return null;
};

module.exports = { initSocket };

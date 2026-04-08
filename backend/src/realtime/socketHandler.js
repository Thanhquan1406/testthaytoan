/**
 * @fileoverview Khởi tạo Socket.io server, auth middleware, và đăng ký event handlers.
 */

const { Server } = require('socket.io');
const { kiemTraToken } = require('../services/jwt.service');
const { VAI_TRO } = require('../utils/constants');
const { setIO } = require('./socketEmitter');
const { SOCKET_EVENTS, getExamRoom } = require('./socketEvents');

/**
 * Khởi tạo Socket.io và gắn vào HTTP server
 * @param {import('http').Server} server
 * @returns {import('socket.io').Server}
 */
const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 30000,
    pingInterval: 10000,
  });

  setIO(io);

  // Auth middleware: xác thực JWT từ handshake
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      socket.data.user = null;
      return next();
    }
    try {
      socket.data.user = kiemTraToken(token);
    } catch {
      socket.data.user = null;
    }
    next();
  });

  io.on('connection', (socket) => {
    const user = socket.data.user;

    // ─── GIÁO VIÊN THAM GIA PHÒNG THEO DÕI ──────────────────────────────────
    socket.on(SOCKET_EVENTS.MONITOR_JOIN_EXAM_ROOM, ({ deThiId } = {}, ack) => {
      if (!user || user.vaiTro !== VAI_TRO.GIAO_VIEN) {
        return ack?.({ success: false, message: 'Chỉ giáo viên mới có thể theo dõi phòng thi' });
      }
      if (!deThiId) {
        return ack?.({ success: false, message: 'Thiếu deThiId' });
      }

      const room = getExamRoom(deThiId);
      socket.join(room);
      ack?.({ success: true, room });
    });

    // ─── GIÁO VIÊN RỜI PHÒNG THEO DÕI ───────────────────────────────────────
    socket.on(SOCKET_EVENTS.MONITOR_LEAVE_EXAM_ROOM, ({ deThiId } = {}) => {
      if (deThiId) socket.leave(getExamRoom(deThiId));
    });

    socket.on('disconnect', () => {
      // Socket.io tự dọn dẹp rooms khi disconnect
    });
  });

  console.log('✅ Socket.io đã được kích hoạt (realtime monitoring)');
  return io;
};

module.exports = { initSocket };

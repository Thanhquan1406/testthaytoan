/**
 * @fileoverview Singleton giữ instance Socket.io và cung cấp helpers emit event.
 * Các service/controller import module này để phát event mà không cần giữ ref tới io.
 */

const { SOCKET_EVENTS, getExamRoom } = require('./socketEvents');

let _io = null;

/**
 * Lưu io instance (gọi sau khi init socket trong server.js)
 * @param {import('socket.io').Server} io
 */
const setIO = (io) => {
  _io = io;
};

/**
 * Phát event tới tất cả giáo viên đang theo dõi một đề thi
 * @param {string|import('mongoose').Types.ObjectId} deThiId
 * @param {string} event - Tên event
 * @param {object} payload
 */
const _emit = (deThiId, event, payload) => {
  if (!_io || !deThiId) return;
  _io.to(getExamRoom(String(deThiId))).emit(event, payload);
};

const emitStudentJoined = (deThiId, payload) =>
  _emit(deThiId, SOCKET_EVENTS.MONITOR_STUDENT_JOINED, payload);

const emitProgressUpdated = (deThiId, payload) =>
  _emit(deThiId, SOCKET_EVENTS.MONITOR_PROGRESS_UPDATED, payload);

const emitStatusChanged = (deThiId, payload) =>
  _emit(deThiId, SOCKET_EVENTS.MONITOR_STATUS_CHANGED, payload);

const emitViolationReported = (deThiId, payload) =>
  _emit(deThiId, SOCKET_EVENTS.MONITOR_VIOLATION_REPORTED, payload);

const emitSessionSubmitted = (deThiId, payload) =>
  _emit(deThiId, SOCKET_EVENTS.MONITOR_SESSION_SUBMITTED, payload);

module.exports = {
  setIO,
  emitStudentJoined,
  emitProgressUpdated,
  emitStatusChanged,
  emitViolationReported,
  emitSessionSubmitted,
};

/**
 * @fileoverview Hằng số event Socket.io dùng chung cho backend.
 * Đồng bộ với frontend/src/utils/socketEvents.js
 */

const SOCKET_EVENTS = Object.freeze({
  // Client -> Server: Giáo viên join/leave phòng giám sát
  MONITOR_JOIN_EXAM_ROOM: 'monitor:join_exam_room',
  MONITOR_LEAVE_EXAM_ROOM: 'monitor:leave_exam_room',

  // Server -> Client: Broadcast tới giáo viên đang theo dõi đề
  MONITOR_STUDENT_JOINED: 'monitor:student_joined',
  MONITOR_PROGRESS_UPDATED: 'monitor:progress_updated',
  MONITOR_STATUS_CHANGED: 'monitor:status_changed',
  MONITOR_VIOLATION_REPORTED: 'monitor:violation_reported',
  MONITOR_SESSION_SUBMITTED: 'monitor:session_submitted',
});

/**
 * Tên room theo dõi của một đề thi
 * @param {string} deThiId
 * @returns {string}
 */
const getExamRoom = (deThiId) => `exam:${deThiId}`;

module.exports = { SOCKET_EVENTS, getExamRoom };

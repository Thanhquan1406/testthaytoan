/**
 * @fileoverview Hook cho giáo viên: join/leave phòng giám sát, xử lý tất cả
 * monitor events, merge vào studentMap, và tạo violation alerts.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import useSocket from './useSocket';

const EVENTS = {
  JOIN: 'monitor:join_exam_room',
  LEAVE: 'monitor:leave_exam_room',
  STUDENT_JOINED: 'monitor:student_joined',
  PROGRESS_UPDATED: 'monitor:progress_updated',
  STATUS_CHANGED: 'monitor:status_changed',
  VIOLATION_REPORTED: 'monitor:violation_reported',
  SESSION_SUBMITTED: 'monitor:session_submitted',
};

let _alertIdCounter = 0;

/**
 * @param {string|null} deThiId - ID đề thi đang theo dõi
 * @param {object[]|null} snapshotData - Dữ liệu snapshot ban đầu từ API
 * @param {Function} [refetchSnapshot] - Callback để reload snapshot (dùng khi reconnect)
 * @returns {{ studentMap: Object, alerts: Object[], dismissAlert: Function, isConnected: boolean, isReconnecting: boolean }}
 */
const useMonitorRoom = (deThiId, snapshotData, refetchSnapshot) => {
  const { socket, isConnected, isReconnecting } = useSocket();
  const [studentMap, setStudentMap] = useState({});
  const [alerts, setAlerts] = useState([]);
  const prevDeThiIdRef = useRef(null);
  const prevConnectedRef = useRef(false);

  // ─── Khởi tạo studentMap từ snapshot API ──────────────────────────────────
  useEffect(() => {
    if (!snapshotData) return;
    const map = {};
    snapshotData.forEach((p) => {
      map[String(p._id)] = {
        ...p,
        isNew: false,
        lastUpdate: null,
      };
    });
    setStudentMap(map);
  }, [snapshotData]);

  // ─── Join / Leave phòng khi deThiId hoặc kết nối thay đổi ────────────────
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Rời phòng cũ nếu đổi đề
    if (prevDeThiIdRef.current && prevDeThiIdRef.current !== deThiId) {
      socket.emit(EVENTS.LEAVE, { deThiId: prevDeThiIdRef.current });
    }

    if (!deThiId) {
      prevDeThiIdRef.current = null;
      return;
    }

    socket.emit(EVENTS.JOIN, { deThiId }, (ack) => {
      if (ack && !ack.success) {
        console.warn('[MonitorRoom] Không thể join phòng:', ack.message);
      }
    });
    prevDeThiIdRef.current = deThiId;

    return () => {
      socket.emit(EVENTS.LEAVE, { deThiId });
      prevDeThiIdRef.current = null;
    };
  }, [socket, isConnected, deThiId]);

  // ─── Refresh snapshot khi reconnect để bù các event bị miss ──────────────
  useEffect(() => {
    const wasDisconnected = !prevConnectedRef.current;
    prevConnectedRef.current = isConnected;

    if (isConnected && wasDisconnected && deThiId && refetchSnapshot) {
      refetchSnapshot();
    }
  }, [isConnected, deThiId, refetchSnapshot]);

  // ─── Event: sinh viên mới vào thi ─────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;
    const handler = (data) => {
      const key = String(data.phienThiId);
      setStudentMap((prev) => {
        if (prev[key]) return prev; // đã có trong snapshot, bỏ qua
        return {
          ...prev,
          [key]: {
            _id: key,
            nguoiDungId: data.nguoiDung || null,
            hoTenAnDanh: data.hoTenAnDanh || null,
            lopHocId: null,
            trangThai: data.trangThai,
            thoiGianBatDau: data.thoiGianBatDau,
            thoiGianNop: null,
            soViPham: 0,
            viPhamGanNhat: null,
            soCauDaTraLoi: 0,
            tongSoCau: data.tongSoCau || 0,
            isNew: true,
            lastUpdate: new Date(),
          },
        };
      });

      // Tắt highlight "mới" sau 3 giây
      setTimeout(() => {
        setStudentMap((prev) =>
          prev[key] ? { ...prev, [key]: { ...prev[key], isNew: false } } : prev
        );
      }, 3000);
    };

    socket.on(EVENTS.STUDENT_JOINED, handler);
    return () => socket.off(EVENTS.STUDENT_JOINED, handler);
  }, [socket]);

  // ─── Event: cập nhật tiến độ làm bài ─────────────────────────────────────
  useEffect(() => {
    if (!socket) return;
    const handler = (data) => {
      const key = String(data.phienThiId);
      setStudentMap((prev) => {
        if (!prev[key]) return prev;
        return {
          ...prev,
          [key]: {
            ...prev[key],
            soCauDaTraLoi: data.soCauDaTraLoi,
            tongSoCau: data.tongSoCau,
            lastUpdate: new Date(),
          },
        };
      });
    };

    socket.on(EVENTS.PROGRESS_UPDATED, handler);
    return () => socket.off(EVENTS.PROGRESS_UPDATED, handler);
  }, [socket]);

  // ─── Event: vi phạm mới ───────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;
    const handler = (data) => {
      const key = String(data.phienThiId);
      setStudentMap((prev) => {
        if (!prev[key]) return prev;
        return {
          ...prev,
          [key]: {
            ...prev[key],
            soViPham: data.soViPhamTongCong,
            viPhamGanNhat: { hanhVi: data.hanhVi, thoiGianViPham: data.thoiGian },
            lastUpdate: new Date(),
          },
        };
      });

      // Thêm toast notification
      const alertId = ++_alertIdCounter;
      setAlerts((prev) => [
        ...prev,
        {
          id: alertId,
          phienThiId: key,
          hanhVi: data.hanhVi,
          soViPham: data.soViPhamTongCong,
          time: new Date(),
        },
      ]);

      // Tự xóa sau 6 giây
      setTimeout(() => {
        setAlerts((prev) => prev.filter((a) => a.id !== alertId));
      }, 6000);
    };

    socket.on(EVENTS.VIOLATION_REPORTED, handler);
    return () => socket.off(EVENTS.VIOLATION_REPORTED, handler);
  }, [socket]);

  // ─── Event: sinh viên nộp bài ─────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;
    const handler = (data) => {
      const key = String(data.phienThiId);
      setStudentMap((prev) => {
        if (!prev[key]) return prev;
        return {
          ...prev,
          [key]: {
            ...prev[key],
            trangThai: data.trangThai,
            thoiGianNop: data.thoiGianNop,
            lastUpdate: new Date(),
          },
        };
      });
    };

    socket.on(EVENTS.SESSION_SUBMITTED, handler);
    return () => socket.off(EVENTS.SESSION_SUBMITTED, handler);
  }, [socket]);

  const dismissAlert = useCallback((alertId) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  }, []);

  return {
    studentMap,
    alerts,
    dismissAlert,
    isConnected,
    isReconnecting,
  };
};

export default useMonitorRoom;

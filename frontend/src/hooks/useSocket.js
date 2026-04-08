/**
 * @fileoverview Hook truy cập socket instance và đăng ký events với cleanup tự động.
 */

import { useEffect, useRef } from 'react';
import { useSocketContext } from '../contexts/SocketContext';

/**
 * Truy cập socket, isConnected, isReconnecting
 * @returns {{ socket: import('socket.io-client').Socket|null, isConnected: boolean, isReconnecting: boolean }}
 */
const useSocket = () => useSocketContext();

/**
 * Đăng ký một socket event với cleanup tự động.
 * Sử dụng pattern handlerRef để tránh stale closure mà không cần đưa handler vào deps.
 *
 * @param {string|null} event - Tên event, null để skip
 * @param {Function} handler - Callback nhận payload
 */
export const useSocketEvent = (event, handler) => {
  const { socket } = useSocketContext();
  const handlerRef = useRef(handler);

  // Luôn giữ ref trỏ tới handler mới nhất
  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    if (!socket || !event) return;
    const wrapped = (...args) => handlerRef.current?.(...args);
    socket.on(event, wrapped);
    return () => socket.off(event, wrapped);
  }, [socket, event]);
};

export default useSocket;

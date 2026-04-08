/**
 * @fileoverview Context quản lý kết nối Socket.io client.
 * Tự động kết nối khi user đã xác thực, tự ngắt khi logout.
 */

import { createContext, useContext, useEffect, useState } from 'react';
import { io as socketIO } from 'socket.io-client';
import { useAuthContext } from './AuthContext';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const SocketContext = createContext(null);

/**
 * Provider quản lý vòng đời socket: connect khi auth, disconnect khi logout.
 * @param {{ children: React.ReactNode }} props
 */
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const { isAuthenticated, token, isLoading } = useAuthContext();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !token) {
      setSocket((prev) => {
        prev?.disconnect();
        return null;
      });
      setIsConnected(false);
      setIsReconnecting(false);
      return;
    }

    const s = socketIO(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    s.on('connect', () => {
      setIsConnected(true);
      setIsReconnecting(false);
    });

    s.on('disconnect', () => {
      setIsConnected(false);
    });

    s.on('reconnecting', () => {
      setIsReconnecting(true);
    });

    s.on('reconnect', () => {
      setIsConnected(true);
      setIsReconnecting(false);
    });

    s.on('connect_error', () => {
      setIsConnected(false);
    });

    setSocket(s);

    return () => {
      s.disconnect();
      setSocket(null);
      setIsConnected(false);
      setIsReconnecting(false);
    };
  }, [isAuthenticated, token, isLoading]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, isReconnecting }}>
      {children}
    </SocketContext.Provider>
  );
};

/**
 * @returns {{ socket: import('socket.io-client').Socket|null, isConnected: boolean, isReconnecting: boolean }}
 */
export const useSocketContext = () => useContext(SocketContext);

export default SocketContext;

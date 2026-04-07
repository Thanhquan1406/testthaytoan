/**
 * @fileoverview Context cho Socket.io client.
 * Phase 2: tích hợp realtime khi làm bài thi và theo dõi thi.
 * Hiện tại là placeholder - kết nối sẽ được kích hoạt ở Phase 2.
 */

import { createContext, useContext, useEffect, useRef } from 'react';
import { useAuthContext } from './AuthContext';

const SocketContext = createContext(null);

/**
 * Provider quản lý kết nối Socket.io
 * @param {{ children: React.ReactNode }} props
 */
export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const { isAuthenticated, token } = useAuthContext();

  useEffect(() => {
    // TODO Phase 2: Kết nối Socket.io khi user đã đăng nhập
    // if (isAuthenticated && token) {
    //   const { io } = await import('socket.io-client');
    //   socketRef.current = io(import.meta.env.VITE_SOCKET_URL, {
    //     auth: { token },
    //     transports: ['websocket'],
    //   });
    // }
    // return () => {
    //   socketRef.current?.disconnect();
    // };
  }, [isAuthenticated, token]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current }}>
      {children}
    </SocketContext.Provider>
  );
};

/**
 * Hook để truy cập socket instance
 * @returns {{ socket: import('socket.io-client').Socket|null }}
 */
export const useSocketContext = () => {
  return useContext(SocketContext);
};

export default SocketContext;

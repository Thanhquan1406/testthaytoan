/**
 * @fileoverview Hook wrapper cho SocketContext.
 * Phase 2: sẽ cung cấp socket events cho realtime thi.
 */

import { useSocketContext } from '../contexts/SocketContext';

/**
 * Truy cập socket instance và helpers
 * @returns {{ socket: import('socket.io-client').Socket|null }}
 */
const useSocket = () => {
  return useSocketContext();
};

export default useSocket;

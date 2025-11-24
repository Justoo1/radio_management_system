import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io({
      path: '/api/socket/io',
      autoConnect: false,
    });
  }
  return socket;
};

export const connectSocket = (organizationId: string, userId: string) => {
  const socket = getSocket();

  if (!socket.connected) {
    socket.connect();

    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);

      // Join organization room
      socket.emit('join:organization', { organizationId, userId });
    });

    socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
    });

    socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default getSocket;

import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

let socket: Socket | null = null;

/**
 * Get or create the singleton socket instance.
 * Call connect() once after login, then getSocket() anywhere.
 */
export const connectSocket = (): Socket => {
  if (socket) {
    // Reuse the existing instance. If it's disconnected (e.g. max reconnects
    // exhausted), call connect() to kick off a fresh attempt rather than
    // creating a second instance — which would orphan all existing listeners.
    if (!socket.connected) socket.connect();
    return socket;
  }

  const token = localStorage.getItem('token');

  socket = io(SOCKET_URL, {
    auth: { token },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.error('[Socket] Connection error:', err.message);
  });

  return socket;
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

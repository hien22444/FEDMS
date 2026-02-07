import { io } from 'socket.io-client';

// Get socket URL from env, fallback to base URL if not set
const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:3001';
const SOCKET_URL = import.meta.env.VITE_BASE_SOCKET_IO || BASE_URL;

// Only create socket if URL is defined
export const socket = SOCKET_URL
  ? io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: false, // Disable auto-connect to prevent errors when URL is undefined
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })
  : null;

export const threadSocket = SOCKET_URL
  ? io(`${SOCKET_URL}/threads`, {
      transports: ['websocket'],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })
  : null;

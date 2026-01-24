import { io } from 'socket.io-client';

const URL = import.meta.env.VITE_BASE_SOCKET_IO;

export const socket = io(URL, {
  transports: ['websocket'],
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export const threadSocket = io(`${URL}/threads`, {
  transports: ['websocket'],
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

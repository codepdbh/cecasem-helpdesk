import { io, type Socket } from 'socket.io-client';
import { SERVER_BASE_URL } from './api';

let socket: Socket | undefined;
let socketToken = '';

export function liveConnection(): Socket | undefined {
  const token = localStorage.getItem('cecasem_token') || '';
  if (!token) return undefined;

  if (!socket || socketToken !== token) {
    socket?.disconnect();
    socketToken = token;
    socket = io(`${SERVER_BASE_URL}/live`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
  }

  return socket;
}

export function disconnectLive(): void {
  socket?.disconnect();
  socket = undefined;
  socketToken = '';
}

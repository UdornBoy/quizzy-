import { io } from 'socket.io-client';

// In dev, the client (Vite) and server run on separate ports, so we point
// at the server's fixed port explicitly. In production the server also
// serves the built client, so they share one origin and no URL is needed.
const SERVER_PORT = 3001;
const serverUrl = import.meta.env.DEV
  ? `${window.location.protocol}//${window.location.hostname}:${SERVER_PORT}`
  : window.location.origin;

export const socket = io(serverUrl, {
  autoConnect: true,
  transports: ['websocket', 'polling'],
});

export function emitAck(event, payload) {
  return new Promise((resolve) => {
    socket.emit(event, payload, (response) => resolve(response ?? {}));
  });
}

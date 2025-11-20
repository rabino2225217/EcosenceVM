import { io, Socket } from "socket.io-client";

// Socket.IO needs to connect to the root, not /api
// Since we're using nginx, socket.io will be at /socket.io/
const API_URL = import.meta.env.VITE_API_URL;
// If API_URL is relative (like /api), use window.location.origin for socket (only in browser)
// Socket.IO will automatically append /socket.io/
const socketURL = typeof window !== 'undefined' && !API_URL.startsWith('http') 
  ? window.location.origin 
  : API_URL;

const socket: Socket = io(socketURL, { 
  withCredentials: true,
  transports: ["websocket"], 
  autoConnect: false,
  path: "/socket.io/"
});

export default socket;
import { io, Socket } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL; 

// Connect directly to server (no nginx proxy)
const socket: Socket = io(API_URL, { 
  withCredentials: true,
  transports: ["websocket"], 
  autoConnect: false,
  path: "/socket.io/"
});

export default socket;
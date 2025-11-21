import { io, Socket } from "socket.io-client";
import { getApiUrl } from "../utils/api";

// Connect directly to server (auto-detects URL from current origin)
const socket: Socket = io(getApiUrl(), { 
  withCredentials: true,
  transports: ["websocket"], 
  autoConnect: false,
  path: "/socket.io/"
});

export default socket;
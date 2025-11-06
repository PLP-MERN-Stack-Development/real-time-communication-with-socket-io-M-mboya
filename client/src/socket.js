// client/src/socket.js
import { io } from "socket.io-client";

// ✅ Load URL from environment or fallback for local testing
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:4000";

console.log("Connecting to Socket.IO server at:", SOCKET_URL);

const socket = io(SOCKET_URL, {
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

socket.on("connect", () => {
  console.log("✅ Connected to server:", SOCKET_URL);
});

socket.on("connect_error", (err) => {
  console.error("❌ Connection error:", err.message);
});

export default socket;

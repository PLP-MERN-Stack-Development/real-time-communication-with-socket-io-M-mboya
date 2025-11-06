// client/src/socket.js
import { io } from "socket.io-client";

// Use the deployed server URL from the .env file, fallback to localhost for local testing
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || "http://localhost:4000";

// Initialize the socket connection
const socket = io(SOCKET_URL, {
  transports: ["websocket", "polling"], // ensures reliable connection
  withCredentials: true,
});

// Log connection status for debugging
socket.on("connect", () => {
  console.log("✅ Connected to Socket.IO server:", SOCKET_URL);
});

socket.on("disconnect", () => {
  console.log("❌ Disconnected from server");
});

export default socket;

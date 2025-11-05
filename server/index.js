import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const server = createServer(app);

app.use(cors());

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

let onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("🟢 New user connected:", socket.id);

  socket.on("join", (username) => {
    onlineUsers.set(socket.id, username);
    io.emit("onlineUsers", Array.from(onlineUsers.values()));
    io.emit("notification", `${username} joined the chat`);
  });

  socket.on("send_message", (data) => {
    io.emit("receive_message", data);
  });

  socket.on("send_image", (data) => {
    io.emit("receive_image", data); // broadcast image
  });

  socket.on("typing", (username) => {
    socket.broadcast.emit("user_typing", username);
  });

  socket.on("stop_typing", () => {
    socket.broadcast.emit("user_stop_typing");
  });

  socket.on("private_message", ({ to, message, from, image }) => {
    const targetSocket = [...onlineUsers.entries()].find(
      ([, name]) => name === to
    );
    if (targetSocket) {
      io.to(targetSocket[0]).emit("receive_private_message", {
        from,
        message,
        image,
      });
    }
  });

  socket.on("disconnect", () => {
    const username = onlineUsers.get(socket.id);
    onlineUsers.delete(socket.id);
    io.emit("onlineUsers", Array.from(onlineUsers.values()));
    io.emit("notification", `${username} left the chat`);
    console.log("🔴 User disconnected:", socket.id);
  });
});

server.listen(4000, () => console.log("✅ Server running on port 4000"));

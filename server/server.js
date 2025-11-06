import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors({
  origin: ["https://cha-pro.netlify.app"],  // ✅ your Netlify frontend URL
  methods: ["GET", "POST"],
}));

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["https://cha-pro.netlify.app"],  // ✅ allow frontend
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("🔗 A user connected:", socket.id);
  
  socket.on("user_join", (username) => {
    console.log(`${username} joined`);
    io.emit("user_list", [...io.sockets.sockets.keys()]);
  });

  socket.on("send_message", (data) => {
    io.emit("receive_message", data);
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
    io.emit("user_list", [...io.sockets.sockets.keys()]);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

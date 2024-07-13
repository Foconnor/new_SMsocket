require("dotenv").config();
const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const cors = require("cors");
const PORT = process.env.PORT || 3001; // Define your preferred port
const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: process.env.NODE_ENV === "development"
      ? "http://localhost:3000" // Allow your development server origin
      : "https://www.seniormanagers.com", // Define your production origin
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  },
});

// Middleware
app.use(cors());

// Socket.io connections
let chatRoom = ""; // E.g. javascript, node,...
let allUsers = [];

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("join_room", (data) => {
    const { userId, room } = data;
    socket.join(room);
    chatRoom = room;
    allUsers.push({ id: userId, socketId: socket.id, room });
    const chatRoomUsers = allUsers.filter((user) => user.room === room);
    io.in(room).emit("chatroom_users", chatRoomUsers);
  });

  socket.on("send_message", (data) => {
    const { room } = data;
    io.in(room).emit("receive_message", data);
  });

  socket.on("leave_room", (data) => {
    const { userId, room } = data;
    socket.leave(room);
    allUsers = allUsers.filter((user) => user.id !== userId);
    socket.to(room).emit("chatroom_users", allUsers);
    console.log(`${userId} left the room ${room}`);
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    allUsers = allUsers.filter((user) => user.socketId !== socket.id);
    io.to(chatRoom).emit("chatroom_users", allUsers);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

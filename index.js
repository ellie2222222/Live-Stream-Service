require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const NodeMediaServer = require("node-media-server");
const socketIo = require("socket.io");
const { saveStreamToBunny } = require("./services/StreamService");
const { createAMessageService } = require("./services/MessageService");
const { findUser } = require("./services/UserService");

// Initialize application and server
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [process.env.PRODUCTION_PORT, "http://localhost:5173"],
    methods: ["GET", "POST"],
  },
});
// Middleware
app.use(
  cors({
    origin: [process.env.PRODUCTION_PORT, "http://localhost:5173"],
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

io.on("connection", (socket) => {
  console.log("New client connected");

  // Keep track of the rooms this socket is in
  const userRooms = new Set();

  socket.on("join_room", (roomId) => {
    socket.join(roomId);
    userRooms.add(roomId);
    console.log(`User joined room: ${roomId}`);
    updateViewersCount(roomId);
  });

  socket.on("leave_room", (roomId) => {
    handleLeaveRoom(socket, roomId);
    userRooms.delete(roomId);
  });

  socket.on("send_message", async (data) => {
    const { roomId, message, userId } = data;

    await createAMessageService(userId, roomId, message.text);
    const user = await findUser(userId);
    io.to(roomId).emit("new_message", {
      sender: user.name,
      text: message.text,
      avatar: user.avatarUrl,
    });
  });

  // Handle disconnecting (fires before disconnect)
  socket.on("disconnecting", () => {
    console.log("User disconnecting");
    for (const room of userRooms) {
      handleLeaveRoom(socket, room);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
    // Any additional cleanup if needed
  });
});

function handleLeaveRoom(socket, roomId) {
  socket.leave(roomId);
  console.log(`User left room: ${roomId}`);
  updateViewersCount(roomId);
}

function updateViewersCount(roomId) {
  const viewersCount = io.sockets.adapter.rooms.get(roomId)?.size || 0;
  io.to(roomId).emit("viewers_count", viewersCount);
}

// Import routes
const authRoutes = require("./routes.js/AuthRoute");
const userRoutes = require("./routes.js/UserRoute");
const streamRoutes = require("./routes.js/StreamRoute");
const messageRoutes = require("./routes.js/MessageRoute");

// Router
app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", streamRoutes);
app.use("/api", messageRoutes);

// Log API requests
app.use((req, res, next) => {
  console.log(req.path, req.method);
  next();
});

const config = {
  rtmp: {
    port: 1935,
    chunk_size: 60000,
    gop_cache: true,
    ping: 60,
    ping_timeout: 30,
    allow_origin: "*",
  },
  http: {
    port: 8000,
    mediaroot: "./output",
    allow_origin: "*",
  },
};

const nms = new NodeMediaServer(config);

// Handle the 'postPublish' event to start saving the stream once it's live
nms.on("postPublish", async (_, streamPath, _params) => {
  const streamKey = streamPath.split("/").pop();

  try {
    await saveStreamToBunny(streamKey);
  } catch (error) {
    console.error(
      `Failed to save stream for key '${streamKey}': ${error.message}`
    );
  }
});

// Start the media server
nms.run();

// Start server
const port = process.env.DEVELOPMENT_PORT || 4000;
server.listen(port, (err) => {
  if (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  } else {
    console.log(`Server started! Listening on port ${port}`);
  }
});

import 'dotenv/config'; // Use this to load .env variables
import express, { query } from 'express';
import cors from 'cors';
import http from 'http';
import NodeMediaServer from 'node-media-server';
import { Server as socketIo } from 'socket.io';
import os from 'os';
import fs from 'fs';
import path from 'path';
import { saveStreamToBunny, deleteFromBunnyCDN, updateStream } from './services/StreamService.js';
import { createAMessageService } from './services/MessageService.js';
import { findUser } from './services/UserService.js';


// Initialize application and server

const app = express();
const server = http.createServer(app);
const io = new socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
// Middleware
app.use(
  cors({
    origin: "*",
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
  updateStream(roomId, { currentViewCount: viewersCount });
  io.to(roomId).emit("viewers_count", viewersCount);
}

// Import routes
import authRoutes from "./routes/AuthRoute.js";
import userRoutes from "./routes/UserRoute.js";
import streamRoutes from "./routes/StreamRoute.js";
import messageRoutes from "./routes/MessageRoute.js";
import ingressRoute from "./routes/ingressRoute.js";

// Router
app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", streamRoutes);
app.use("/api", messageRoutes);
app.use("/api", ingressRoute);

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
    await deleteFromBunnyCDN(streamKey, null);
  } catch (error) {
    console.error(
      `Failed to save stream for key '${streamKey}': ${error.message}`
    );
  }
});

nms.on('donePublish', (id, streamPath) => {
  const streamKey = streamPath.split('/').pop();
  const folderPath = path.join(os.tmpdir(), 'live-stream-playlist', streamKey);

  try {
    // Remove the folder and its contents
    fs.rmSync(folderPath, { recursive: true, force: true });
    console.log(`Deleted folder: ${folderPath}`);
  } catch (error) {
    console.error(`Failed to delete folder: ${folderPath}`, error);
  }
});

// Start the media server
nms.run();

// LiveKit User Authentication
const liveKitRoute = express.Router();

import { v4 } from "uuid";

const createViewerToken = async (queryData) => {
  try {
    const guestId = v4();
    const guestUserName = `guest#${Math.floor(Math.random() * 1000)}`

    let user = null;
    if (!queryData.userId) {
      user = await findUser(queryData.userId);
    }

    const isHost = queryData.hostId === queryData.userId;

    const { AccessToken } = await import("livekit-server-sdk");

    const at = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {
      identity: isHost ? `host-${queryData.hostId}` : guestId,
      name: isHost ? `host`: guestUserName,
    });
    at.addGrant({ 
      roomJoin: true, 
      room: queryData.hostId,
      canPublish: false,
      canPublishData: true,
    });

    return await at.toJwt();
  } catch (error) {
    throw new Error(error)
  }
}

liveKitRoute.get('/viewer-token', async (req, res) => {
  const { userId, streamId, hostId } = req.query;
  const queryData = { userId, streamId, hostId }

  try {
    res.status(200).json(await createViewerToken(queryData));
  } catch (error) {
    res.status(500).json({error: error.message})
  }
});

app.use("/api", liveKitRoute);

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

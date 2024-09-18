require("dotenv").config();
const express = require("express");
const http = require("http");
const axios = require("axios");
const socketIo = require("socket.io");
const { spawn } = require("child_process");
const fs = require("fs");
const { Readable } = require("stream");
const cors = require("cors");

// Initialize application and server
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [process.env.PRODUCTION_PORT, "http://localhost:5173"],
    methods: ["GET", "POST"],
  },
});
let viewersCount = 0;
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

let videoBuffer = Buffer.alloc(0);
let videoId = null;

// Function to create a video entry if it doesn't exist
async function createVideoEntry() {
  if (!videoId) {
    const libraryId = process.env.BUNNYCDN_VIDEO_LIBRARY_ID || "307543";
    const accessKey =
      process.env.BUNNYCDN_ACCESS_KEY ||
      "679c0c32-01dc-4fa5-87a4c3d7330d-e7f1-4aea";

    try {
      const createVideo = await axios.post(
        `https://video.bunnycdn.com/library/${libraryId}/videos`,
        { title: "livestream nè 1" },
        {
          headers: {
            "Content-Type": "application/json",
            AccessKey: accessKey,
          },
        }
      );
      videoId = createVideo.data.guid;
      console.log(`Video created with ID: ${videoId}`);
    } catch (error) {
      console.error("Error creating video entry:", error);
    }
  }
}

io.on("connection", (socket) => {
  viewersCount++;
  io.emit("views", viewersCount);
  console.log("A user connected");

  socket.on("video_chunk", (chunk) => {
    videoBuffer = Buffer.concat([videoBuffer, Buffer.from(chunk)]);
  });

  socket.on("new_comment", (comment) => {
    // Broadcast the comment to all clients except the sender
    socket.broadcast.emit("new_comment", {
      ...comment,
      sender: "Other User", // You can replace this with actual user identification if available
    });
  });
  socket.on("disconnect", async () => {
    viewersCount--;
    io.emit("views", viewersCount); // Send updated count to all clients
    console.log("User disconnected");

    // Save buffer to file
    fs.writeFileSync("video_input.mp4", videoBuffer);

    // Convert video to HLS
    const ffmpeg = spawn("ffmpeg", [
      "-i",
      "video_input.mp4",
      "-c:v",
      "libx264",
      "-vf",
      "fps=30",
      "-hls_time",
      "10",
      "-hls_playlist_type",
      "event",
      "-hls_flags",
      "delete_segments+append_list",
      "-b:v",
      "2M",
      "-maxrate",
      "2M",
      "-bufsize",
      "4M",
      "output.m3u8",
    ]);

    ffmpeg.on("close", async (code) => {
      console.log("FFmpeg exited with code", code);
      if (code === 0) {
        fs.readdir("./", async (err, files) => {
          if (err) {
            console.error("Error reading directory:", err);
            return;
          }

          // Filter and upload .ts files
          const tsFiles = files.filter((file) => file.endsWith(".ts"));
          if (tsFiles.length === 0) {
            console.log("No .ts files found.");
            return;
          }

          await createVideoEntry();

          tsFiles.forEach(async (file) => {
            fs.readFile(file, async (err, data) => {
              if (err) {
                console.error("Error reading .ts file:", err);
                return;
              }

              const libraryId =
                process.env.BUNNYCDN_VIDEO_LIBRARY_ID || "307543";
              const accessKey =
                process.env.BUNNYCDN_ACCESS_KEY ||
                "679c0c32-01dc-4fa5-87a4c3d7330d-e7f1-4aea";

              try {
                // Upload the .ts file to the existing video entry
                await axios.put(
                  `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}/`,
                  data,
                  {
                    headers: {
                      "Content-Type": "video/mp2t",
                      AccessKey: accessKey,
                      "Content-Length": data.length,
                    },
                  }
                );

                console.log(`Uploaded ${file} successfully`);
              } catch (error) {
                console.error("Error during upload:", error);
              }
            });
          });
        });
      }
    });

    ffmpeg.stderr.on("data", (data) => {
      console.error("FFmpeg stderr:", data.toString());
    });
  });
});

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
``;

require('dotenv').config();
const express = require('express');
const http = require('http');
const axios = require('axios');
const socketIo = require('socket.io');
const { spawn } = require('child_process');
const fs = require('fs');
const FormData = require('form-data');
const { Readable } = require('stream');
const cors = require('cors');

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
app.use(cors({
  origin: [process.env.PRODUCTION_PORT, "http://localhost:5173"],
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const authRoutes = require('./routes.js/AuthRoute');
const userRoutes = require('./routes.js/UserRoute');
const streamRoutes = require('./routes.js/StreamRoute');
const messageRoutes = require('./routes.js/MessageRoute');

// Router
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', streamRoutes);
app.use('/api', messageRoutes);

// Log API requests
app.use((req, res, next) => {
  console.log(req.path, req.method);
  next();
});

// WebSocket Setup
let videoBuffer = Buffer.alloc(0);

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('video_chunk', (chunk) => {
    videoBuffer = Buffer.concat([videoBuffer, Buffer.from(chunk)]);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');

    // Save buffer to file
    fs.writeFileSync('video_input.mp4', videoBuffer);

    // Convert video to HLS
    const ffmpeg = spawn('ffmpeg', [
      '-i', 'video_input.mp4',
      '-c:v', 'libx264',
      '-vf', 'fps=30',
      '-hls_time', '10',
      '-hls_playlist_type', 'event',
      '-hls_flags', 'delete_segments+append_list',
      '-b:v', '2M',
      '-maxrate', '2M',
      '-bufsize', '4M',
      'output.m3u8'
    ]);

    ffmpeg.on('close', async (code) => {
      console.log('FFmpeg exited with code', code);
      if (code === 0) {
        fs.readdir('./', (err, files) => {
          if (err) {
            console.error('Error reading directory:', err);
            return;
          }

          // Filter and upload .ts files
          const tsFiles = files.filter(file => file.endsWith('.ts'));
          if (tsFiles.length === 0) {
            console.log('No .ts files found.');
            return;
          }

          tsFiles.forEach(async (file) => {
            fs.readFile(file, async (err, data) => {
              if (err) {
                console.error('Error reading .ts file:', err);
                return;
              }
              
              const libraryId = process.env.BUNNYCDN_VIDEO_LIBRARY_ID || '307598';
              try {
                // Create a new video entry
                const createVideo = await axios.post(
                  `https://video.bunnycdn.com/library/${libraryId}/videos`,
                  { title: 'test' },
                  {
                    headers: {
                      'Content-Type': 'application/json',
                      'AccessKey': process.env.BUNNYCDN_ACCESS_KEY
                    }
                  }
                );

                const videoId = createVideo.data.guid;

                // Upload the .ts file
                const form = new FormData();
                const stream = Readable.from(data);
                form.append('file', stream, { filename: file, contentType: 'video/mp2t' });

                const uploadVideo = await axios.put(
                  `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`,
                  form,
                  {
                    headers: {
                      ...form.getHeaders(),
                      'AccessKey': process.env.BUNNYCDN_ACCESS_KEY
                    }
                  }
                );

                console.log(`Uploaded ${file} successfully`);
              } catch (error) {
                console.error('Error during upload:', error);
              }
            });
          });
        });
      }
    });

    ffmpeg.stderr.on('data', (data) => {
      console.error('FFmpeg stderr:', data.toString());
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

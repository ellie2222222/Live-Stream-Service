require("dotenv").config();

const express = require('express');
const fs = require('fs');
const moment = require('moment');
const https = require('https');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const cors = require('cors');
const os = require('os');
const authRoutes = require('./routes.js/AuthRoute');
const userRoutes = require('./routes.js/UserRoute');
const streamRoutes = require('./routes.js/StreamRoute');
const messageRoutes = require('./routes.js/MessageRoute');
const NodeMediaServer = require('node-media-server');
const { saveStreamToBunny } = require("./services/StreamService");

// application
const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173", process.env.PRODUCTION_PORT],
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// router
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', streamRoutes);
app.use('/api', messageRoutes);

// log api requests
app.use((req, res, next) => {
  console.log(req.path, req.method);
  next();
});

// // Node Media Server configuration
// const config = {
//   rtmp: {
//     port: 1935,
//     chunk_size: 60000,
//     gop_cache: true,
//     ping: 60,
//     ping_timeout: 30,
//     allow_origin: '*',
//   },
//   http: {
//     port: 8000,
//     mediaroot: './output',
//     allow_origin: '*',
//   },
// };

// // Create an instance of the media server
// const nms = new NodeMediaServer(config);

// // Handle the 'postPublish' event to start saving the stream once it's live
// nms.on('postPublish', async (_, streamPath, _params) => {
//   const streamKey = streamPath.split('/').pop();

//   try {
//     await saveStreamToBunny(streamKey);
//   } catch (error) {
//     console.error(`Failed to save stream for key '${streamKey}': ${error.message}`);
//   }
// });


// // Start the media server
// nms.run();

// start express server
const port = process.env.DEVELOPMENT_PORT || 4000;

app.listen(port, (err) => {
  if (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  } else {
    console.log(`Server started! Listening on port ${port}`);
    console.log(`Streaming server running on port ${config.http.port}`);
  }
});

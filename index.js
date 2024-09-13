require("dotenv").config();

const express = require('express')
const cors = require('cors');
const authRoutes = require('./routes.js/AuthRoute');
const userRoutes = require('./routes.js/UserRoute');
const streamRoutes = require('./routes.js/StreamRoute');
const messageRoutes = require('./routes.js/MessageRoute');

//application
const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173", process.env.DEVELOPMENT_PORT],
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

//middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// start server
const port = process.env.DEVELOPMENT_PORT || 4000;

app.listen(port, (err) => {
  if (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  } else {
    console.log(`Server started! Listening on port ${port}`);
  }
});

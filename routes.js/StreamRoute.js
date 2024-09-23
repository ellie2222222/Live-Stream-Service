const express = require("express");
const StreamController = require("../controllers/StreamController");
const AuthMiddleware = require("../middlewares/AuthMiddleware");
const streamController = new StreamController();
const upload = require("../middlewares/UploadConfig");

const streamRoutes = express.Router();

streamRoutes.get("/streams/", AuthMiddleware, streamController.getStreams);

streamRoutes.post(
  "/streams/",
  upload.single("thumbnail"),
  streamController.startStream
);

streamRoutes.post(
  "/streams/end/:streamId",
  AuthMiddleware,
  streamController.endStream
);

streamRoutes.post(
  "/streams/save/:streamId",
  AuthMiddleware,
  streamController.saveStream
);

streamRoutes.post(
  "streams/:streamId/:userId/dislike",
  streamController.dislikeByUser
);

streamRoutes.post(
  "streams/:streamId/:userId/like",
  streamController.likeByUser
);

streamRoutes.delete(
  "/streams/:streamId",
  AuthMiddleware,
  streamController.deleteStream
);

streamRoutes.get(
  "/streams/:streamId",
  AuthMiddleware,
  streamController.getStream
);

streamRoutes.patch(
  "/streams/:streamId",
  AuthMiddleware,
  streamController.updateStream
);

streamRoutes.get(
  "/streams/stream-url/:streamId",
  AuthMiddleware,
  streamController.getStreamUrl
);

streamRoutes.get(
  "/streams/categories",
  AuthMiddleware,
  streamController.getCategories
);

// New route using query params
streamRoutes.get("/stream/filter-by-category", AuthMiddleware, (req, res) => {
  console.log("Route hit!");
  streamController.getStreamByCategory(req, res);
});

module.exports = streamRoutes;

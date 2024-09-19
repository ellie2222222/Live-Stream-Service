const express = require("express");
const StreamController = require("../controllers/StreamController");
const AuthMiddleware = require("../middlewares/AuthMiddleware");
const streamController = new StreamController();
const multer = require("multer");
const upload = multer({
  dest: "uploads/",
});
const streamRoutes = express.Router();

streamRoutes.get("/streams/", AuthMiddleware, streamController.getStreams);

streamRoutes.post(
  "/streams/",
  upload.single("thumbnail"),
  streamController.startStream
);

streamRoutes.post("/streams/end", AuthMiddleware, streamController.endStream);

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

module.exports = streamRoutes;

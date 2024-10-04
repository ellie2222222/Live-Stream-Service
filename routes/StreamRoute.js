import express from "express";
import StreamController from "../controllers/StreamController.js";
import AuthMiddleware from "../middlewares/AuthMiddleware.js";
import upload from "../middlewares/UploadConfig.js";

const streamController = new StreamController();
const streamRoutes = express.Router();

// Get all streams
streamRoutes.get("/streams", AuthMiddleware, streamController.getStreams);
streamRoutes.post("/streams/searchStreams", AuthMiddleware, streamController.searchStreams);

// Post new stream
streamRoutes.post(
  "/streams",
  upload.single("thumbnail"),
  streamController.startStream
);

// Get categories for streams
streamRoutes.get(
  "/streams/categories",
  AuthMiddleware,
  streamController.getCategories
);

// Filter streams by category
streamRoutes.get(
  "/streams/filter-by-category",
  AuthMiddleware,
  streamController.getStreamByCategory
);

// Get the top 1 stream
streamRoutes.get("/streams/top1", AuthMiddleware, streamController.getTop1);

// End a stream
streamRoutes.post(
  "/streams/end/:streamId",
  AuthMiddleware,
  streamController.endStream
);

// Save a stream
streamRoutes.post(
  "/streams/save/:streamId",
  AuthMiddleware,
  streamController.saveStream
);

// Like/Dislike routes
streamRoutes.post(
  "/streams/:streamId/:userId/dislike",
  streamController.dislikeByUser
);
streamRoutes.post(
  "/streams/:streamId/:userId/like",
  streamController.likeByUser
);

// Get, Update, Delete stream
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

// Get stream URL by stream ID
streamRoutes.get(
  "/streams/stream-url/:streamId",
  AuthMiddleware,
  streamController.getStreamUrl
);

export default streamRoutes;

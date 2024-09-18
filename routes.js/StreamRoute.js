const express = require('express')
const StreamController = require('../controllers/StreamController');
const AuthMiddleware = require('../middlewares/AuthMiddleware');
const streamController = new StreamController();

const streamRoutes = express.Router();

streamRoutes.get('/streams/', AuthMiddleware, streamController.getStreams);

streamRoutes.post('/streams/start', AuthMiddleware, streamController.startStream);

streamRoutes.post('/streams/end/:streamId', AuthMiddleware, streamController.endStream);

streamRoutes.post('/streams/save/:streamId', AuthMiddleware, streamController.saveStream);

streamRoutes.delete('/streams/:streamId', AuthMiddleware, streamController.deleteStream);

streamRoutes.get('/streams/:streamId', AuthMiddleware, streamController.getStream);

streamRoutes.patch('/streams/:streamId', AuthMiddleware, streamController.updateStream);

streamRoutes.get('/streams/stream-url/:streamId', AuthMiddleware, streamController.getStreamUrl);

streamRoutes.get('/streams/categories', AuthMiddleware, streamController.getCategories);

streamRoutes.post('/streams/like', AuthMiddleware, streamController.likeStream);

module.exports = streamRoutes;
const express = require('express')
const StreamController = require('../controllers/StreamController');
const AuthMiddleware = require('../middlewares/AuthMiddleware');
const streamController = new StreamController();

const streamRoutes = express.Router();

streamRoutes.post('/stream/getUrlStream', AuthMiddleware, streamController.getUrlStream);

streamRoutes.post('/stream/likeStream', AuthMiddleware, streamController.likeStreamControll);

streamRoutes.get('/stream/getTop10Stream', streamController.getTop10Stream);

// userRoutes.patch('/users/:userId', AuthMiddleware, userController.updateUser);

// userRoutes.get('/users/:userId', AuthMiddleware, userController.getUser);

// userRoutes.delete('/users/:userId', AuthMiddleware, userController.deleteUser);

module.exports = streamRoutes;
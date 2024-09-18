const express = require('express')
const StreamController = require('../controllers/StreamController');
const AuthMiddleware = require('../middlewares/AuthMiddleware');
const streamController = new StreamController();

const streamRoutes = express.Router();

streamRoutes.get('/stream/getCate', AuthMiddleware, streamController.getCate);

streamRoutes.post('/stream/likeStream', AuthMiddleware, streamController.likeStreamControll);

streamRoutes.get('/stream/getTop10Stream', streamController.getTop10Stream);

module.exports = streamRoutes;
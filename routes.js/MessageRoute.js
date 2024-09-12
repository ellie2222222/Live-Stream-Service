const express = require('express')
const MessageController = require('../controllers/MessageController');
const AuthMiddleware = require('../middlewares/AuthMiddleware');
const messageController = new MessageController();

const messageRoutes = express.Router();

messageRoutes.delete('/messages/:messageId', AuthMiddleware, messageController.deleteMessage);

messageRoutes.get('/messages/:messageId', AuthMiddleware, messageController.getMessage);

messageRoutes.get('/messages/stream-messages/:streamId', AuthMiddleware, messageController.getMessages);

// messageRoutes.patch('/messages/:messageId', AuthMiddleware, messageController.updateMessage);

module.exports = messageRoutes;
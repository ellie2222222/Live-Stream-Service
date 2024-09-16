const express = require("express");
const MessageController = require("../controllers/MessageController");
const AuthMiddleware = require("../middlewares/AuthMiddleware");
const messageController = new MessageController();

const messageRoutes = express.Router();

messageRoutes.post("/messages", messageController.createAMessage);

messageRoutes.delete("/messages/:messageId", messageController.deleteMessage);

messageRoutes.get(
  "/messages/:messageId",
  AuthMiddleware,
  messageController.getMessage
);

messageRoutes.get(
  "/messages/stream-messages/:streamId",
  AuthMiddleware,
  messageController.getMessages
);

messageRoutes.put("/messages/:messageId", messageController.updateMessage);

module.exports = messageRoutes;

import express from "express";
import MessageController from "../controllers/MessageController.js";
import AuthMiddleware from "../middlewares/AuthMiddleware.js";

const messageController = new MessageController();
const messageRoutes = express.Router();

messageRoutes.post("/messages", messageController.createAMessage);

messageRoutes.delete("/messages/:messageId", messageController.deleteMessage);

messageRoutes.get("/messages/:messageId", AuthMiddleware, messageController.getMessage);

messageRoutes.get("/messages/stream-messages/:streamId", AuthMiddleware, messageController.getMessages);

messageRoutes.put("/messages/:messageId", messageController.updateMessage);

export default messageRoutes;

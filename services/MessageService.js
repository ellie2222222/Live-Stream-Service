const mongoose = require("mongoose");
const DatabaseTransaction = require("../repositories/DatabaseTransaction");

const findMessage = async (messageId) => {
  try {
    const connection = new DatabaseTransaction();

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ error: "Invalid message ID" });
    }

    const message = await connection.messageRepository.getMessageById(
      messageId
    );

    return message;
  } catch (error) {
    throw new Error(error.message);
  }
};

const findAllMessagesByStreamId = async (streamId) => {
  try {
    const connection = new DatabaseTransaction();

    const messages =
      await connection.messageRepository.getAllMessagesByStreamId(streamId);

    return messages;
  } catch (error) {
    throw new Error(error.message);
  }
};

const updateMessageService = async (messageId, updateData) => {
  try {
    const connection = new DatabaseTransaction();

    const message = await connection.messageRepository.updateMessage(
      messageId,
      updateData
    );

    return message;
  } catch (error) {
    throw new Error(error.message);
  }
};

const deleteMessageService = async (messageId) => {
  try {
    const connection = new DatabaseTransaction();
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      console.log("ko valid");
    }
    const message = await connection.messageRepository.deleteMessage(messageId);
    return message;
  } catch (error) {
    throw new Error(error.message);
  }
};

const createAMessageService = async (userId, streamId, content) => {
  try {
    const connection = new DatabaseTransaction();
    const response = await connection.messageRepository.createMessage({
      userId,
      streamId,
      content,
    });
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = {
  createAMessageService,
  findMessage,
  findAllMessagesByStreamId,
  updateMessageService,
  deleteMessageService,
};
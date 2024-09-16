const {
  deleteMessageService,
  findMessage,
  findAllMessagesByStreamId,
  createAMessageService,
  updateMessageService,
} = require("../services/MessageService");

class MessageController {
  // get a message
  async getMessage(req, res) {
    const { messageId } = req.params;

    try {
      const message = await findMessage(messageId);

      res.status(200).json({ data: message, message: "Success" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // get all messages
  async getMessages(req, res) {
    const { streamId } = req.params;

    try {
      const messages = await findAllMessagesByStreamId(streamId);

      res.status(200).json({ data: messages, message: "Success" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateMessage(req, res) {
    const { messageId } = req.params;
    const { content } = req.body;
    const updateData = { content };

    try {
      const message = await updateMessageService(messageId, updateData);

      res.status(200).json({ data: message, message: "Success" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // delete a message
  async deleteMessage(req, res) {
    const { messageId } = req.params;
    try {
      await deleteMessageService(messageId);
      res.status(200).json({ message: "Success" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async createAMessage(req, res) {
    const { userId, streamId, content } = req.body;
    try {
      await createAMessageService(userId, streamId, content);
      res.status(200).json({ message: "Success" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = MessageController;

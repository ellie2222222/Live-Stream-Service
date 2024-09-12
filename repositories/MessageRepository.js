const Message = require('../models/MessageModel');

class MessageRepository {
    // Create a new message
    async createMessage(data, session) {
        try {
            const message = await Message.create([data], { session });
            return message[0];
        } catch (error) {
            throw new Error(`Error creating message: ${error.message}`);
        }
    }

    // Get a message by ID
    async getMessageById(messageId) {
        try {
            const message = await Message.findOne({ _id: messageId, isDeleted: false });

            if (!message) {
                throw new Error('Message not found');
            }

            return message;
        } catch (error) {
            throw new Error(`Error finding message: ${error.message}`);
        }
    }

    // Update a message
    async updateMessage(messageId, updateData, session) {
        try {
            const message = await Message.findByIdAndUpdate(messageId, updateData, { new: true, runValidators: true, session });

            if (!message) {
                throw new Error('Message not found');
            }

            return message;
        } catch (error) {
            throw new Error(`Error updating message: ${error.message}`);
        }
    }

    // Delete a message by ID
    async deleteMessage(messageId, session) {
        try {
            const message = await Message.findByIdAndUpdate(messageId, { isDeleted: true }, { new: true, runValidators: true, session });

            if (!message) {
                throw new Error('Message not found');
            }

            return message;
        } catch (error) {
            throw new Error(`Error deleting message: ${error.message}`);
        }
    }

    // Get all messages
    async getAllMessagesByStreamId(streamId) {
        try {
            const messages = await Message.find({ streamId, isDeleted: false });

            return messages;
        } catch (error) {
            throw new Error(`Error fetching messages: ${error.message}`);
        }
    }
}

module.exports = MessageRepository;

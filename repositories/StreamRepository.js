const Stream = require("../models/StreamModel");

class StreamRepository {
  // Create a new stream
  async createStream(data, session) {
    try {
      const stream = await Stream.create([data], { session });
      return stream[0];
    } catch (error) {
      throw new Error(`Error creating stream: ${error.message}`);
    }
  }

  // End a stream by setting the endedAt field
  async endStream(streamId, session) {
    try {
      const stream = await Stream.findByIdAndUpdate(
        streamId,
        {
          endedAt: new Date(),
          streamUrl: "",
        },
        { new: true, runValidators: true, session }
      );

      if (!stream) {
        throw new Error(`Stream with ID ${streamId} not found`);
      }

      return stream;
    } catch (error) {
      throw new Error(`Error ending stream: ${error.message}`);
    }
  }

  // Get a stream by ID
  async getStreamById(streamId) {
    try {
      const stream = await Stream.findOne({ _id: streamId, isDeleted: false });

      if (!stream) {
        throw new Error("Stream not found");
      }

      return stream;
    } catch (error) {
      throw new Error(`Error finding stream: ${error.message}`);
    }
  }

  // Update a stream
  async updateStream(streamId, updateData, session) {
    try {
      const stream = await Stream.findByIdAndUpdate(streamId, updateData, {
        new: true,
        runValidators: true,
        session,
      });

      if (!stream) {
        throw new Error("Stream not found");
      }

      return stream;
    } catch (error) {
      throw new Error(`Error updating stream: ${error.message}`);
    }
  }

  // Delete a stream by ID
  async deleteStream(streamId, session) {
    try {
      const stream = await Stream.findByIdAndUpdate(
        streamId,
        { isDeleted: true },
        { new: true, runValidators: true, session }
      );

      if (!stream) {
        throw new Error("Stream not found");
      }

      return stream;
    } catch (error) {
      throw new Error(`Error deleting stream: ${error.message}`);
    }
  }

  // Get all streams
  async getAllStreams(query) {
    try {
      const filters = { isDeleted: false, ...query };

      const streams = await Stream.find(filters);

      return streams;
    } catch (error) {
      throw new Error(`Error fetching streams: ${error.message}`);
    }
  }

  async dislikeByUserRepo(streamId, userId) {
    try {
      const stream = await Stream.findOne({ _id: streamId });

      if (!stream) {
        throw new Error("Stream not found");
      }

      await Stream.updateOne({ _id: streamId }, { $pull: { likeBy: userId } });
      console.log(`User ${userId} removed from likeBy of stream ${streamId}`);
      return true;
    } catch (error) {
      console.error("Error removing user from likeBy:", error);
    }
    return false;
  }

  async likeByUserRepo(streamId, userId) {
    try {
      const stream = await Stream.findOne({ _id: streamId });

      if (!stream) {
        throw new Error("Stream not found");
      }

      await Stream.updateOne({ _id: streamId }, { $push: { likeBy: userId } });

      console.log(`User ${userId} added to likeBy of stream ${streamId}`);
      return true;
    } catch (error) {
      console.error("Error adding user to likeBy:", error);
      return false;
    }
  }
}

module.exports = StreamRepository;

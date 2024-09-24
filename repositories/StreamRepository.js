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
  async getAllStreams(pageSize, pageNumber, query) {
    try {
      const filters = { isDeleted: false, ...query };

      const streams = await Stream.find(filters)
        .skip(pageSize * (pageNumber - 1))
        .limit(pageSize);

      const totalStreams = await Stream.countDocuments(filters);
      const totalPages = Math.ceil(totalStreams / pageSize);

      return { streams, totalPages };
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

      await Stream.updateOne(
        { _id: streamId },
        { $pull: { likeBy: userId } } // Use $pull to remove userId from likeBy array
      );
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

      await Stream.updateOne(
        { _id: streamId },
        { $addToSet: { likeBy: userId } }
      );

      console.log(`User ${userId} added to likeBy of stream ${streamId}`);
      return true;
    } catch (error) {
      console.error("Error adding user to likeBy:", error);
      return false;
    }
  }
  async getStreamsByCategory(category, page = 1, itemsPerPage = 10) {
    const skip = (page - 1) * itemsPerPage;
    try {
      const filter = { categories: category, endedAt: null }; // Filter for ongoing streams only

      const streams = await Stream.find(filter).skip(skip).limit(itemsPerPage);

      const totalStreams = await Stream.countDocuments(filter);

      return { streams, totalStreams };
    } catch (error) {
      throw new Error(`Error getting streams by category: ${error.message}`);
    }
  }

  async CurrentlyTop1(type) {
    console.log("repo is called, type: ", type);
    try {
      let stream;

      if (type.toLowerCase() === "view") {
        // Sorting by view count
        stream = await Stream.find({ endedAt: null })
          .sort({ currentViewCount: -1 })
          .limit(1);
      } else if (type.toLowerCase() === "like") {
        // Sorting by the number of likes (size of likeBy array)
        const result = await Stream.aggregate([
          { $match: { endedAt: null } }, // Filter for live streams
          { $addFields: { likeCount: { $size: "$likeBy" } } }, // Add a field for the size of likeBy array
          { $sort: { likeCount: -1 } }, // Sort by likeCount (descending)
          { $limit: 1 }, // Limit to the top 1 stream
        ]);

        stream = result; // Since aggregation returns an array, pick the first element
      } else {
        throw new Error(`Unsupported type: ${type}. Use 'view' or 'like'.`);
      }

      return stream;
    } catch (error) {
      throw new Error(
        `Error getting top 1 stream for ${type}: ${error.message}`
      );
    }
  }
}

module.exports = StreamRepository;
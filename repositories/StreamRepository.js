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
      const stream = await Stream.findOne({ _id: streamId, isDeleted: false })
      .populate({
        path: "userId",
        select: "name avatarUrl", 
      });;

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
        .limit(pageSize)
        .populate({
          path: "userId", // Path to the related User document
          select: "name avatarUrl", // Limit the fields from User document
        });
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

      // Find the streams, populate user data, and convert to plain objects
      const streams = await Stream.find(filter)
        .skip(skip)
        .limit(itemsPerPage)
        .populate({
          path: "userId",
          select: "name avatarUrl", // Only select the fields you need
        })
        .lean(); // Convert to plain JavaScript objects

      // Add userDetails field to each stream
      const streamsWithUserDetails = streams.map((stream) => {
        return {
          ...stream,
          userDetails: {
            name: stream.userId.name,
            avatarUrl: stream.userId.avatarUrl,
          },
          userId: stream.userId._id, // Maintain original userId
        };
      });

      const totalStreams = await Stream.countDocuments(filter);

      return { streams: streamsWithUserDetails, totalStreams };
    } catch (error) {
      throw new Error(`Error getting streams by category: ${error.message}`);
    }
  }

  async CurrentlyTop1(type) {
    console.log("repo is called, type: ", type);
    try {
      let stream;

      if (type.toLowerCase() === "view") {
        // Sorting by view count and populating the userId with name and avatarUrl
        stream = await Stream.find({ endedAt: null })
          .sort({ currentViewCount: -1 })
          .limit(1)
          .populate({
            path: "userId",
            select: "name avatarUrl", // Only fetch the name and avatarUrl fields from the User document
          });
      } else if (type.toLowerCase() === "like") {
        // Sorting by the number of likes (size of likeBy array) and populating userId
        const result = await Stream.aggregate([
          { $match: { endedAt: null } }, // Filter for live streams
          { $addFields: { likeCount: { $size: "$likeBy" } } }, // Add a field for the size of likeBy array
          { $sort: { likeCount: -1 } }, // Sort by likeCount (descending)
          { $limit: 1 }, // Limit to the top 1 stream
        ]);

        // If we get a result, find the stream by its ID to populate the userId
        if (result.length > 0) {
          stream = await Stream.findById(result[0]._id).populate({
            path: "userId",
            select: "name avatarUrl", // Only fetch the name and avatarUrl fields from the User document
          });
        } else {
          stream = null;
        }
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

  // Tìm stream theo category
  async findStreamsByCategory(categoryName, title) {
    try {
      const query = {
        ...(categoryName.length > 0 && { categories: { $all: categoryName } }),
        title: { $regex: title, $options: "i" },
        endedAt: null,
      };
      return await Stream.find(query);
    } catch (error) {
      throw new Error(
        "Error while fetching streams by category: " + error.message
      );
    }
  }
}

module.exports = StreamRepository;

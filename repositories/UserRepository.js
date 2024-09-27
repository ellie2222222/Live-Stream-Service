const mongoose = require("mongoose");
const User = require("../models/UserModel");

class UserRepository {
  // Create a new user
  async createUser(data, session) {
    try {
      const user = await User.create([data], { session });
      return user[0];
    } catch (error) {
      throw new Error(`Error creating user: ${error.message}`);
    }
  }

  // Update a user by ID
  async updateUser(userId, updateData, session) {
    try {
      const user = await User.findByIdAndUpdate(userId, updateData, {
        new: true,
        runValidators: true,
        session,
      });

      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }

      return user;
    } catch (error) {
      throw new Error(`Error updating user: ${error.message}`);
    }
  }

  // Deactivate a user by ID
  async deactivateUser(userId, session) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { $set: { isActive: false } },
        { new: true, runValidators: true, session }
      );

      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }

      return user;
    } catch (error) {
      throw new Error(`Error deactivating user: ${error.message}`);
    }
  }

  // Find a user by ID
  async findAllActiveUsers() {
    try {
      const user = await User.find({ isActive: true });

      return user;
    } catch (error) {
      throw new Error(`Error finding all active users: ${error.message}`);
    }
  }

  // Find a user by ID
  async findUserById(userId) {
    try {
      const user = await User.findOne({ _id: userId, isActive: true });

      if (!user) {
        throw new Error(
          `User with ID ${userId} not found or has been deactivated`
        );
      }

      return user;
    } catch (error) {
      throw new Error(`Error finding user: ${error.message}`);
    }
  }

  // Find a user by email
  async findUserByEmail(email) {
    try {
      const user = await User.findOne({ email });

      return user;
    } catch (error) {
      throw new Error(`Error finding user: ${error.message}`);
    }
  }

  async verifyUserEmail(email) {
    try {
      const user = await User.findOneAndUpdate(
        { email },
        { $set: { verify: true } },
        { new: true, runValidators: true }
      );

      if (!user) {
        throw new Error(`User with email ${email} not found`);
      }

      return user;
    } catch (error) {
      throw new Error(`Error verifying user email: ${error.message}`);
    }
  }

  async changePassword(userId, newPassword) {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }

      user.password = newPassword;
      await user.save();

      return user;
    } catch (error) {
      throw new Error(`Error changing user password: ${error.message}`);
    }
  }
  async getTopUsersByLikes(limit = 10) {
    try {
      const topUsers = await User.aggregate([
        {
          // Join with the Stream collection to get user's streams
          $lookup: {
            from: "streams", // Stream collection
            localField: "_id",
            foreignField: "userId",
            as: "userStreams",
          },
        },
        {
          // Unwind userStreams to get individual stream documents; skip users with no streams
          $unwind: "$userStreams",
        },
        {
          // Calculate total likes for each stream by checking the size of likeBy array
          $addFields: {
            totalLikes: { $size: "$userStreams.likeBy" },
          },
        },
        {
          // Group by user and sum up the total likes across all streams
          $group: {
            _id: "$_id",
            name: { $first: "$name" },
            email: { $first: "$email" },
            avatarUrl: { $first: "$avatarUrl" },
            totalLikes: { $sum: "$totalLikes" }, // Sum total likes across all streams
          },
        },
        {
          // Sort by total likes in descending order
          $sort: { totalLikes: -1 },
        },
        {
          // Limit the number of results returned
          $limit: limit,
        },
      ]);
      console.log(topUsers.length);
      return topUsers;
    } catch (error) {
      throw new Error(`Error getting top users by likes: ${error.message}`);
    }
  }

  //total likes of a user
  async getUserTotalLikes(userId) {
    console.log("repo");
    const userTotalLikes = await User.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(userId) }, // Use 'new' keyword here
      },
      {
        $lookup: {
          from: "streams",
          localField: "_id",
          foreignField: "userId",
          as: "userStreams",
        },
      },
      {
        $unwind: "$userStreams",
      },
      { $addFields: { totalLikes: { $size: "$userStreams.likeBy" } } },
      {
        $group: {
          _id: "$_id",
          totalLikes: { $sum: "$totalLikes" },
        },
      },
    ]);

    if (userTotalLikes.length === 0) {
      return {
        id: userId,
        totalLikes: 0,
        message: "No streams or likes found for this user",
      };
    }

    return userTotalLikes[0];
  }
}
module.exports = UserRepository;

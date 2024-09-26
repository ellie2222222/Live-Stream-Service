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
}
module.exports = UserRepository;

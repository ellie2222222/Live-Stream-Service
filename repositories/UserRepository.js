const User = require('../models/UserModel');
class UserRepository {
    // Create a new user
    async createUser(data, session) {
        try {
            const user = await User.create([data], { session });
            return user;
        } catch (error) {
            throw new Error(`Error creating user: ${error.message}`);
        }
    }

    // Update a user by ID
    async updateUser(userId, updateData, session) {
        try {
            const user = await User.findByIdAndUpdate(userId, updateData, { new: true, session });
            return user;
        } catch (error) {
            throw new Error(`Error updating user: ${error.message}`);
        }
    }

    // Delete a user by ID
    async deleteUser(userId, session) {
        try {
            const user = await User.findByIdAndDelete(userId, { session });
            return user;
        } catch (error) {
            throw new Error(`Error deleting user: ${error.message}`);
        }
    }

    // Find a user by ID
    async findUserById(userId, session) {
        try {
            const user = await User.findById(userId, null, { session });
            return user;
        } catch (error) {
            throw new Error(`Error finding user: ${error.message}`);
        }
    }

    async findUserByEmail(email) {
        try {
            const user = await User.findOne({ email });
            return user;
        } catch (error) {
            throw new Error(`Error finding user by email: ' ${error.message}`);
        }
    }
}

module.exports = UserRepository;

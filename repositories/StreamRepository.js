const Stream = require('../models/StreamModel');
const User = require('../models/UserModel');

class StreamRepository {

    // Create a new user
    async checkUser(email) {
        try {
            const user = await User.find({email});
            if(!user){

            }
        } catch (error) {
            throw new Error(`Error creating user: ${error.message}`);
        }
    }
    
    // Create a new user
    async likeStreamRepo(data, session) {
        try {
            const updatedStream = await Stream.findByIdAndUpdate(data._id, data, { new: true, session });
            return updatedStream;
        } catch (error) {
            throw new Error(`Error creating like: ${error.message}`);
        }
    }

    async findStreamsByToken(token) {
        try {
            const streams  = await Stream.find({ _id: token, isDeleted: false });

            if (!streams || streams.length === 0) {
                throw new Error(`No streams found for user with ID ${token}`);
            }

            return streams;
        } catch (error) {
            throw new Error(`Error finding user: ${error.message}`);
        }
    }
}

module.exports = StreamRepository;

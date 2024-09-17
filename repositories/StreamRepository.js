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
}

module.exports = StreamRepository;

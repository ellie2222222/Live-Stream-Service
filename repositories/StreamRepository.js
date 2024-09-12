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
    async createStream(data, session) {
        try {
            const user = await Stream.create([data], { session });
            return user[0];
        } catch (error) {
            throw new Error(`Error creating user: ${error.message}`);
        }
    }
}

module.exports = StreamRepository;

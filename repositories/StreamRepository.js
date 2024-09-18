const Stream = require('../models/StreamModel');

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
                    streamUrl: '',
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
                throw new Error('Stream not found');
            }

            return stream;
        } catch (error) {
            throw new Error(`Error finding stream: ${error.message}`);
        }
    }

    // Update a stream
    async updateStream(streamId, updateData, session) {
        try {
            const stream = await Stream.findByIdAndUpdate(streamId, updateData, { new: true, runValidators: true, session });

            if (!stream) {
                throw new Error('Stream not found');
            }

            return stream;
        } catch (error) {
            throw new Error(`Error updating stream: ${error.message}`);
        }
    }

    // Delete a stream by ID
    async deleteStream(streamId, session) {
        try {
            const stream = await Stream.findByIdAndUpdate(streamId, { isDeleted: true }, { new: true, runValidators: true, session });

            if (!stream) {
                throw new Error('Stream not found');
            }

            return stream;
        } catch (error) {
            throw new Error(`Error deleting stream: ${error.message}`);
        }
    }

    // Get all streams
    async getAllStreams() {
        try {
            const streams = await Stream.find({ isDeleted: false });

            return streams;
        } catch (error) {
            throw new Error(`Error fetching streams: ${error.message}`);
        }
    }

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

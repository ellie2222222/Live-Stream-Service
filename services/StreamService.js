const mongoose = require("mongoose");
const DatabaseTransaction = require("../repositories/DatabaseTransaction");

const findStream = async (streamId) => {
    try {
        const connection = new DatabaseTransaction();

        if (!mongoose.Types.ObjectId.isValid(streamId)) {
            return res.status(400).json({ error: 'Invalid stream ID' });
        }

        const stream = await connection.streamRepository.getStreamById(streamId);

        return stream;
    } catch (error) {
        throw new Error(error.message);
    }
}

const findAllStreams = async () => {
    try {
        const connection = new DatabaseTransaction();

        const streams = await connection.streamRepository.getAllStreams();

        return streams;
    } catch (error) {
        throw new Error(error.message);
    }
}

const updateStream = async (streamId, updateData) => {
    try {
        const connection = new DatabaseTransaction();

        if (!mongoose.Types.ObjectId.isValid(streamId)) {
            return res.status(400).json({ error: 'Invalid stream ID' });
        }

        const stream = await connection.streamRepository.updateStream(streamId, updateData);

        return stream;
    } catch (error) {
        throw new Error(error.message);
    }
}

const deleteStream = async (streamId) => {
    try {
        const connection = new DatabaseTransaction();

        if (!mongoose.Types.ObjectId.isValid(streamId)) {
            return res.status(400).json({ error: 'Invalid stream ID' });
        }

        const stream = await connection.streamRepository.deleteStream(streamId);

        return stream;
    } catch (error) {
        throw new Error(error.message);
    }
}

const endStream = async (streamId) => {
    try {
        const connection = new DatabaseTransaction();

        if (!mongoose.Types.ObjectId.isValid(streamId)) {
            return res.status(400).json({ error: 'Invalid stream ID' });
        }

        const stream = await connection.streamRepository.endStream(streamId);

        return stream;
    } catch (error) {
        throw new Error(error.message);
    }
}

module.exports = {
    findStream,
    findAllStreams,
    endStream,
    updateStream,
    deleteStream,
};

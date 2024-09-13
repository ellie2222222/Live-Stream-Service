const { deleteStream, updateStream, endStream, findStream, findAllStreams } = require("../services/StreamService");

class StreamController {
    async getUrlStream (req, res) {
        
        try {
            const { email } = req.body;

            const url = await getUrlStream(email);

            res.status(200).json({ url, message: 'Access granted to live stream' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

    // get a stream
    async getStream(req, res) {
        const { streamId } = req.params;

        try {
            const stream = await findStream(streamId);

            res.status(200).json({ data: stream, message: "Success" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

    // get all streams
    async getStreams(req, res) {
        try {
            const streams = await findAllStreams();

            res.status(200).json({ data: streams, message: "Success" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

    // create a stream
    async startStream(req, res) {
        try {
            const stream = null;

            res.status(200).json({ data: stream, message: "Success" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

    // end a stream
    async endStream(req, res) {
        const { streamId } = req.body;

        try {
            const stream = await endStream(streamId);

            res.status(200).json({ data: stream, message: "Success" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

    // update a stream
    async updateStream(req, res) {
        const { streamId } = req.params;
        const { title, thumbnailUrl} = req.body;
        const updateData = { title, thumbnailUrl }

        try {
            const stream = await updateStream(streamId, updateData);

            res.status(200).json({ data: stream, message: "Success" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

    // delete a stream
    async deleteStream(req, res) {
        const { streamId } = req.params;

        try {
            await deleteStream(streamId);

            res.status(200).json({ message: "Success" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = StreamController;
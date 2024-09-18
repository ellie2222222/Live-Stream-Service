const { deleteStream, updateStream, endStream, findStream, findAllStreams, startStream, saveStream, getStreamUrl } = require("../services/StreamService");

class StreamController {
    async getStreamUrl (req, res) {
        const { streamId } = req.params;

        try {
            const streamUrl = await getStreamUrl(streamId);

            res.status(200).json({ data: streamUrl, message: 'Success' });
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

    async saveStream(req, res) {
        const { streamId } = req.params;
        const userId = req.userId
    
        try {
            await saveStream(streamId, userId);

            return res.status(200).json({ message: 'Stream saved successfully' });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    };

    // create a stream
    async startStream(req, res) {
        const { title, thumbnailUrl, categories } = req.body;
        const userId = req.userId;
        const data = { title, thumbnailUrl, userId, categories };
        const responseData = {
            streamRTMP: null,
            streamKey: null,
        }

        try {
            const returnData = await startStream(data);

            responseData.stream = returnData.stream;
            responseData.streamKey = returnData.email;
            responseData.streamRTMP = returnData.streamRTMP;

            res.status(200).json({ data: responseData, message: "Success" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

    // end a stream
    async endStream(req, res) {
        const { streamId } = req.params;

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
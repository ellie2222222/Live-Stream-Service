const { uploadToBunny } = require("../middlewares/UploadToBunny");
const typesMapping = require('../middlewares/typesMapping');
const {
  deleteStream,
  updateStream,
  endStream,
  findStream,
  findAllStreams,
  dislikeByUserService,
  likeByUserService,
  createAStreamService,
  saveStream,
} = require("../services/StreamService");
const fs = require("fs");
require("dotenv").config();

const BUNNY_CDN_URL = process.env.BUNNY_STORAGE_URL || "https://sg.storage.bunnycdn.com/live-stream-service/";
const BUNNY_CDN_API_KEY = process.env.BUNNYCDN_STORAGE_PASSWORD || "e68740b8-e7b2-4df2-82b616b8ab35-77e2-42d6";

class StreamController {
  async getCategories(req, res) {
    try {

        if (!typesMapping || Object.keys(typesMapping).length === 0) {
            return res.status(500).json({ error: 'Types mapping is not defined' });
        }

        const categories = Object.entries(typesMapping).map(([key, value]) => ({
            id: key,
            name: value,
        }));

        res.status(200).json({ data: categories, message: 'Success' });
    } catch (error) {
        console.error('Error in getCate:', error.message);
        res.status(500).json({ error: error.message });
    }
  }


  // async getCategories(req, res) {
  //   try {
  //     const token = req.userId;

  //     if (!token) {
  //       return res.status(400).json({ error: 'Token is Invalid' });
  //     }

  //     const categories = Object.entries(typesMapping).map(([key, value]) => ({
  //       id: key,
  //       name: value,
  //     }));

  //     res.status(200).json({ data: categories, token: token, message: 'Success' });
  //   } catch (error) {

  //     console.error('Error in getCate:', error.message);
  //     res.status(500).json({ error: error.message });
  //   }
  // }

  async likeStream(req, res) {
    try {

      const { streamId, action, email } = req.body;

      const likeStream = await likeStreamService(streamId, action, email);

      res.status(201).json({ like: likeStream, message: "CreateStream success" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  async getStreamUrl(req, res) {
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
  }

  // get all streams
  async getStreams(req, res) {
    const {page, size, isStreaming } = req.query;
    const query = {};

    if (isStreaming) {
      query.endedAt = isStreaming === 'true' ? "" : { $ne: "" };
    }

    try {
      const streams = await findAllStreams(page, size, query);

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

  // Create a stream
  async startStream(req, res) {
    const { title, description, categories, userId, email } = req.body;
    const thumbnailFile = req.file;

    if (!thumbnailFile) {
      return res.status(400).send({ error: "Thumbnail file is required"});
    }

    try {
      // Upload thumbnail to Bunny CDN
      const thumbnailUrl = await uploadToBunny(thumbnailFile);

      const bunnyStorageCdn = process.env.BUNNY_STORAGE_CDN || "live-stream-service.b-cdn.net";
      const streamUrl = `https://${bunnyStorageCdn}/video/${email}/stream-result-${email}.m3u8`;

      const stream = await createAStreamService(
        userId,
        title,
        categories,
        thumbnailUrl,
        streamUrl
      );

      res.status(201).json({ message: "Stream created successfully", data: stream });
    } catch (error) {
      console.error('Error starting stream:', error.message);
      res.status(500).json({ error: error.message });
    }
  }

  // end a stream
  async endStream(req, res) {
    const { streamId } = req.params;

    try {
      const stream = await endStream(streamId);

      res.status(200).json({ data: stream, message: "Success" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // update a stream
  async updateStream(req, res) {
    const { streamId } = req.params;
    const { title } = req.body;
    const thumbnailFile = req.file;
    let thumbnailUrl = req.body.thumbnailUrl;
  
    try {
      if (thumbnailFile) {
        thumbnailUrl = await uploadToBunny(thumbnailFile);
      }

      const updateData = { title, thumbnailUrl };
  
      const stream = await updateStream(streamId, updateData);
  
      res.status(200).json({ data: stream, message: "Stream updated successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

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

  async dislikeByUser(req, res) {
    const { streamId, userId } = req.params;
    try {
      const response = await dislikeByUserService(streamId, userId);
      res.status(200).json({ message: "Success" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async likeByUser(req, res) {
    const { streamId, userId } = req.params;
    try {
      const response = await likeByUserService(streamId, userId);
      res.status(200).json({ message: "Success" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = StreamController;
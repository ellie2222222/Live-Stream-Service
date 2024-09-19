const {
  deleteStream,
  updateStream,
  endStream,
  findStream,
  findAllStreams,
  getUrlStream,
  dislikeByUserService,
  likeByUserService,
  createAStreamService,
} = require("../services/StreamService");
const fs = require("fs");
const BUNNY_CDN_URL = "https://sg.storage.bunnycdn.com/live-stream-service/";
const BUNNY_CDN_API_KEY = "e68740b8-e7b2-4df2-82b616b8ab35-77e2-42d6";
const axios = require("axios");

class StreamController {
  async getUrlStream(req, res) {
    try {
      const { email } = req.body;

      const url = await getUrlStream(email);

      res.status(200).json({ url, message: "Access granted to live stream" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

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
    try {
      const streams = await findAllStreams();

      res.status(200).json({ data: streams, message: "Success" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // create a stream
  async startStream(req, res) {
    const { title, description, categories, userId } = req.body;
    const thumbnailFile = req.file;
    let thumbnailUrl = "";
    if (!thumbnailFile) {
      return res.status(400).send("Thumbnail file is required");
    }
    try {
      const fileStream = fs.createReadStream(thumbnailFile.path);

      const headers = {
        AccessKey: BUNNY_CDN_API_KEY,
        "Content-Type": thumbnailFile.mimetype,
      };
      const name = thumbnailFile.originalname.trim().replace(/\s+/g, "%20");
      const uniqueName = `${Date.now()}-${name}`;
      const bunnyCdnResponse = await axios.put(
        `${BUNNY_CDN_URL}${uniqueName}`, // Define the storage path and file name
        fileStream,
        { headers }
      );
      fs.unlinkSync(thumbnailFile.path);

      console.log("File uploaded successfully:", bunnyCdnResponse.data);
      thumbnailUrl = `https://live-stream-service.b-cdn.net/${uniqueName}`;
    } catch (error) {
      res.status(500).json({ error: error.message });
    }

    try {
      const stream = await createAStreamService(
        userId,
        title,
        description,
        categories,
        thumbnailUrl
      );
      res.status(201).json({ message: "Create stream success", data: stream });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // end a stream
  async endStream(req, res) {
    const { streamId } = req.body;

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
    const { title, thumbnailUrl } = req.body;
    const updateData = { title, thumbnailUrl };

    try {
      const stream = await updateStream(streamId, updateData);

      res.status(200).json({ data: stream, message: "Success" });
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

import { uploadToBunny } from "../middlewares/UploadToBunny.js";
import typesMapping from "../middlewares/typesMapping.js";
import {
  deleteStream,
  updateStream,
  endStream,
  findStream,
  findAllStreams,
  dislikeByUserService,
  likeByUserService,
  createAStreamService,
  saveStream,
  getStreamByCategory,
  getTop1,
  searchStreamsByCategory,
} from "../services/StreamService.js";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const BUNNY_CDN_URL =
  process.env.BUNNY_STORAGE_URL ||
  "https://sg.storage.bunnycdn.com/live-stream-service/";
const BUNNY_CDN_API_KEY =
  process.env.BUNNYCDN_STORAGE_PASSWORD ||
  "e68740b8-e7b2-4df2-82b616b8ab35-77e2-42d6";

class StreamController {
  async getCategories(req, res) {
    try {
      if (!typesMapping || Object.keys(typesMapping).length === 0) {
        return res.status(500).json({ error: "Types mapping is not defined" });
      }

      const categories = Object.entries(typesMapping).map(([key, value]) => ({
        id: key,
        name: value.name,
        image: value.image,
      }));

      res.status(200).json({ data: categories, message: "Success" });
    } catch (error) {
      console.error("Error in getCategories:", error.message);
      res.status(500).json({ error: error.message });
    }
  }

  async likeStream(req, res) {
    try {
      const { streamId, action, email } = req.body;

      const likeStream = await likeByUserService(streamId, action, email);

      res.status(201).json({ like: likeStream, message: "CreateStream success" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getStreamUrl(req, res) {
    const { streamId } = req.params;

    try {
      const streamUrl = await getStreamUrl(streamId);

      res.status(200).json({ data: streamUrl, message: "Success" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getStream(req, res) {
    const { streamId } = req.params;
    try {
      const stream = await findStream(streamId);

      res.status(200).json({ data: stream, message: "Success" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getStreams(req, res) {
    const { page, size, isStreaming } = req.query;
    const query = {};

    if (isStreaming) {
      query.endedAt = isStreaming === "true" ? "" : { $ne: "" };
    }

    try {
      const streams = await findAllStreams(page, size, query);

      res.status(200).json({ data: streams, message: "Success" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async searchStreams(req, res) {
    try {
      const categoryIndex = req.query.categoryIndex;

      const categoryIndexes = categoryIndex
        ? Array.isArray(categoryIndex)
          ? categoryIndex
          : [categoryIndex]
        : [];

      const categoryIndexesNumbers = categoryIndexes.map((index) =>
        parseInt(index)
      );

      const title = req.query.title || "";

      const streams = await searchStreamsByCategory(
        categoryIndexesNumbers,
        title
      );
      res.status(200).json(streams);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async saveStream(req, res) {
    const { streamId } = req.params;
    const userId = req.userId;

    try {
      await saveStream(streamId, userId);

      return res.status(200).json({ message: "Stream saved successfully" });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  async startStream(req, res) {
    const { title, categories, userId, email } = req.body;
    const thumbnailFile = req.file;

    if (!thumbnailFile) {
      return res.status(400).send({ error: "Thumbnail file is required" });
    }

    try {
      const thumbnailUrl = await uploadToBunny(thumbnailFile);

      const bunnyStorageCdn =
        process.env.BUNNY_STORAGE_CDN || "live-stream-service.b-cdn.net";
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
      console.error("Error starting stream:", error.message);
      res.status(500).json({ error: error.message });
    }
  }

  async endStream(req, res) {
    const { streamId } = req.params;

    try {
      const stream = await endStream(streamId);

      res.status(200).json({ data: stream, message: "Success" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

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
      await dislikeByUserService(streamId, userId);
      res.status(200).json({ message: "Success" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async likeByUser(req, res) {
    const { streamId, userId } = req.params;
    try {
      await likeByUserService(streamId, userId);
      res.status(200).json({ message: "Success" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getStreamByCategory(req, res) {
    const { category } = req.query;
    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = parseInt(req.query.itemsPerPage) || 10;

    try {
      const result = await getStreamByCategory(category, page, itemsPerPage);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getTop1(req, res) {
    const { type } = req.query;
    let query = type === null ? "like" : type;

    try {
      const result = await getTop1(query);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default StreamController;

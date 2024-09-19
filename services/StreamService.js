const bcrypt = require("bcrypt");
const validator = require("validator");
const mongoose = require("mongoose");
const DatabaseTransaction = require("../repositories/DatabaseTransaction");
const UserRepository = require("../repositories/UserRepository");
const https = require("https");
const { resolve } = require("path");
const { rejects } = require("assert");
const jwt = require("jsonwebtoken");

const getUrlStream = async (email) => {
  try {
    // Lấy URL streaming từ CDN
    const streamingUrl = new URL(
      "https://myVideoStreamCDN.b-cdn.net/videos/playlist.m3u8"
    );
    streamingUrl.searchParams.append("email", email);

    return await requestCdnForStream(streamingUrl.toString());
  } catch (error) {
    throw new Error(error.message);
  }
};

// Hàm xử lý yêu cầu tới CDN
const requestCdnForStream = (url) => {
  return new Promise((resolve, reject) => {
    https
      .get(url, {}, (response) => {
        let data = "";

        response.on("data", (chunk) => {
          data += chunk;
        });

        response.on("end", () => {
          try {
            if (response.statusCode !== 200) {
              return reject(
                new Error(
                  `CDN request failed with status code ${response.statusCode}`
                )
              );
            }

            const jsonData = JSON.parse(data);
            resolve(jsonData.url);
          } catch (error) {
            reject(new Error("Failed to parse response from CDN"));
          }
        });
      })
      .on("error", (err) => {
        reject(new Error(`Request to CDN failed: ${err.message}`));
      });
  });
};

const findStream = async (streamId) => {
  try {
    const connection = new DatabaseTransaction();

    if (!mongoose.Types.ObjectId.isValid(streamId)) {
      return res.status(400).json({ error: "Invalid stream ID" });
    }

    const stream = await connection.streamRepository.getStreamById(streamId);

    return stream;
  } catch (error) {
    throw new Error(error.message);
  }
};

const findAllStreams = async () => {
  try {
    const connection = new DatabaseTransaction();

    const streams = await connection.streamRepository.getAllStreams();

    return streams;
  } catch (error) {
    throw new Error(error.message);
  }
};

const updateStream = async (streamId, updateData) => {
  try {
    const connection = new DatabaseTransaction();

    if (!mongoose.Types.ObjectId.isValid(streamId)) {
      return res.status(400).json({ error: "Invalid stream ID" });
    }

    const stream = await connection.streamRepository.updateStream(
      streamId,
      updateData
    );

    return stream;
  } catch (error) {
    throw new Error(error.message);
  }
};

const deleteStream = async (streamId) => {
  try {
    const connection = new DatabaseTransaction();

    if (!mongoose.Types.ObjectId.isValid(streamId)) {
      return res.status(400).json({ error: "Invalid stream ID" });
    }

    const stream = await connection.streamRepository.deleteStream(streamId);

    return stream;
  } catch (error) {
    throw new Error(error.message);
  }
};

const endStream = async (streamId) => {
  try {
    const connection = new DatabaseTransaction();

    if (!mongoose.Types.ObjectId.isValid(streamId)) {
      return res.status(400).json({ error: "Invalid stream ID" });
    }

    const stream = await connection.streamRepository.endStream(streamId);

    return stream;
  } catch (error) {
    throw new Error(error.message);
  }
};

const dislikeByUserService = async (streamId, userId) => {
  try {
    const connection = new DatabaseTransaction();
    if (!mongoose.Types.ObjectId.isValid(streamId)) {
      return res.status(400).json({ error: "Invalid stream ID" });
    }
    const result = await connection.streamRepository.dislikeByUserRepo(
      streamId,
      userId
    );
    return result;
  } catch (error) {}
};

const likeByUserService = async (streamId, userId) => {
  try {
    const connection = new DatabaseTransaction();
    if (!mongoose.Types.ObjectId.isValid(streamId)) {
      return res.status(400).json({ error: "Invalid stream ID" });
    }
    const result = await connection.streamRepository.likeByUserRepo(
      streamId,
      userId
    );
    return result;
  } catch (error) {}
};

const createAStreamService = async (
  userId,
  title,
  description,
  categories,
  thumbnailUrl
) => {
  try {
    const connection = new DatabaseTransaction();
    const result = await connection.streamRepository.createStream({
      userId,
      title,
      description,
      categories,
      thumbnailUrl,
    });
    return result;
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  findStream,
  findAllStreams,
  endStream,
  updateStream,
  deleteStream,
  getUrlStream,
  requestCdnForStream,
  dislikeByUserService,
  likeByUserService,
  createAStreamService,
};

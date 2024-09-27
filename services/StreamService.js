const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const DatabaseTransaction = require("../repositories/DatabaseTransaction");
const https = require("https");
const typesMapping = require("../middlewares/typesMapping");

const getStreamUrl = async (streamId) => {
  try {
    const connection = new DatabaseTransaction();
    const stream = await connection.streamRepository.getStreamById(streamId);

    return stream.streamUrl;
  } catch (error) {
    throw new Error(error.message);
  }
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

const findAllStreams = async (page, size, query) => {
  try {
    const connection = new DatabaseTransaction();

    const pageSize = size || 10;
    const pageNumber = page || 1;

    const streams = await connection.streamRepository.getAllStreams(
      pageSize,
      pageNumber,
      query
    );

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

    if (!stream) {
      throw new Error("Stream not found");
    }

    const user = await connection.userRepository.findUserById(stream.userId);
    const userFolder = user.email;

    await deleteFromBunnyCDN(userFolder);

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
  categories,
  thumbnailUrl,
  streamUrl
) => {
  try {
    const connection = new DatabaseTransaction();

    const result = await connection.streamRepository.createStream({
      userId,
      title,
      categories,
      thumbnailUrl,
      streamUrl,
    });
    return result;
  } catch (error) {
    throw new Error(error.message);
  }
};

const fs = require("fs");
const path = require("path");
const os = require("os");
const moment = require("moment");
const ffmpeg = require("fluent-ffmpeg");

const outputDir = os.tmpdir();

// Function to upload a file to BunnyCDN
const uploadToBunnyCDN = async (filePath, fileName, userFolder) => {
  const readStream = fs.createReadStream(filePath);
  const storageZone = process.env.BUNNYCDN_STORAGE_ZONE_NAME;

  const options = {
    method: "PUT",
    host: "storage.bunnycdn.com",
    path: `/${storageZone}/video/${userFolder}/${fileName}`,
    headers: {
      AccessKey: process.env.BUNNYCDN_STORAGE_PASSWORD,
      "Content-Type": "application/octet-stream",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate", // Disable caching
      Expires: "0",
      Pragma: "no-cache",
    },
  };

  const req = https.request(options, (res) => {
    res.on("data", (chunk) => {
      console.log(chunk.toString("utf8"));
    });
  });

  req.on("error", (error) => {
    console.error(error);
  });

  readStream.pipe(req);
};

// Function to delete folder from BunnyCDN
const deleteFromBunnyCDN = async (userFolder, fileName) => {
  const storageZone = process.env.BUNNYCDN_STORAGE_ZONE_NAME;

  let path = "";
  if (fileName) {
    path = `/${storageZone}/video/${userFolder}/${fileName}`;
  } else {
    path = `/${storageZone}/video/${userFolder}/`;
  }

  const options = {
    method: "DELETE",
    host: "storage.bunnycdn.com",
    path: path,
    headers: {
      AccessKey: process.env.BUNNYCDN_STORAGE_PASSWORD,
    },
  };
  console.log(options.path);

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseBody = "";
      res.on("data", (chunk) => {
        responseBody += chunk.toString();
      });
      res.on("end", () => {
        if (res.statusCode === 404) {
          resolve("Folder not found");
        } else if (res.statusCode === 200) {
          console.log(`Deleted folder ${userFolder}: ${responseBody}`);
          resolve(responseBody);
        } else {
          reject(
            new Error(
              `Failed to delete folder ${userFolder}: ${res.statusCode}`
            )
          );
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.end();
  });
};

const purgeBunnyCDNCache = async () => {
  const options = {
    method: "POST",
    host: "api.bunny.net",
    path: `/pullzone/${process.env.BUNNYCDN_PULLZONE_ID}/purgeCache`,
    headers: {
      AccessKey: process.env.BUNNYCDN_API_KEY,
    },
  };

  const req = https.request(options, (res) => {
    res.on("data", (chunk) => {
      console.log(chunk.toString("utf8"));
    });
  });

  req.on("error", (error) => {
    console.error(error);
  });

  req.end();
};

// Function to replace .ts file paths in .m3u8 with BunnyCDN URLs
const replaceTsWithCDN = (m3u8FilePath, cdnUrl, mainFileName, userFolder) => {
  let m3u8Content = fs.readFileSync(m3u8FilePath, "utf8");

  const regex = new RegExp(
    `${mainFileName}-${userFolder}-segment-\\d+\\.ts`,
    "g"
  );

  m3u8Content = m3u8Content.replace(regex, (match) => {
    return `${cdnUrl}/${match}`;
  });

  fs.writeFileSync(m3u8FilePath, m3u8Content);
};

// Function to upload .ts segment files
async function uploadTsFiles(mainFileName, userFolder) {
  const files = fs.readdirSync(outputDir);
  for (const file of files) {
    if (
      file.endsWith(".ts") &&
      file.includes(mainFileName) &&
      file.includes(userFolder)
    ) {
      const filePath = path.join(outputDir, file);
      const fileName = path.basename(file);
      await uploadToBunnyCDN(filePath, fileName, userFolder);
    }
  }
}

let inputURL = "rtmp://localhost:1935/live";

// Function to save the stream using FFmpeg
const saveStreamToBunny = async (userFolder) => {
  const mainFileName = "stream-result";
  const outputFilename = `${outputDir}/${mainFileName}.m3u8`;
  const hostName =
    process.env.BUNNYCDN_HOSTNAME || "live-stream-platform.b-cdn.net";
  try {
    const connection = new DatabaseTransaction();
    const email = await connection.userRepository.findUserByEmail(userFolder);
    if (!email) {
      throw new Error("Invalid key");
    }

    const timestamp = Date.now();
    inputStream = `${inputURL}/${userFolder}`;

    ffmpeg(inputStream)
      .inputFormat("flv")
      .outputOptions([
        "-hls_time 15",
        "-hls_list_size 0",
        "-hls_flags append_list",
        "-strftime 1",
        `-hls_segment_filename ${outputDir}/${mainFileName}-${userFolder}-segment-%Y%m%d%H%M%S.ts`,
        "-t 30",
        "-f hls",
      ])
      .output(outputFilename)
      .on("end", async () => {
        replaceTsWithCDN(
          outputFilename,
          `https://${hostName}/video/${userFolder}/`,
          mainFileName,
          userFolder
        );
        // await deleteFromBunnyCDN(
        //   userFolder,
        //   `stream-result-${userFolder}.m3u8`
        // );
        await uploadToBunnyCDN(
          outputFilename,
          `stream-result-${userFolder}.m3u8`,
          userFolder
        );
        await uploadTsFiles(mainFileName, userFolder);
        await purgeBunnyCDNCache();
      })
      .on("error", (err) => {
        console.error("Error:", err);
      })
      .run();
  } catch (error) {
    throw new Error(error.message);
  }
};

const saveStream = async (streamId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(streamId)) {
    return res.status(400).json({ error: "Invalid stream ID" });
  }

  try {
    const connection = new DatabaseTransaction();

    const user = await connection.userRepository.findUserById(userId);

    await saveStreamToBunny(user.email);

    return true;
  } catch (error) {
    throw new Error(error.message);
  }
};

const getStreamByCategory = async (category, page = 1, itemsPerPage = 10) => {
  try {
    const connection = new DatabaseTransaction();
    const { streams, totalStreams } =
      await connection.streamRepository.getStreamsByCategory(
        category,
        page,
        itemsPerPage
      );
    return { streams, totalStreams };
  } catch (error) {
    throw new Error(error.message);
  }
};
const getTop1 = async (type) => {
  console.log("services is called, type: ", type);

  try {
    const connection = new DatabaseTransaction();
    const stream = await connection.streamRepository.CurrentlyTop1(type);
    return stream;
  } catch (error) {
    throw new Error(error.message);
  }
};

const searchStreamsByCategory = async (categoryIndex, title) => {
  const connection = new DatabaseTransaction();
  let names = [];
  if (categoryIndex && categoryIndex.length > 0) {
    names = categoryIndex.map((index) => {
      const category = typesMapping[index]?.name;

      if (!category) {
        throw new Error("Invalid category index");
      }

      return category;
    });
  }
  return await connection.streamRepository.findStreamsByCategory(names, title);
};

module.exports = {
  findStream,
  findAllStreams,
  searchStreamsByCategory,
  endStream,
  updateStream,
  saveStream,
  deleteStream,
  getStreamUrl,
  dislikeByUserService,
  likeByUserService,
  createAStreamService,
  saveStreamToBunny,
  deleteFromBunnyCDN,
  getStreamByCategory,
  getTop1,
  searchStreamsByCategory,
};

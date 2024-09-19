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

const deleteFromBunnyCDN = async (userFolder, fileName) => {
  const storageZone = process.env.BUNNYCDN_STORAGE_ZONE_NAME;

  const options = {
    method: "DELETE",
    host: "storage.bunnycdn.com",
    path: `/${storageZone}/video/${userFolder}/${fileName}`,
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
  m3u8Content = m3u8Content.replace(
    new RegExp(`${mainFileName}-${userFolder}-segment-\\d{3}\\.ts`, "g"),
    (match) => {
      return `${cdnUrl}${match}`;
    }
  );
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

    inputStream = `${inputURL}/${userFolder}`;

    ffmpeg(inputStream)
      .inputFormat("flv")
      .outputOptions([
        "-hls_time 15",
        "-hls_list_size 0",
        "-hls_flags delete_segments",
        `-hls_segment_filename ${outputDir}/${mainFileName}-${userFolder}-segment-%03d.ts`,
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
        await deleteFromBunnyCDN(
          userFolder,
          `stream-result-${userFolder}.m3u8`
        );
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

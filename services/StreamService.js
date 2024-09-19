const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const validator = require("validator");
const DatabaseTransaction = require('../repositories/DatabaseTransaction');
const UserRepository = require("../repositories/UserRepository");
const https = require("https");
const { resolve } = require("path");
const { rejects } = require("assert");
const jwt = require("jsonwebtoken");

const getStreamsByCategory = async (token) => {
    try {
        const connection = new DatabaseTransaction();

        const streams = await connection.streamRepository.findStreamsByToken(token);

        // Lấy ra danh sách các danh mục duy nhất
        const categories = [...new Set(streams.map(stream => stream.categories).flat())];

        // Gom nhóm stream theo từng danh mục
        const categorizedStreams = categories.reduce((acc, category) => {
            acc[category] = streams.filter(stream => stream.categories.includes(category));
            return acc;
        }, {});

        return categorizedStreams;
    } catch (error) {
        console.error('Error in getStreamsByCategory:', error.message);
        throw new Error(`Error getting streams by category: ${error.message}`);
    }
};

// Sign up a new user
const likeStreamService = async (streamId, action, email) => {
    try {
        const connection = new DatabaseTransaction();

        const stream = await Stream.findById(streamId);

        if (!stream) {
            throw new Error("Cannot find stream");
        }

        if (!validator.isEmail(email)) {
            throw new Error('Invalid email address');
        }

        const streamIndex = stream.likedBy.indexOf(email);
        const isLiking = action === "like";

        if (isLiking && streamIndex === -1) {
            stream.likedBy.push(email);
            stream.like += 1;
        } else if (!isLiking && streamIndex !== -1) {
            stream.likedBy.splice(streamIndex, 1);
            stream.like = Math.max(stream.like - 1, 0);
        } else if (action !== "like" && action !== "dislike") {
            throw new Error("Invalid action");
        }

        await stream.save();

        const updatedStream = await connection.streamRepository.likeStreamRepo(stream);

        return updatedStream;
    } catch (error) {
        throw new Error(error.message);
    }
}

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
            return res.status(400).json({ error: 'Invalid stream ID' });
        }

        if (!stream) {
            throw new Error('Stream not found');
        }

        const user = await connection.userRepository.findUserById(stream.userId);
        const userFolder = user.email; // Assuming the folder is named by the user's email

        await deleteFromBunnyCDN(userFolder);

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

const fs = require('fs');
const path = require('path');
const os = require('os');
const moment = require('moment');
const ffmpeg = require('fluent-ffmpeg');
const https = require('https');

const outputDir = os.tmpdir();

// Function to upload a file to BunnyCDN
const uploadToBunnyCDN = async (filePath, fileName, userFolder) => {
    const readStream = fs.createReadStream(filePath);
    const storageZone = process.env.BUNNYCDN_STORAGE_ZONE_NAME;

    const options = {
        method: 'PUT',
        host: 'storage.bunnycdn.com',
        path: `/${storageZone}/video/${userFolder}/${fileName}`,
        headers: {
            AccessKey: process.env.BUNNYCDN_STORAGE_PASSWORD,
            'Content-Type': 'application/octet-stream',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate', // Disable caching
            'Expires': '0',
            'Pragma': 'no-cache',
        },
    };

    const req = https.request(options, (res) => {
        res.on('data', (chunk) => {
            console.log(chunk.toString('utf8'));
        });
    });

    req.on('error', (error) => {
        console.error(error);
    });

    readStream.pipe(req);
};

// Function to delete folder from BunnyCDN
const deleteFromBunnyCDN = async (userFolder, fileName) => {
    const storageZone = process.env.BUNNYCDN_STORAGE_ZONE_NAME;

    const options = {
        method: 'DELETE',
        host: 'storage.bunnycdn.com',
        path: `/${storageZone}/video/${userFolder}/${fileName}`,
        headers: {
            AccessKey: process.env.BUNNYCDN_STORAGE_PASSWORD,
        },
    };
    console.log(options.path)

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let responseBody = '';
            res.on('data', (chunk) => {
                responseBody += chunk.toString();
            });
            res.on('end', () => {
                if (res.statusCode === 404) {
                    resolve('Folder not found');
                } else if (res.statusCode === 200) {
                    console.log(`Deleted folder ${userFolder}: ${responseBody}`);
                    resolve(responseBody);
                } else {
                    reject(new Error(`Failed to delete folder ${userFolder}: ${res.statusCode}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.end();
    });
};

const purgeBunnyCDNCache = async () => {
    const options = {
        method: 'POST',
        host: 'api.bunny.net',
        path: `/pullzone/${process.env.BUNNYCDN_PULLZONE_ID}/purgeCache`,
        headers: {
            AccessKey: process.env.BUNNYCDN_API_KEY,
        },
    };

    const req = https.request(options, (res) => {
        res.on('data', (chunk) => {
            console.log(chunk.toString('utf8'));
        });
    });

    req.on('error', (error) => {
        console.error(error);
    });

    req.end();
};

// Function to replace .ts file paths in .m3u8 with BunnyCDN URLs
const replaceTsWithCDN = (m3u8FilePath, cdnUrl, mainFileName, userFolder) => {
    let m3u8Content = fs.readFileSync(m3u8FilePath, 'utf8');
    m3u8Content = m3u8Content.replace(new RegExp(`${mainFileName}-${userFolder}-segment-\\d{3}\\.ts`, 'g'), (match) => {
        return `${cdnUrl}${match}`;
    });
    fs.writeFileSync(m3u8FilePath, m3u8Content);
};

// Function to upload .ts segment files
async function uploadTsFiles(mainFileName, userFolder) {
    const files = fs.readdirSync(outputDir);
    for (const file of files) {
        if (file.endsWith('.ts') && file.includes(mainFileName) && file.includes(userFolder)) {
            const filePath = path.join(outputDir, file);
            const fileName = path.basename(file);
            await uploadToBunnyCDN(filePath, fileName, userFolder);
        }
    }
}

let inputURL = 'rtmp://localhost:1935/live';

// Function to save the stream using FFmpeg
const saveStreamToBunny = async (userFolder) => {
    const mainFileName = "stream-result";
    const outputFilename = `${outputDir}/${mainFileName}.m3u8`;
    const hostName = process.env.BUNNYCDN_HOSTNAME || "live-stream-platform.b-cdn.net";
    try {
        const connection = new DatabaseTransaction();
        const email = await connection.userRepository.findUserByEmail(userFolder);
        if (!email) {
            throw new Error("Invalid key")
        }
        
        inputStream = `${inputURL}/${userFolder}`;

        ffmpeg(inputStream)
            .inputFormat('flv')
            .outputOptions([
                '-hls_time 15',
                '-hls_list_size 0',
                '-hls_flags delete_segments',
                `-hls_segment_filename ${outputDir}/${mainFileName}-${userFolder}-segment-%03d.ts`,
                '-t 30',
                '-f hls',
            ])
            .output(outputFilename)
            .on('end', async () => {
                replaceTsWithCDN(outputFilename, `https://${hostName}/video/${userFolder}/`, mainFileName, userFolder);
                await deleteFromBunnyCDN(userFolder, `stream-result-${userFolder}.m3u8`);
                await uploadToBunnyCDN(outputFilename, `stream-result-${userFolder}.m3u8`, userFolder);
                await uploadTsFiles(mainFileName, userFolder);
                await purgeBunnyCDNCache();
            })
            .on('error', (err) => {
                console.error('Error:', err);
            })
            .run();
    } catch (error) {
        throw new Error(error.message)
    }
}

const startStream = async (data) => {
    try {
        const connection = new DatabaseTransaction();

        if (!data.title || typeof data.title !== 'string' || data.title.length < 1 || data.title.length > 100) {
            throw new Error('Title must be between 1 and 100 characters.');
        }

        if (!data.userId || !mongoose.Types.ObjectId.isValid(data.userId)) {
            throw new Error('Valid userId is required.');
        }

        if (!Array.isArray(data.categories) || !data.categories.every(cat => typeof cat === 'string')) {
            throw new Error('Categories must be an array of strings.');
        }

        const stream = await connection.streamRepository.createStream(data);

        const user = await connection.userRepository.findUserById(data.userId);

        returnData = { stream, streamRTMP: inputURL, email: user.email };
        return returnData;
    } catch (error) {
        throw new Error(error.message);
    }
};

const saveStream = async (streamId, userId) => {
    if (!mongoose.Types.ObjectId.isValid(streamId)) {
        return res.status(400).json({ error: 'Invalid stream ID' });
    }

    try {
        const connection = new DatabaseTransaction();

        const user = await connection.userRepository.findUserById(userId)

        await saveStreamToBunny(user.email);

        return true;
    } catch (error) {
        throw new Error(error.message)
    }
};

module.exports = {
    findStream,
    findAllStreams,
    endStream,
    updateStream,
    saveStream,
    deleteStream,
    getStreamUrl,
    dislikeByUserService,
    likeByUserService,
    createAStreamService,
};

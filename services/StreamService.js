const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const DatabaseTransaction = require('../repositories/DatabaseTransaction');

const getStreamUrl = async (streamId) => {
    try {
        const connection = new DatabaseTransaction();
        const stream = await connection.streamRepository.getStreamById(streamId);

        return stream._id;
    } catch (error) {
        throw new Error(error.message);
    }
};


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

const fs = require('fs');
const path = require('path');
const os = require('os');
const moment = require('moment');
const ffmpeg = require('fluent-ffmpeg');
const https = require('https');

// Node Media Server configuration (if needed)
const NodeMediaServer = require('node-media-server');

// Define the RTMP URL and output directory
const inputURL = 'rtmp://localhost:1935/live/supersecret';
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
const deleteFromBunnyCDN = async (userFolder) => {
    const storageZone = process.env.BUNNYCDN_STORAGE_ZONE_NAME;

    const options = {
        method: 'DELETE',
        host: 'storage.bunnycdn.com',
        path: `/${storageZone}/${userFolder}`,
        headers: {
            AccessKey: process.env.BUNNYCDN_STORAGE_PASSWORD,
        },
    };

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
async function uploadTsFiles(mainFileName) {
    const files = fs.readdirSync(outputDir);
    for (const file of files) {
        if (file.endsWith('.ts') && file.includes(mainFileName)) {
            const filePath = path.join(outputDir, file);
            const fileName = path.basename(file);
            await uploadToBunnyCDN(filePath, fileName);
        }
    }
}

// Function to save the stream using FFmpeg
const saveStreamToBunny = async (userFolder) => {
    const epochTime = moment().format('HH_mm_ss');
    const mainFileName = "stream-result";
    const outputFilename = `${outputDir}/${mainFileName}.m3u8`;
    const hostName = process.env.BUNNYCDN_HOSTNAME || "live-stream-platform.b-cdn.net";
    try {

        ffmpeg(inputURL)
            .inputFormat('flv')
            .outputOptions([
                '-hls_time 15',
                '-hls_list_size 5',
                '-hls_flags delete_segments',
                `-hls_segment_filename ${outputDir}/${mainFileName}-${userFolder}-segment-%03d.ts`,
                '-t 30',
                '-f hls',
            ])
            .output(outputFilename)
            .on('end', async () => {
                replaceTsWithCDN(outputFilename, `https://${hostName}/video/${userFolder}/`, mainFileName, userFolder);
                await deleteFromBunnyCDN(userFolder);
                await uploadToBunnyCDN(outputFilename, `${userFolder}-stream-result.m3u8`, userFolder);
                await uploadTsFiles(mainFileName);
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

// Consolidated function for starting the stream and managing all stream-related tasks
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

        const user = await connection.userRepository.getUserById(data.userId)

        // Call saveStream for HLS processing and BunnyCDN management
        saveStreamToBunny(user.email);

        return stream;
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

        const user = await connection.userRepository.getUserById(userId)

        saveStreamToBunny(user.email);

        return true;
    } catch (error) {
        throw new Error(error.message)
    }
};

module.exports = {
    findStream,
    findAllStreams,
    startStream,
    endStream,
    updateStream,
    deleteStream,
    saveStream,
    getStreamUrl,
};

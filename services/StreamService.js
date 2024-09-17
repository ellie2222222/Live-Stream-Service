const bcrypt = require('bcrypt');
const validator = require('validator');
const mongoose = require('mongoose');
const DatabaseTransaction = require('../repositories/DatabaseTransaction');
const UserRepository = require('../repositories/UserRepository');
const StreamRepository = require('../repositories/StreamRepository');
const https = require('https');
const jwt = require("jsonwebtoken");
const { Stream } = require('stream');

const getUrlStream = async (email) => {
    try {
        const connection = new DatabaseTransaction();

        if (!validator.isEmail(email)) {
            throw new Error('Invalid email address');
        }

        const existingUser = await connection.userRepository.findUserByEmail(email);
        if (!existingUser) {
            throw new Error('Please login to watch live stream');
        }

        // Lấy URL streaming từ CDN (không thêm email vào URL nữa)
        const streamingUrl = 'https://myVideoStreamCDN.b-cdn.net/videos/playlist.m3u8';

        return await requestCdnForStream(streamingUrl, email);
    } catch (error) {
        throw new Error(error.message);
    }
};

// Hàm xử lý yêu cầu tới CDN với email truyền qua header
const requestCdnForStream = (url, email) => {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'X-User-Email': email // Truyền email qua header
            }
        };

        https.get(url, options, (response) => {
            let data = '';

            response.on('data', (chunk) => {
                data += chunk;
            });

            response.on('end', () => {
                try {
                    if (response.statusCode !== 200) {
                        return reject(new Error(`CDN request failed with status code ${response.statusCode}`));
                    }

                    const jsonData = JSON.parse(data);
                    resolve(jsonData.url);
                } catch (error) {
                    reject(new Error('Failed to parse response from CDN'));
                }
            });
        }).on('error', (err) => {
            reject(new Error(`Request to CDN failed: ${err.message}`));
        });
    });
};


// Sign up a new user
const likeStreamService = async (streamId, action, email) => {
    try {
        const connection = new DatabaseTransaction();

        const stream = await Stream.findById(streamId);

        if (!stream) {
            throw new Error("Không tìm thấy bài hát");
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
        } else if (action !== "like" && action !== "unlike") {
            throw new Error("Hành động không hợp lệ");
        }

        await stream.save();

        const updatedStream = await connection.streamRepository.likeStreamRepo(stream);

        return updatedStream;
    } catch (error) {
        throw new Error(error.message);
    }
}

module.exports = {
    getUrlStream,
    likeStreamService,
};
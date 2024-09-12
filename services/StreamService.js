const bcrypt = require('bcrypt');
const validator = require('validator');
const mongoose = require('mongoose');
const DatabaseTransaction = require('../repositories/DatabaseTransaction');
const UserRepository = require('../repositories/UserRepository');
const https = require('https');
const { resolve } = require('path');
const { rejects } = require('assert');
const jwt = require("jsonwebtoken");

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

        // Lấy URL streaming từ CDN
        const streamingUrl = new URL('https://myVideoStreamCDN.b-cdn.net/videos/playlist.m3u8');
        streamingUrl.searchParams.append('email', email);

        return await requestCdnForStream(streamingUrl.toString());
    } catch (error) {
        throw new Error(error.message);
    }
};

// Hàm xử lý yêu cầu tới CDN
const requestCdnForStream = (url) => {
    return new Promise((resolve, reject) => {
        https.get(url, {
        }, (response) => {
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
const createStream = async (username, email, password) => {
    try {
        const connection = new DatabaseTransaction();

        if (!validator.isEmail(email)) {
            throw new Error('Invalid email address');
        }

        if (!validator.isStrongPassword(password, {
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1
        })) {
            throw new Error('Password is not strong enough');
        }

        const existingUser = await connection.userRepository.findUserByEmail(email);
        if (existingUser) {
            throw new Error('Email is already in use');
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await connection.userRepository.createUser({
            username,
            email,
            password: hashedPassword
        });

        return user;
    } catch (error) {
        throw new Error(error.message);
    }
}

module.exports = {
    getUrlStream,
    createStream,
};
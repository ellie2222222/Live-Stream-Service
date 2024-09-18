const bcrypt = require('bcrypt');
const validator = require('validator');
const mongoose = require('mongoose');
const DatabaseTransaction = require('../repositories/DatabaseTransaction');
const jwt = require("jsonwebtoken");
const { Stream } = require('stream');

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
    getStreamsByCategory,
    likeStreamService,
};
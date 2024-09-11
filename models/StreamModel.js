const mongoose = require('mongoose')

const Schema = mongoose.Schema

const streamSchema = new Schema( {
    title: {
        type: String,
        required: true,
        default: '',
    },
    thumbnailUrl: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    bio: {
        type: String,
        default: '',
    },
    avatarUrl: {
        type: String,
        default: '',
    },
    isDelete: {
        type: Boolean,
        required: true,
        default: false,
    }
}, {timestamps: true})

module.exports = mongoose.model('Stream', streamSchema);
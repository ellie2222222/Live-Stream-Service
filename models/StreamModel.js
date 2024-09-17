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
    isDelete: {
        type: Boolean,
        required: true,
        default: false,
    },
    like: {
        type: Number,
        default: 0,
    },
    likedBy: [
      {
        type: String,
      },
    ],
}, {timestamps: true})

module.exports = mongoose.model('Stream', streamSchema);
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
    isDeleted: {
        type: Boolean,
        required: true,
        default: false,
    },
    currentViewCount: {
        type: Number,
        default: 0,
    },
    likes: [
      {
        type: String,
      },
    ],
    categories: [
      {
      type: String,
      required: true,
      },
    ],
}, {timestamps: true})

module.exports = mongoose.model('Stream', streamSchema);
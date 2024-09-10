const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const validator = require('validator')

const Schema = mongoose.Schema

const userSchema = new Schema( {
    username: {
        type: String,
        required: true,
        default: '',
    },
    email: {
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
    isActive: {
        type: Boolean,
        required: true,
        default: true,
    }
}, {timestamps: true})

module.exports = mongoose.model('User', userSchema);
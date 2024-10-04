import mongoose from 'mongoose';

const Schema = mongoose.Schema

const messageSchema = new Schema( {
    content: {
        type: String,
        required: [true, 'Message content is required'],
        minlength: [1, 'Message must be at least 1 character long'],
        maxlength: [500, 'Message cannot exceed 500 characters'],
        default: '',
    },
    streamId: {
        type: mongoose.Types.ObjectId,
        ref: 'Stream',
        required: true,
    },
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    isDeleted: {
        type: Boolean,
        required: true,
        default: false,
    }
}, {timestamps: true})

export default mongoose.model('Message', messageSchema);
const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const streamSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      minlength: [1, "Title must be at least 1 character long"],
      maxlength: [100, "Title cannot exceed 100 characters"],
      default: "",
    },
    thumbnailUrl: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    endedAt: {
      type: Date,
      default: null,
    },
    currentViewCount: {
        type: Number,
        default: 0,
    },
    isDeleted: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  { timestamps: true }
);
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

module.exports = mongoose.model("Stream", streamSchema);

import mongoose from "mongoose";

const playlistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: String,
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        asset: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Asset",
          required: true,
        },
        order: {
          type: Number,
          required: true,
        },
        duration: {
          type: Number,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Playlist ||
  mongoose.model("Playlist", playlistSchema);

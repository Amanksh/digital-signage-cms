import mongoose from "mongoose";

const assetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["IMAGE", "VIDEO", "HTML", "URL"],
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    thumbnail: String,
    duration: Number,
    size: {
      type: Number,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Asset || mongoose.model("Asset", assetSchema);

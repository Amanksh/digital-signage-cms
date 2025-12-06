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
    // campaignId is optional - null means it's a direct/standalone asset
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
assetSchema.index({ campaignId: 1 });
assetSchema.index({ userId: 1 });
// Index for finding direct assets (where campaignId is null)
assetSchema.index({ userId: 1, campaignId: 1 });

export default mongoose.models.Asset || mongoose.model("Asset", assetSchema);

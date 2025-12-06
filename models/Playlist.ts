import mongoose, { Schema, Document } from "mongoose";

export interface IPlaylist extends Document {
  name: string;
  description: string;
  userId: string;
  status: "active" | "inactive" | "scheduled";
  // Campaign-based structure
  campaignIds: mongoose.Types.ObjectId[];
  // Direct assets (standalone assets not in campaigns)
  assetIds: mongoose.Types.ObjectId[];
  // Legacy support for old asset-based structure (deprecated)
  items?: {
    assetId: mongoose.Types.ObjectId;
    duration: number;
    order: number;
  }[];
  schedule?: {
    startDate: Date;
    endDate: Date;
    daysOfWeek: number[];
    startTime: string;
    endTime: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const PlaylistSchema = new Schema<IPlaylist>(
  {
    name: { type: String, required: true },
    description: { type: String },
    userId: { type: String, required: true },
    status: {
      type: String,
      enum: ["active", "inactive", "scheduled"],
      default: "inactive",
    },
    // Campaign-based structure
    campaignIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Campaign",
      },
    ],
    // Direct assets (standalone assets not in campaigns)
    assetIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Asset",
      },
    ],
    // Legacy support for old asset-based structure (deprecated)
    items: [
      {
        assetId: {
          type: Schema.Types.ObjectId,
          ref: "Asset",
          validate: {
            validator: function (v: any) {
              return mongoose.Types.ObjectId.isValid(v);
            },
            message: (props) => `${props.value} is not a valid ObjectId!`,
          },
        },
        duration: { type: Number },
        order: { type: Number },
      },
    ],
    schedule: {
      startDate: Date,
      endDate: Date,
      daysOfWeek: [Number],
      startTime: String,
      endTime: String,
    },
  },
  { timestamps: true }
);

// Validation: max 7 campaigns per playlist
PlaylistSchema.pre("save", function (next) {
  if (this.campaignIds && this.campaignIds.length > 7) {
    const error = new Error("Maximum 7 campaigns allowed per playlist");
    return next(error);
  }
  next();
});

export default mongoose.models.Playlist ||
  mongoose.model<IPlaylist>("Playlist", PlaylistSchema);

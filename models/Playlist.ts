import mongoose, { Schema, Document } from "mongoose";

export interface IPlaylist extends Document {
  name: string;
  description: string;
  userId: string;
  status: "active" | "inactive" | "scheduled";
  items: {
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
    items: [
      {
        assetId: {
          type: Schema.Types.ObjectId,
          ref: "Asset",
          required: true,
          validate: {
            validator: function (v: any) {
              return mongoose.Types.ObjectId.isValid(v);
            },
            message: (props) => `${props.value} is not a valid ObjectId!`,
          },
        },
        duration: { type: Number, required: true },
        order: { type: Number, required: true },
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

export default mongoose.models.Playlist ||
  mongoose.model<IPlaylist>("Playlist", PlaylistSchema);

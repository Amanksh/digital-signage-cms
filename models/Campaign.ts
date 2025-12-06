import mongoose, { Schema, Document } from "mongoose";

export interface ICampaign extends Document {
  name: string;
  description?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema = new Schema<ICampaign>(
  {
    name: { 
      type: String, 
      required: true,
    },
    description: { 
      type: String 
    },
    userId: { 
      type: String, 
      required: true 
    },
  },
  { timestamps: true }
);

// Compound unique index for name per user
CampaignSchema.index({ name: 1, userId: 1 }, { unique: true });

export default mongoose.models.Campaign ||
  mongoose.model<ICampaign>("Campaign", CampaignSchema);


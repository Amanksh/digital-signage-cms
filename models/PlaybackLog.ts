import mongoose from "mongoose";

const PlaybackLogSchema = new mongoose.Schema({
  device_id: {
    type: String,
    required: true,
    index: true,
  },
  asset_id: {
    type: String,
    required: true,
    index: true,
  },
  playlist_id: {
    type: String,
    required: false,  // Optional - matches backend
    index: true,
    default: null,
  },
  start_time: {
    type: Date,
    required: true,
    index: true,
  },
  end_time: {
    type: Date,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
    min: 0,
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
  collection: 'playback_logs',  // Must match backend collection name
});

// Compound indexes for better query performance
PlaybackLogSchema.index({ device_id: 1, start_time: -1 });
PlaybackLogSchema.index({ asset_id: 1, start_time: -1 });
PlaybackLogSchema.index({ playlist_id: 1, start_time: -1 });
PlaybackLogSchema.index({ start_time: -1, end_time: -1 });

// Basic validation - allow logs to be saved without strict checks
// The backend already validates the data
PlaybackLogSchema.pre('save', function(next) {
  // Only validate that end_time is after start_time if both are present
  if (this.end_time && this.start_time && this.end_time <= this.start_time) {
    return next(new Error('end_time must be after start_time'));
  }
  next();
});

const PlaybackLog = mongoose.models.PlaybackLog || mongoose.model("PlaybackLog", PlaybackLogSchema);

export default PlaybackLog;

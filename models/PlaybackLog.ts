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
    required: true,
    index: true,
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
});

// Compound indexes for better query performance
PlaybackLogSchema.index({ device_id: 1, start_time: -1 });
PlaybackLogSchema.index({ asset_id: 1, start_time: -1 });
PlaybackLogSchema.index({ playlist_id: 1, start_time: -1 });
PlaybackLogSchema.index({ start_time: -1, end_time: -1 });

// Virtual for calculating duration validation
PlaybackLogSchema.pre('save', function(next) {
  // Validate that end_time is after start_time
  if (this.end_time <= this.start_time) {
    return next(new Error('end_time must be after start_time'));
  }
  
  // Validate that duration matches the time difference (within 1 second tolerance)
  const calculatedDuration = Math.floor((this.end_time.getTime() - this.start_time.getTime()) / 1000);
  const tolerance = 1; // 1 second tolerance
  
  if (Math.abs(this.duration - calculatedDuration) > tolerance) {
    return next(new Error('duration does not match start_time and end_time difference'));
  }
  
  next();
});

const PlaybackLog = mongoose.models.PlaybackLog || mongoose.model("PlaybackLog", PlaybackLogSchema);

export default PlaybackLog;

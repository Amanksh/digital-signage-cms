import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import PlaybackLog from "@/models/PlaybackLog";

// Standard field names used internally
interface PlaybackLogData {
  device_id: string;
  asset_id: string;
  playlist_id: string;
  start_time: string;
  end_time: string;
  duration: number;
}

// Android player may send different field names
interface AndroidPlaybackLog {
  device_id?: string;
  deviceId?: string;
  asset_id?: string;
  assetId?: string;
  playlist_id?: string;
  playlistId?: string;
  start_time?: string;
  played_at?: string;
  startTime?: string;
  end_time?: string;
  ended_at?: string;
  endTime?: string;
  duration?: number;
}

/**
 * Maps Android/alternative field names to standard field names
 */
function normalizeLogFields(log: AndroidPlaybackLog): PlaybackLogData {
  return {
    device_id: log.device_id || log.deviceId || '',
    asset_id: log.asset_id || log.assetId || '',
    playlist_id: log.playlist_id || log.playlistId || '',
    start_time: log.start_time || log.played_at || log.startTime || '',
    end_time: log.end_time || log.ended_at || log.endTime || '',
    duration: log.duration ?? -1,
  };
}

/**
 * Validates API key authentication for backend-to-backend communication
 */
function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get("X-API-Key") || request.headers.get("x-api-key");
  const validApiKey = process.env.PLAYBACK_API_KEY;
  
  if (!validApiKey) {
    console.warn("[PLAYBACK_LOG] PLAYBACK_API_KEY not configured");
    return false;
  }
  
  return apiKey === validApiKey;
}

/**
 * POST /api/playback/log
 * 
 * Receives playback logs from Android players (via backend) and stores them in the database.
 * Supports both single log objects and arrays of log objects for bulk insert.
 * 
 * Authentication:
 * - Option 1: Session auth (for web dashboard)
 * - Option 2: API Key via X-API-Key header (for backend integration)
 * 
 * Request Body:
 * - Single object: { device_id, asset_id, playlist_id, start_time, end_time, duration }
 * - Array of objects: [{ device_id, asset_id, playlist_id, start_time, end_time, duration }, ...]
 * 
 * Response:
 * - Success: { success: true, inserted: number, message: string }
 * - Error: { error: string, details?: any }
 */
export async function POST(request: NextRequest) {
  try {
    // Connect to database
    await connectDB();

    // Authentication check - support both session and API key
    const session = await getServerSession(authOptions);
    const hasValidApiKey = validateApiKey(request);
    
    if (!session?.user?.id && !hasValidApiKey) {
      return NextResponse.json(
        { error: "Unauthorized. Provide valid session or X-API-Key header." }, 
        { status: 401 }
      );
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    // Normalize input to array and map field names
    const rawLogs: AndroidPlaybackLog[] = Array.isArray(body) ? body : [body];
    const logs: PlaybackLogData[] = rawLogs.map(normalizeLogFields);

    if (logs.length === 0) {
      return NextResponse.json(
        { error: "No log data provided" },
        { status: 400 }
      );
    }

    // Validate each log entry
    const validatedLogs = [];
    const errors = [];

    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];
      const logErrors = [];

      // Required field validation
      if (!log.device_id || typeof log.device_id !== 'string') {
        logErrors.push('device_id is required and must be a string');
      }
      if (!log.asset_id || typeof log.asset_id !== 'string') {
        logErrors.push('asset_id is required and must be a string');
      }
      if (!log.playlist_id || typeof log.playlist_id !== 'string') {
        logErrors.push('playlist_id is required and must be a string');
      }
      if (!log.start_time || typeof log.start_time !== 'string') {
        logErrors.push('start_time is required and must be a string');
      }
      if (!log.end_time || typeof log.end_time !== 'string') {
        logErrors.push('end_time is required and must be a string');
      }
      // Date validation (do this first to calculate duration if needed)
      let startTime, endTime;
      if (log.start_time) {
        startTime = new Date(log.start_time);
        if (isNaN(startTime.getTime())) {
          logErrors.push('start_time must be a valid ISO date string');
        }
      }
      if (log.end_time) {
        endTime = new Date(log.end_time);
        if (isNaN(endTime.getTime())) {
          logErrors.push('end_time must be a valid ISO date string');
        }
      }

      // Time logic validation
      if (startTime && endTime && endTime <= startTime) {
        logErrors.push('end_time must be after start_time');
      }

      // Duration handling - auto-calculate if not provided or invalid
      let finalDuration = log.duration;
      if (startTime && endTime) {
        const calculatedDuration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
        
        if (typeof finalDuration !== 'number' || finalDuration < 0) {
          // Auto-calculate duration if not provided
          finalDuration = calculatedDuration;
        } else {
          // Validate provided duration (allow 2 second tolerance)
          const tolerance = 2;
          if (Math.abs(finalDuration - calculatedDuration) > tolerance) {
            // Use calculated duration instead of failing
            console.warn(`[PLAYBACK_LOG] Duration mismatch: provided ${finalDuration}, calculated ${calculatedDuration}. Using calculated.`);
            finalDuration = calculatedDuration;
          }
        }
      } else if (typeof finalDuration !== 'number' || finalDuration < 0) {
        logErrors.push('duration is required when start_time/end_time are invalid');
      }
      
      // Store the final duration back
      log.duration = finalDuration;

      if (logErrors.length > 0) {
        errors.push({
          index: i,
          errors: logErrors
        });
      } else {
        validatedLogs.push({
          device_id: log.device_id.trim(),
          asset_id: log.asset_id.trim(),
          playlist_id: log.playlist_id.trim(),
          start_time: startTime,
          end_time: endTime,
          duration: log.duration,
        });
      }
    }

    // If there are validation errors, return them
    if (errors.length > 0) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: errors,
          message: `${errors.length} out of ${logs.length} log entries failed validation`
        },
        { status: 400 }
      );
    }

    // Bulk insert validated logs
    let insertedCount = 0;
    if (validatedLogs.length > 0) {
      try {
        const result = await PlaybackLog.insertMany(validatedLogs, {
          ordered: false, // Continue inserting even if some fail
        });
        insertedCount = result.length;
      } catch (error: any) {
        console.error("[PLAYBACK_LOG_INSERT_ERROR]", error);
        
        // Handle duplicate key or other MongoDB errors
        if (error.writeErrors) {
          const successfulInserts = validatedLogs.length - error.writeErrors.length;
          return NextResponse.json(
            {
              success: true,
              inserted: successfulInserts,
              errors: error.writeErrors.length,
              message: `Partially successful: ${successfulInserts} inserted, ${error.writeErrors.length} failed`
            },
            { status: 207 } // Multi-status
          );
        }
        
        return NextResponse.json(
          { error: "Database insertion failed", details: error.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      inserted: insertedCount,
      message: `Successfully inserted ${insertedCount} playback log${insertedCount !== 1 ? 's' : ''}`
    });

  } catch (error: any) {
    console.error("[PLAYBACK_LOG_POST_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import PlaybackLog from "@/models/PlaybackLog";

interface PlaybackLogData {
  device_id: string;
  asset_id: string;
  playlist_id: string;
  start_time: string;
  end_time: string;
  duration: number;
}

/**
 * POST /api/playback/log
 * 
 * Receives playback logs from Android players and stores them in the database.
 * Supports both single log objects and arrays of log objects for bulk insert.
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

    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    // Normalize input to array
    const logs: PlaybackLogData[] = Array.isArray(body) ? body : [body];

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
      if (typeof log.duration !== 'number' || log.duration < 0) {
        logErrors.push('duration is required and must be a non-negative number');
      }

      // Date validation
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

      // Duration validation (allow 1 second tolerance)
      if (startTime && endTime && typeof log.duration === 'number') {
        const calculatedDuration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
        const tolerance = 1;
        if (Math.abs(log.duration - calculatedDuration) > tolerance) {
          logErrors.push(`duration (${log.duration}) does not match calculated duration (${calculatedDuration})`);
        }
      }

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

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import PlaybackLog from "@/models/PlaybackLog";

/**
 * POST /api/playback/test
 * 
 * Creates sample playback log entries for testing.
 * Requires session authentication.
 * 
 * Query params:
 * - count: number of test entries to create (default: 5, max: 20)
 * 
 * Response:
 * - Success: { success: true, inserted: number, logs: array }
 */
export async function POST(request: NextRequest) {
  try {
    // Connect to database
    await connectDB();

    // Authentication check - only allow logged-in users
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get count from query params
    const { searchParams } = new URL(request.url);
    const count = Math.min(20, Math.max(1, parseInt(searchParams.get('count') || '5')));

    // Sample data arrays
    const deviceIds = [
      "lobby-display-001",
      "conference-room-a",
      "reception-screen",
      "cafeteria-tv-01",
      "elevator-display"
    ];

    const assetIds = [
      "welcome-video.mp4",
      "company-promo.mp4",
      "product-showcase.mp4",
      "announcement-banner.jpg",
      "safety-guidelines.mp4",
      "holiday-message.mp4"
    ];

    const playlistIds = [
      "morning-playlist",
      "afternoon-content",
      "corporate-announcements",
      "lobby-rotation",
      "break-room-mix"
    ];

    // Generate test logs
    const testLogs = [];
    const now = Date.now();

    for (let i = 0; i < count; i++) {
      const durationSeconds = Math.floor(Math.random() * 60) + 10; // 10-70 seconds
      const startOffset = Math.floor(Math.random() * 86400000); // Random time within last 24 hours
      const startTime = new Date(now - startOffset);
      const endTime = new Date(startTime.getTime() + durationSeconds * 1000);

      testLogs.push({
        device_id: deviceIds[Math.floor(Math.random() * deviceIds.length)],
        asset_id: assetIds[Math.floor(Math.random() * assetIds.length)],
        playlist_id: playlistIds[Math.floor(Math.random() * playlistIds.length)],
        start_time: startTime,
        end_time: endTime,
        duration: durationSeconds,
      });
    }

    // Insert test logs
    const result = await PlaybackLog.insertMany(testLogs);

    return NextResponse.json({
      success: true,
      inserted: result.length,
      message: `Created ${result.length} test playback logs`,
      logs: result.map(log => ({
        id: log._id,
        device_id: log.device_id,
        asset_id: log.asset_id,
        playlist_id: log.playlist_id,
        start_time: log.start_time,
        end_time: log.end_time,
        duration: log.duration,
      }))
    });

  } catch (error: any) {
    console.error("[PLAYBACK_TEST_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to create test logs", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/playback/test
 * 
 * Returns recent playback logs for verification.
 */
export async function GET(request: NextRequest) {
  try {
    // Connect to database
    await connectDB();

    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get recent logs
    const logs = await PlaybackLog.find()
      .sort({ created_at: -1 })
      .limit(20)
      .lean();

    const totalCount = await PlaybackLog.countDocuments();

    return NextResponse.json({
      success: true,
      total_count: totalCount,
      showing: logs.length,
      logs: logs.map(log => ({
        id: log._id,
        device_id: log.device_id,
        asset_id: log.asset_id,
        playlist_id: log.playlist_id,
        start_time: log.start_time,
        end_time: log.end_time,
        duration: log.duration,
        created_at: log.created_at,
      }))
    });

  } catch (error: any) {
    console.error("[PLAYBACK_TEST_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to fetch logs", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/playback/test
 * 
 * Clears all test playback logs (use with caution!)
 */
export async function DELETE(request: NextRequest) {
  try {
    // Connect to database
    await connectDB();

    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete all playback logs
    const result = await PlaybackLog.deleteMany({});

    return NextResponse.json({
      success: true,
      deleted: result.deletedCount,
      message: `Deleted ${result.deletedCount} playback logs`
    });

  } catch (error: any) {
    console.error("[PLAYBACK_TEST_DELETE_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to delete logs", details: error.message },
      { status: 500 }
    );
  }
}


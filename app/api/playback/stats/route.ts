import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import PlaybackLog from "@/models/PlaybackLog";

/**
 * GET /api/playback/stats
 * 
 * Returns playback statistics summary.
 * 
 * Response:
 * {
 *   "stats": {
 *     "total_plays": number,
 *     "total_duration": number,
 *     "unique_device_count": number,
 *     "unique_asset_count": number,
 *     "unique_playlist_count": number
 *   }
 * }
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

    // Execute aggregation for stats
    const statsResult = await PlaybackLog.aggregate([
      {
        $group: {
          _id: null,
          total_plays: { $sum: 1 },
          total_duration: { $sum: "$duration" },
          unique_devices: { $addToSet: "$device_id" },
          unique_assets: { $addToSet: "$asset_id" },
          unique_playlists: { $addToSet: "$playlist_id" }
        }
      },
      {
        $project: {
          _id: 0,
          total_plays: 1,
          total_duration: 1,
          unique_device_count: { $size: "$unique_devices" },
          unique_asset_count: { $size: "$unique_assets" },
          unique_playlist_count: { $size: "$unique_playlists" }
        }
      }
    ]);

    // Handle empty database
    const stats = statsResult[0] || {
      total_plays: 0,
      total_duration: 0,
      unique_device_count: 0,
      unique_asset_count: 0,
      unique_playlist_count: 0
    };

    return NextResponse.json({ stats });

  } catch (error: any) {
    console.error("[PLAYBACK_STATS_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}






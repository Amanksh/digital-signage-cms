import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import PlaybackLog from "@/models/PlaybackLog";

interface ReportFilters {
  device_id?: string;
  asset_id?: string;
  playlist_id?: string;
  date_from?: Date;
  date_to?: Date;
}

/**
 * GET /api/playback/report
 * 
 * Generates playback reports with filtering and aggregation capabilities.
 * 
 * Query Parameters:
 * - device_id (optional): Filter by specific device
 * - asset_id (optional): Filter by specific asset
 * - playlist_id (optional): Filter by specific playlist
 * - date_from (optional): Start date filter (ISO string)
 * - date_to (optional): End date filter (ISO string)
 * - page (optional): Page number for pagination (default: 1)
 * - limit (optional): Items per page (default: 100, max: 1000)
 * 
 * Response:
 * {
 *   "summary": {
 *     "total_plays": number,
 *     "total_duration": number,
 *     "unique_devices": number,
 *     "unique_assets": number,
 *     "date_range": { "from": string, "to": string }
 *   },
 *   "by_asset": [
 *     {
 *       "asset_id": string,
 *       "play_count": number,
 *       "total_duration": number,
 *       "avg_duration": number,
 *       "first_played": string,
 *       "last_played": string
 *     }
 *   ],
 *   "by_device": [...],
 *   "by_playlist": [...],
 *   "pagination": {
 *     "page": number,
 *     "limit": number,
 *     "total_pages": number,
 *     "has_next": boolean,
 *     "has_prev": boolean
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    
    const filters: ReportFilters = {};
    const device_id = searchParams.get('device_id');
    const asset_id = searchParams.get('asset_id');
    const playlist_id = searchParams.get('playlist_id');
    const date_from = searchParams.get('date_from');
    const date_to = searchParams.get('date_to');
    
    // Pagination parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(1000, Math.max(1, parseInt(searchParams.get('limit') || '100')));
    const skip = (page - 1) * limit;

    // Build MongoDB filter
    const mongoFilter: any = {};

    if (device_id) {
      mongoFilter.device_id = device_id.trim();
      filters.device_id = device_id.trim();
    }
    if (asset_id) {
      mongoFilter.asset_id = asset_id.trim();
      filters.asset_id = asset_id.trim();
    }
    if (playlist_id) {
      mongoFilter.playlist_id = playlist_id.trim();
      filters.playlist_id = playlist_id.trim();
    }

    // Date range filtering
    if (date_from || date_to) {
      mongoFilter.start_time = {};
      
      if (date_from) {
        const fromDate = new Date(date_from);
        if (isNaN(fromDate.getTime())) {
          return NextResponse.json(
            { error: "Invalid date_from format. Use ISO date string." },
            { status: 400 }
          );
        }
        mongoFilter.start_time.$gte = fromDate;
        filters.date_from = fromDate;
      }
      
      if (date_to) {
        const toDate = new Date(date_to);
        if (isNaN(toDate.getTime())) {
          return NextResponse.json(
            { error: "Invalid date_to format. Use ISO date string." },
            { status: 400 }
          );
        }
        mongoFilter.start_time.$lte = toDate;
        filters.date_to = toDate;
      }
    }

    // Execute aggregation pipelines in parallel for better performance
    const [
      summaryResult,
      assetAggregation,
      deviceAggregation,
      playlistAggregation,
      totalCount
    ] = await Promise.all([
      // Summary statistics
      PlaybackLog.aggregate([
        { $match: mongoFilter },
        {
          $group: {
            _id: null,
            total_plays: { $sum: 1 },
            total_duration: { $sum: "$duration" },
            unique_devices: { $addToSet: "$device_id" },
            unique_assets: { $addToSet: "$asset_id" },
            unique_playlists: { $addToSet: "$playlist_id" },
            min_date: { $min: "$start_time" },
            max_date: { $max: "$start_time" }
          }
        },
        {
          $project: {
            _id: 0,
            total_plays: 1,
            total_duration: 1,
            unique_devices: { $size: "$unique_devices" },
            unique_assets: { $size: "$unique_assets" },
            unique_playlists: { $size: "$unique_playlists" },
            min_date: 1,
            max_date: 1
          }
        }
      ]),

      // By Asset aggregation
      PlaybackLog.aggregate([
        { $match: mongoFilter },
        {
          $group: {
            _id: "$asset_id",
            play_count: { $sum: 1 },
            total_duration: { $sum: "$duration" },
            first_played: { $min: "$start_time" },
            last_played: { $max: "$start_time" }
          }
        },
        {
          $project: {
            asset_id: "$_id",
            play_count: 1,
            total_duration: 1,
            avg_duration: { $divide: ["$total_duration", "$play_count"] },
            first_played: 1,
            last_played: 1,
            _id: 0
          }
        },
        { $sort: { play_count: -1 } },
        { $skip: skip },
        { $limit: limit }
      ]),

      // By Device aggregation
      PlaybackLog.aggregate([
        { $match: mongoFilter },
        {
          $group: {
            _id: "$device_id",
            play_count: { $sum: 1 },
            total_duration: { $sum: "$duration" },
            unique_assets: { $addToSet: "$asset_id" },
            first_played: { $min: "$start_time" },
            last_played: { $max: "$start_time" }
          }
        },
        {
          $project: {
            device_id: "$_id",
            play_count: 1,
            total_duration: 1,
            unique_assets: { $size: "$unique_assets" },
            avg_duration: { $divide: ["$total_duration", "$play_count"] },
            first_played: 1,
            last_played: 1,
            _id: 0
          }
        },
        { $sort: { play_count: -1 } },
        { $limit: 50 } // Limit device results for performance
      ]),

      // By Playlist aggregation
      PlaybackLog.aggregate([
        { $match: mongoFilter },
        {
          $group: {
            _id: "$playlist_id",
            play_count: { $sum: 1 },
            total_duration: { $sum: "$duration" },
            unique_assets: { $addToSet: "$asset_id" },
            unique_devices: { $addToSet: "$device_id" },
            first_played: { $min: "$start_time" },
            last_played: { $max: "$start_time" }
          }
        },
        {
          $project: {
            playlist_id: "$_id",
            play_count: 1,
            total_duration: 1,
            unique_assets: { $size: "$unique_assets" },
            unique_devices: { $size: "$unique_devices" },
            avg_duration: { $divide: ["$total_duration", "$play_count"] },
            first_played: 1,
            last_played: 1,
            _id: 0
          }
        },
        { $sort: { play_count: -1 } },
        { $limit: 50 } // Limit playlist results for performance
      ]),

      // Total count for pagination (only for asset aggregation)
      PlaybackLog.aggregate([
        { $match: mongoFilter },
        { $group: { _id: "$asset_id" } },
        { $count: "total" }
      ])
    ]);

    // Process results
    const summary = summaryResult[0] || {
      total_plays: 0,
      total_duration: 0,
      unique_devices: 0,
      unique_assets: 0,
      unique_playlists: 0,
      min_date: null,
      max_date: null
    };

    const totalAssets = totalCount[0]?.total || 0;
    const totalPages = Math.ceil(totalAssets / limit);

    // Build response
    const response = {
      summary: {
        total_plays: summary.total_plays,
        total_duration: summary.total_duration,
        unique_devices: summary.unique_devices,
        unique_assets: summary.unique_assets,
        unique_playlists: summary.unique_playlists,
        date_range: {
          from: summary.min_date,
          to: summary.max_date
        },
        filters: filters
      },
      by_asset: assetAggregation.map(asset => ({
        ...asset,
        avg_duration: Math.round(asset.avg_duration * 100) / 100 // Round to 2 decimal places
      })),
      by_device: deviceAggregation.map(device => ({
        ...device,
        avg_duration: Math.round(device.avg_duration * 100) / 100
      })),
      by_playlist: playlistAggregation.map(playlist => ({
        ...playlist,
        avg_duration: Math.round(playlist.avg_duration * 100) / 100
      })),
      pagination: {
        page,
        limit,
        total_items: totalAssets,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1
      }
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error("[PLAYBACK_REPORT_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

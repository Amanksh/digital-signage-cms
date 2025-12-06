import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Playlist from "@/models/Playlist";
import Campaign from "@/models/Campaign";
import Asset from "@/models/Asset";
import Display from "@/models/Display";
import mongoose from "mongoose";

// Ensure models are registered
if (!mongoose.models.Campaign) {
  mongoose.model("Campaign", Campaign.schema);
}
if (!mongoose.models.Asset) {
  mongoose.model("Asset", Asset.schema);
}

/**
 * Player Playlist API
 * 
 * Returns a FLATTENED array of assets for Android/Digital Signage Players.
 * 
 * Response Format:
 * {
 *   "playlistId": "...",
 *   "assets": [
 *     {
 *       "assetId": "...",
 *       "type": "VIDEO",
 *       "url": "...",
 *       "duration": 10,
 *       "campaignId": "..." (optional, null for direct assets)
 *     }
 *   ]
 * }
 * 
 * Supports:
 * - Campaigns (folders) containing multiple assets (max 8-9 per campaign)
 * - Direct assets (standalone assets not in any campaign)
 * - Mixed content playlists (campaigns + direct assets)
 */

// GET /api/player/playlist - Get playlist with expanded campaign assets for Android player
export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const playlistId = searchParams.get("playlistId");
    const deviceId = searchParams.get("deviceId");

    // Must provide either playlistId or deviceId
    if (!playlistId && !deviceId) {
      return NextResponse.json(
        { error: "Either playlistId or deviceId is required" },
        { status: 400 }
      );
    }

    let playlist;

    if (deviceId) {
      // Find display by deviceId and get its playlist
      const display = await Display.findOne({ deviceId });
      if (!display) {
        return NextResponse.json(
          { error: "Display not found" },
          { status: 404 }
        );
      }

      if (!display.playlistId) {
        return NextResponse.json(
          { error: "No playlist assigned to this display" },
          { status: 404 }
        );
      }

      playlist = await Playlist.findById(display.playlistId);
    } else if (playlistId) {
      if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        return NextResponse.json(
          { error: "Invalid playlist ID" },
          { status: 400 }
        );
      }
      playlist = await Playlist.findById(playlistId);
    }

    if (!playlist) {
      return NextResponse.json(
        { error: "Playlist not found" },
        { status: 404 }
      );
    }

    // Build flattened assets array
    const flattenedAssets: {
      assetId: string;
      type: string;
      url: string;
      duration: number;
      campaignId: string | null;
      name?: string;
      thumbnail?: string;
    }[] = [];

    // 1. Expand campaigns to get their assets (in order)
    if (playlist.campaignIds && playlist.campaignIds.length > 0) {
      for (const campaignId of playlist.campaignIds) {
        const campaign = await Campaign.findById(campaignId);
        if (!campaign) continue;

        // Get all assets for this campaign
        const campaignAssets = await Asset.find({ campaignId: campaign._id })
          .select("_id name type url thumbnail duration")
          .sort({ createdAt: 1 }); // Maintain order within campaign

        // Add each asset with campaign reference
        for (const asset of campaignAssets) {
          flattenedAssets.push({
            assetId: asset._id.toString(),
            type: asset.type,
            url: asset.url,
            duration: asset.duration || (asset.type === "VIDEO" ? 0 : 10),
            campaignId: campaign._id.toString(),
            name: asset.name,
            thumbnail: asset.thumbnail || undefined,
          });
        }
      }
    }

    // 2. Add direct assets (standalone assets not in any campaign)
    if (playlist.assetIds && playlist.assetIds.length > 0) {
      const directAssets = await Asset.find({
        _id: { $in: playlist.assetIds },
      })
        .select("_id name type url thumbnail duration")
        .sort({ createdAt: 1 });

      for (const asset of directAssets) {
        flattenedAssets.push({
          assetId: asset._id.toString(),
          type: asset.type,
          url: asset.url,
          duration: asset.duration || (asset.type === "VIDEO" ? 0 : 10),
          campaignId: null, // Direct asset - no campaign
          name: asset.name,
          thumbnail: asset.thumbnail || undefined,
        });
      }
    }

    // 3. Legacy support: If no campaigns/direct assets but has items, use items
    if (
      flattenedAssets.length === 0 &&
      playlist.items &&
      playlist.items.length > 0
    ) {
      const populatedPlaylist = await Playlist.findById(playlist._id).populate(
        "items.assetId"
      );

      if (populatedPlaylist?.items) {
        for (const item of populatedPlaylist.items) {
          if (item.assetId) {
            const asset = item.assetId as any;
            flattenedAssets.push({
              assetId: asset._id.toString(),
              type: asset.type,
              url: asset.url,
              duration: item.duration || asset.duration || 10,
              campaignId: null, // Legacy items don't have campaign
              name: asset.name,
              thumbnail: asset.thumbnail || undefined,
            });
          }
        }
      }
    }

    // Return the exact format for Android player
    // DO NOT return campaignIds to the player - return flattened assets
    return NextResponse.json({
      playlistId: playlist._id.toString(),
      playlistName: playlist.name,
      status: playlist.status,
      totalAssets: flattenedAssets.length,
      assets: flattenedAssets,
    });
  } catch (error) {
    console.error("[PLAYER_PLAYLIST_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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

    // Expand campaigns to get all assets in order
    const expandedAssets: any[] = [];

    if (playlist.campaignIds && playlist.campaignIds.length > 0) {
      // Process campaigns in order
      for (const campaignId of playlist.campaignIds) {
        const campaign = await Campaign.findById(campaignId);
        if (!campaign) continue;

        // Get all assets for this campaign
        const assets = await Asset.find({ campaignId: campaign._id })
          .select("name type url thumbnail duration")
          .sort({ createdAt: 1 });

        // Add each asset with campaign info
        for (const asset of assets) {
          expandedAssets.push({
            assetId: asset._id.toString(),
            name: asset.name,
            type: asset.type,
            url: asset.url,
            thumbnail: asset.thumbnail,
            duration: asset.duration || (asset.type === "VIDEO" ? 1 : 10),
            campaignId: campaign._id.toString(),
            campaignName: campaign.name,
          });
        }
      }
    }

    // Legacy support: If no campaigns but has items, use items
    if (expandedAssets.length === 0 && playlist.items && playlist.items.length > 0) {
      const populatedPlaylist = await Playlist.findById(playlist._id).populate(
        "items.assetId"
      );

      if (populatedPlaylist?.items) {
        for (const item of populatedPlaylist.items) {
          if (item.assetId) {
            const asset = item.assetId as any;
            expandedAssets.push({
              assetId: asset._id.toString(),
              name: asset.name,
              type: asset.type,
              url: asset.url,
              thumbnail: asset.thumbnail,
              duration: item.duration || asset.duration || 10,
              campaignId: null,
              campaignName: null,
            });
          }
        }
      }
    }

    return NextResponse.json({
      playlistId: playlist._id.toString(),
      playlistName: playlist.name,
      status: playlist.status,
      totalAssets: expandedAssets.length,
      assets: expandedAssets,
    });
  } catch (error) {
    console.error("[PLAYER_PLAYLIST_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


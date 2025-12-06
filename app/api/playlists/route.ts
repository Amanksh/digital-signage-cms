import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Playlist from "@/models/Playlist";
import Campaign from "@/models/Campaign";
import Asset from "@/models/Asset";
import mongoose from "mongoose";

const MAX_CAMPAIGNS_PER_PLAYLIST = 7;

// Ensure models are registered
if (!mongoose.models.Asset) {
  mongoose.model("Asset", Asset.schema);
}
if (!mongoose.models.Campaign) {
  mongoose.model("Campaign", Campaign.schema);
}

// GET /api/playlists - Get all playlists for the current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await connectDB();

    const playlists = await Playlist.find({ userId: session.user.id })
      .populate({
        path: "campaignIds",
        select: "name description",
      })
      .populate({
        path: "assetIds",
        select: "name type url thumbnail duration size",
      })
      .populate("items.assetId") // Legacy support
      .sort({ createdAt: -1 });

    // Enrich playlists with campaign asset counts and preview assets
    const enrichedPlaylists = await Promise.all(
      playlists.map(async (playlist) => {
        const playlistObj = playlist.toObject();
        let totalAssets = 0;

        // Process campaigns
        if (playlistObj.campaignIds && playlistObj.campaignIds.length > 0) {
          const campaignData = await Promise.all(
            playlistObj.campaignIds.map(async (campaign: any) => {
              const assetCount = await Asset.countDocuments({
                campaignId: campaign._id,
              });
              const previewAssets = await Asset.find({
                campaignId: campaign._id,
              })
                .limit(4)
                .select("url thumbnail type");
              return {
                ...campaign,
                assetCount,
                previewAssets,
              };
            })
          );

          playlistObj.campaignIds = campaignData;
          totalAssets += campaignData.reduce(
            (sum: number, c: any) => sum + c.assetCount,
            0
          );
        }

        // Add direct asset count
        if (playlistObj.assetIds && playlistObj.assetIds.length > 0) {
          totalAssets += playlistObj.assetIds.length;
        }

        playlistObj.totalAssets = totalAssets;
        return playlistObj;
      })
    );

    return NextResponse.json(enrichedPlaylists);
  } catch (error) {
    console.error("[PLAYLISTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST /api/playlists - Create a new playlist
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { name, description, campaignIds, assetIds, items, schedule } = body;

    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
    }

    await connectDB();

    // Validate campaignIds if provided
    if (campaignIds && campaignIds.length > 0) {
      // Check max limit
      if (campaignIds.length > MAX_CAMPAIGNS_PER_PLAYLIST) {
        return NextResponse.json(
          { error: `Maximum ${MAX_CAMPAIGNS_PER_PLAYLIST} campaigns allowed per playlist.` },
          { status: 400 }
        );
      }

      // Verify all campaigns exist and belong to user
      const validCampaigns = await Campaign.find({
        _id: { $in: campaignIds },
        userId: session.user.id,
      });

      if (validCampaigns.length !== campaignIds.length) {
        return NextResponse.json(
          { error: "One or more campaigns not found or don't belong to you" },
          { status: 400 }
        );
      }
    }

    // Validate assetIds if provided (direct assets)
    if (assetIds && assetIds.length > 0) {
      // Verify all assets exist and belong to user
      const validAssets = await Asset.find({
        _id: { $in: assetIds },
        userId: session.user.id,
        campaignId: null, // Only allow direct assets
      });

      if (validAssets.length !== assetIds.length) {
        return NextResponse.json(
          { error: "One or more assets not found or don't belong to you" },
          { status: 400 }
        );
      }
    }

    const playlist = await Playlist.create({
      name,
      description,
      campaignIds: campaignIds || [],
      assetIds: assetIds || [],
      items: items || [], // Legacy support
      userId: session.user.id,
      schedule,
      status: schedule ? "scheduled" : "inactive",
    });

    return NextResponse.json(playlist);
  } catch (error) {
    console.error("[PLAYLISTS_POST]", error);
    if (error instanceof Error && error.message.includes("Maximum")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return new NextResponse("Internal Error", { status: 500 });
  }
}

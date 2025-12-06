import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Playlist from "@/models/Playlist";
import Campaign from "@/models/Campaign";
import Asset from "@/models/Asset";
import mongoose from "mongoose";

const MAX_CAMPAIGNS_PER_PLAYLIST = 7;

// GET /api/playlists/[playlistId] - Get a specific playlist
export async function GET(
  request: Request,
  context: { params: Promise<{ playlistId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { playlistId } = await context.params;

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
      return new NextResponse("Invalid playlist ID", { status: 400 });
    }

    const playlist = await Playlist.findOne({
      _id: playlistId,
      userId: session.user.id,
    })
      .populate({
        path: "campaignIds",
        select: "name description",
      })
      .populate({
        path: "assetIds",
        select: "name type url thumbnail duration size",
      })
      .populate("items.assetId"); // Legacy support

    if (!playlist) {
      return new NextResponse("Playlist not found", { status: 404 });
    }

    // Enrich with campaign data
    const playlistObj = playlist.toObject();
    let totalAssets = 0;

    if (playlistObj.campaignIds && playlistObj.campaignIds.length > 0) {
      const enrichedCampaigns = await Promise.all(
        playlistObj.campaignIds.map(async (campaign: any) => {
          const assets = await Asset.find({ campaignId: campaign._id })
            .select("name type url thumbnail duration")
            .sort({ createdAt: 1 });
          return {
            ...campaign,
            assets,
            assetCount: assets.length,
          };
        })
      );

      playlistObj.campaignIds = enrichedCampaigns;
      totalAssets += enrichedCampaigns.reduce(
        (sum: number, c: any) => sum + c.assetCount,
        0
      );
    }

    // Add direct assets count
    if (playlistObj.assetIds && playlistObj.assetIds.length > 0) {
      totalAssets += playlistObj.assetIds.length;
    }

    playlistObj.totalAssets = totalAssets;

    return NextResponse.json(playlistObj);
  } catch (error) {
    console.error("[PLAYLIST_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// PATCH /api/playlists/[playlistId] - Update a playlist
export async function PATCH(
  request: Request,
  context: { params: Promise<{ playlistId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { playlistId } = await context.params;

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
      return new NextResponse("Invalid playlist ID", { status: 400 });
    }

    const body = await request.json();
    const { name, description, campaignIds, assetIds, items, schedule, status } = body;

    await connectDB();

    const playlist = await Playlist.findOne({
      _id: playlistId,
      userId: session.user.id,
    });

    if (!playlist) {
      return new NextResponse("Playlist not found", { status: 404 });
    }

    // Validate campaignIds if provided
    if (campaignIds !== undefined) {
      if (campaignIds.length > MAX_CAMPAIGNS_PER_PLAYLIST) {
        return NextResponse.json(
          { error: `Maximum ${MAX_CAMPAIGNS_PER_PLAYLIST} campaigns allowed per playlist.` },
          { status: 400 }
        );
      }

      if (campaignIds.length > 0) {
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

      playlist.campaignIds = campaignIds;
    }

    // Validate assetIds if provided (direct assets)
    if (assetIds !== undefined) {
      if (assetIds.length > 0) {
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

      playlist.assetIds = assetIds;
    }

    // Update fields if they exist in the request
    if (name !== undefined) playlist.name = name;
    if (description !== undefined) playlist.description = description;
    if (items !== undefined) {
      // Legacy support for items
      playlist.items = items.map((item: any) => ({
        assetId: mongoose.Types.ObjectId.isValid(item.assetId)
          ? item.assetId
          : null,
        duration: Number(item.duration),
        order: Number(item.order),
      }));

      playlist.items = playlist.items.filter(
        (item: { assetId: mongoose.Types.ObjectId | null }) =>
          item.assetId !== null
      );
    }
    if (schedule !== undefined) {
      playlist.schedule = schedule;
      playlist.status = "scheduled";
    }
    if (status !== undefined) playlist.status = status;

    await playlist.save();

    return NextResponse.json(playlist);
  } catch (error) {
    console.error("[PLAYLIST_PATCH]", error);
    if (error instanceof Error && error.message.includes("Maximum")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return new NextResponse(
      error instanceof Error ? error.message : "Internal Error",
      { status: 500 }
    );
  }
}

// DELETE /api/playlists/[playlistId] - Delete a playlist
export async function DELETE(
  request: Request,
  context: { params: Promise<{ playlistId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { playlistId } = await context.params;

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
      return new NextResponse("Invalid playlist ID", { status: 400 });
    }

    await connectDB();

    const playlist = await Playlist.findOneAndDelete({
      _id: playlistId,
      userId: session.user.id,
    });

    if (!playlist) {
      return new NextResponse("Playlist not found", { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[PLAYLIST_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

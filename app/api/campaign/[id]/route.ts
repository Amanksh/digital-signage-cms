import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Campaign from "@/models/Campaign";
import Asset from "@/models/Asset";
import Playlist from "@/models/Playlist";
import mongoose from "mongoose";

// GET /api/campaign/[id] - Get a specific campaign with its assets
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await context.params;

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return new NextResponse("Invalid campaign ID", { status: 400 });
    }

    const campaign = await Campaign.findOne({
      _id: id,
      userId: session.user.id,
    });

    if (!campaign) {
      return new NextResponse("Campaign not found", { status: 404 });
    }

    // Get assets for this campaign
    const assets = await Asset.find({ campaignId: campaign._id })
      .select("_id name type url thumbnail duration size createdAt")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      id: campaign._id,
      _id: campaign._id,
      name: campaign.name,
      type: "campaign",
      assets: assets.map((asset) => ({
        assetId: asset._id,
        _id: asset._id,
        name: asset.name,
        type: asset.type,
        url: asset.url,
        thumbnail: asset.thumbnail,
        duration: asset.duration || 10,
        size: asset.size,
        createdAt: asset.createdAt,
      })),
      assetCount: assets.length,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
    });
  } catch (error) {
    console.error("[CAMPAIGN_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// DELETE /api/campaign/[id] - Delete a campaign
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await context.params;

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return new NextResponse("Invalid campaign ID", { status: 400 });
    }

    await connectDB();

    // Check if campaign is assigned to any playlist
    const playlistsUsingCampaign = await Playlist.findOne({
      campaignIds: id,
    });

    if (playlistsUsingCampaign) {
      return NextResponse.json(
        {
          error:
            "Cannot delete campaign. It is currently assigned to a playlist. Remove it from the playlist first.",
        },
        { status: 400 }
      );
    }

    const campaign = await Campaign.findOneAndDelete({
      _id: id,
      userId: session.user.id,
    });

    if (!campaign) {
      return new NextResponse("Campaign not found", { status: 404 });
    }

    // Also delete all assets in this campaign
    await Asset.deleteMany({ campaignId: id });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[CAMPAIGN_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}


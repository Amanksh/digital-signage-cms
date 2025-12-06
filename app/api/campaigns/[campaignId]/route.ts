import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Campaign from "@/models/Campaign";
import Asset from "@/models/Asset";
import Playlist from "@/models/Playlist";
import mongoose from "mongoose";

// GET /api/campaigns/[campaignId] - Get a specific campaign with its assets
export async function GET(
  request: Request,
  context: { params: Promise<{ campaignId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { campaignId } = await context.params;

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      return new NextResponse("Invalid campaign ID", { status: 400 });
    }

    const campaign = await Campaign.findOne({
      _id: campaignId,
      userId: session.user.id,
    });

    if (!campaign) {
      return new NextResponse("Campaign not found", { status: 404 });
    }

    // Get assets for this campaign
    const assets = await Asset.find({ campaignId: campaign._id }).sort({
      createdAt: -1,
    });

    return NextResponse.json({
      ...campaign.toObject(),
      assets,
      assetCount: assets.length,
    });
  } catch (error) {
    console.error("[CAMPAIGN_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// PATCH /api/campaigns/[campaignId] - Update a campaign
export async function PATCH(
  request: Request,
  context: { params: Promise<{ campaignId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { campaignId } = await context.params;

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      return new NextResponse("Invalid campaign ID", { status: 400 });
    }

    const body = await request.json();
    const { name, description } = body;

    await connectDB();

    const campaign = await Campaign.findOne({
      _id: campaignId,
      userId: session.user.id,
    });

    if (!campaign) {
      return new NextResponse("Campaign not found", { status: 404 });
    }

    // Check for duplicate name if name is being changed
    if (name && name.trim() !== campaign.name) {
      const existingCampaign = await Campaign.findOne({
        name: name.trim(),
        userId: session.user.id,
        _id: { $ne: campaignId },
      });

      if (existingCampaign) {
        return NextResponse.json(
          { error: "A campaign with this name already exists" },
          { status: 400 }
        );
      }
    }

    if (name !== undefined) campaign.name = name.trim();
    if (description !== undefined) campaign.description = description.trim();

    await campaign.save();

    return NextResponse.json(campaign);
  } catch (error) {
    console.error("[CAMPAIGN_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// DELETE /api/campaigns/[campaignId] - Delete a campaign
export async function DELETE(
  request: Request,
  context: { params: Promise<{ campaignId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { campaignId } = await context.params;

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      return new NextResponse("Invalid campaign ID", { status: 400 });
    }

    await connectDB();

    // Check if campaign is assigned to any playlist
    const playlistsUsingCampaign = await Playlist.findOne({
      campaignIds: campaignId,
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
      _id: campaignId,
      userId: session.user.id,
    });

    if (!campaign) {
      return new NextResponse("Campaign not found", { status: 404 });
    }

    // Also delete all assets in this campaign
    await Asset.deleteMany({ campaignId: campaignId });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[CAMPAIGN_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}


import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Campaign from "@/models/Campaign";
import Asset from "@/models/Asset";

// GET /api/campaign/list - Get all campaigns with their assets
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await connectDB();

    const campaigns = await Campaign.find({ userId: session.user.id }).sort({
      createdAt: -1,
    });

    // Get assets for each campaign
    const campaignsWithAssets = await Promise.all(
      campaigns.map(async (campaign) => {
        const assets = await Asset.find({ campaignId: campaign._id })
          .select("_id name type url thumbnail duration size createdAt")
          .sort({ createdAt: -1 });

        return {
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
        };
      })
    );

    return NextResponse.json(campaignsWithAssets);
  } catch (error) {
    console.error("[CAMPAIGN_LIST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}


import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Asset from "@/models/Asset";
import Campaign from "@/models/Campaign";
import User from "@/models/User";

export async function GET(request: Request) {
  try {
    // First establish database connection
    await connectDB();

    // Then get the session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Double check the user exists in database
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check for query parameters
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId");
    const view = searchParams.get("view"); // "combined" for file manager view

    // If view=combined, return campaigns and direct assets together
    if (view === "combined") {
      // Get all campaigns with their assets
      const campaigns = await Campaign.find({ userId: session.user.id }).sort({
        createdAt: -1,
      });

      const campaignsWithAssets = await Promise.all(
        campaigns.map(async (campaign) => {
          const assets = await Asset.find({ campaignId: campaign._id })
            .select("_id name type url thumbnail duration size createdAt")
            .sort({ createdAt: -1 });

          return {
            id: campaign._id,
            _id: campaign._id,
            name: campaign.name,
            description: campaign.description,
            type: "campaign" as const,
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

      // Get direct assets (assets without campaignId)
      const directAssets = await Asset.find({
        userId: session.user.id,
        campaignId: null,
      })
        .sort({ createdAt: -1 })
        .select("_id name type url size createdAt duration thumbnail");

      const formattedDirectAssets = directAssets.map((asset) => ({
        _id: asset._id,
        id: asset._id,
        name: asset.name,
        type: asset.type,
        url: asset.url,
        thumbnail: asset.thumbnail,
        duration: asset.duration || 10,
        size: asset.size || 0,
        createdAt: asset.createdAt,
        itemType: "asset" as const,
      }));

      return NextResponse.json({
        campaigns: campaignsWithAssets,
        assets: formattedDirectAssets,
      });
    }

    // Original behavior: filter by campaignId or return all assets
    const query: any = { userId: session.user.id };
    
    if (campaignId) {
      query.campaignId = campaignId;
    }

    const assets = await Asset.find(query)
      .populate("campaignId", "name")
      .sort({ createdAt: -1 })
      .select("id name type url size createdAt duration thumbnail campaignId");

    return NextResponse.json(assets);
  } catch (error) {
    console.error("[ASSETS_GET_ERROR]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Campaign from "@/models/Campaign";
import Asset from "@/models/Asset";
import Playlist from "@/models/Playlist";

// GET /api/campaigns - Get all campaigns for the current user
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

    // Get asset counts for each campaign
    const campaignsWithCounts = await Promise.all(
      campaigns.map(async (campaign) => {
        const assetCount = await Asset.countDocuments({
          campaignId: campaign._id,
        });
        const assets = await Asset.find({ campaignId: campaign._id })
          .limit(4)
          .select("url thumbnail type");
        return {
          ...campaign.toObject(),
          assetCount,
          previewAssets: assets,
        };
      })
    );

    return NextResponse.json(campaignsWithCounts);
  } catch (error) {
    console.error("[CAMPAIGNS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST /api/campaigns - Create a new campaign
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Campaign name is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if campaign with same name already exists for this user
    const existingCampaign = await Campaign.findOne({
      name: name.trim(),
      userId: session.user.id,
    });

    if (existingCampaign) {
      return NextResponse.json(
        { error: "A campaign with this name already exists" },
        { status: 400 }
      );
    }

    const campaign = await Campaign.create({
      name: name.trim(),
      description: description?.trim() || "",
      userId: session.user.id,
    });

    return NextResponse.json(campaign);
  } catch (error) {
    console.error("[CAMPAIGNS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}


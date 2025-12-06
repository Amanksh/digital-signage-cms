import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Campaign from "@/models/Campaign";

// POST /api/campaign/create - Create a new campaign (folder)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name || !name.trim()) {
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

    // Return in folder format
    return NextResponse.json({
      id: campaign._id,
      _id: campaign._id,
      name: campaign.name,
      description: campaign.description,
      type: "campaign",
      assets: [],
      assetCount: 0,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
    });
  } catch (error) {
    console.error("[CAMPAIGN_CREATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}


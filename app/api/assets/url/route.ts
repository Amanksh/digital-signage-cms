import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Asset from "@/models/Asset";
import Campaign from "@/models/Campaign";
import User from "@/models/User";
import mongoose from "mongoose";

const MAX_ASSETS_PER_CAMPAIGN = 9;

// Map form content types to asset types
const contentTypeMap: Record<string, "IMAGE" | "VIDEO" | "URL"> = {
  image: "IMAGE",
  video: "VIDEO",
  webpage: "URL",
};

export async function POST(request: NextRequest) {
  try {
    // First establish database connection
    await connectDB();

    // Then get the session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Double check the user exists in database
    const user = await User.findById(session.user.id);
    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const formData = await request.formData();
    const url = formData.get("url") as string;
    const contentType = formData.get("contentType") as string;
    const campaignId = formData.get("campaignId") as string | null;
    // Use URL hostname as name if not provided
    const name = (formData.get("name") as string) || new URL(url).hostname;

    if (!url || !contentType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // If campaignId is provided, validate it
    let validCampaignId: string | null = null;
    if (campaignId && campaignId !== "null" && campaignId !== "") {
      // Validate campaignId format
      if (!mongoose.Types.ObjectId.isValid(campaignId)) {
        return NextResponse.json(
          { error: "Invalid campaign ID" },
          { status: 400 }
        );
      }

      // Verify campaign exists and belongs to the user
      const campaign = await Campaign.findOne({
        _id: campaignId,
        userId: session.user.id,
      });

      if (!campaign) {
        return NextResponse.json(
          { error: "Campaign not found" },
          { status: 404 }
        );
      }

      // Check asset count limit for this campaign
      const assetCount = await Asset.countDocuments({ campaignId });
      if (assetCount >= MAX_ASSETS_PER_CAMPAIGN) {
        return NextResponse.json(
          { error: "Maximum 9 assets allowed in one Campaign." },
          { status: 400 }
        );
      }

      validCampaignId = campaignId;
    }

    // Map the content type to the correct asset type
    const assetType = contentTypeMap[contentType];
    if (!assetType) {
      return NextResponse.json(
        { error: "Invalid content type" },
        { status: 400 }
      );
    }

    // Create the asset record
    // campaignId will be null for direct assets
    const asset = await Asset.create({
      name,
      type: assetType,
      url,
      duration: contentType === "video" ? 1 : 10,
      size: 0, // URL assets don't have a file size
      userId: session.user.id,
      campaignId: validCampaignId,
    });

    return NextResponse.json(asset);
  } catch (error) {
    console.error("[URL_ASSET_CREATE_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to create URL asset" },
      { status: 500 }
    );
  }
}

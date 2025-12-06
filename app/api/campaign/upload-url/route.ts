import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Asset from "@/models/Asset";
import Campaign from "@/models/Campaign";
import User from "@/models/User";
import mongoose from "mongoose";

const MAX_ASSETS_PER_CAMPAIGN = 9;

const contentTypeMap: Record<string, "IMAGE" | "VIDEO" | "URL"> = {
  image: "IMAGE",
  video: "VIDEO",
  webpage: "URL",
};

export async function POST(request: Request) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await User.findById(session.user.id);
    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const formData = await request.formData();
    const name = formData.get("name") as string;
    const url = formData.get("url") as string;
    const contentType = formData.get("contentType") as string;
    const campaignId = formData.get("campaignId") as string;

    if (!name || !url || !contentType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!campaignId) {
      return NextResponse.json(
        { error: "Campaign ID is required" },
        { status: 400 }
      );
    }

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

    // Check asset count limit
    const assetCount = await Asset.countDocuments({ campaignId });
    if (assetCount >= MAX_ASSETS_PER_CAMPAIGN) {
      return NextResponse.json(
        { error: "Maximum 9 assets allowed in one Campaign." },
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

    const assetType = contentTypeMap[contentType];
    if (!assetType) {
      return NextResponse.json(
        { error: "Invalid content type" },
        { status: 400 }
      );
    }

    const asset = await Asset.create({
      name,
      type: assetType,
      url,
      duration: contentType === "video" ? 1 : 10,
      size: 0,
      userId: session.user.id,
      campaignId: campaignId,
    });

    return NextResponse.json({
      assetId: asset._id,
      _id: asset._id,
      name: asset.name,
      type: asset.type,
      url: asset.url,
      duration: asset.duration,
      size: asset.size,
      createdAt: asset.createdAt,
    });
  } catch (error) {
    console.error("[CAMPAIGN_URL_UPLOAD_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to create URL asset" },
      { status: 500 }
    );
  }
}


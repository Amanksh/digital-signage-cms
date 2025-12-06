import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Asset from "@/models/Asset";
import Campaign from "@/models/Campaign";
import User from "@/models/User";
import { getSignedUploadUrl, generateS3Key } from "@/lib/s3";
import mongoose from "mongoose";

const MAX_ASSETS_PER_CAMPAIGN = 9;

export async function POST(request: Request) {
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
    const file = formData.get("file") as File;
    const name = (formData.get("name") as string) || file?.name; // Use filename if name not provided
    const type = formData.get("type") as "IMAGE" | "VIDEO" | "HTML" | "URL";
    const thumbnail = formData.get("thumbnail") as string;
    const campaignId = formData.get("campaignId") as string | null;

    if (!file || !type) {
      return new NextResponse("Missing required fields", { status: 400 });
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

    try {
      // Generate a unique key for the file in S3 using user's email
      const key = generateS3Key(file, session.user.email!);

      // Get signed URL for direct upload
      const { signedUrl, publicUrl } = await getSignedUploadUrl(file, key);

      // If it's a video and we have a thumbnail, upload it to S3
      let thumbnailUrl = null;
      if (type === "VIDEO" && thumbnail) {
        const thumbnailKey = `${key}_thumb.jpg`;

        // Convert base64 to Blob
        const base64Data = thumbnail.split(",")[1];
        const binaryData = Buffer.from(base64Data, "base64");
        const thumbnailBlob = new Blob([binaryData], { type: "image/jpeg" });

        // Use a simple object instead of File (File is not available in Node.js)
        const thumbnailFileInfo = {
          name: "thumbnail.jpg",
          type: "image/jpeg",
        };

        const { signedUrl: thumbnailSignedUrl, publicUrl: thumbnailPublicUrl } =
          await getSignedUploadUrl(thumbnailFileInfo, thumbnailKey);

        // Upload thumbnail to S3
        const thumbnailResponse = await fetch(thumbnailSignedUrl, {
          method: "PUT",
          body: thumbnailBlob,
          headers: {
            "Content-Type": "image/jpeg",
          },
        });

        if (!thumbnailResponse.ok) {
          throw new Error("Failed to upload thumbnail to S3");
        }

        thumbnailUrl = thumbnailPublicUrl;
      }

      // Create the asset record with the S3 URL
      // campaignId will be null for direct assets
      const asset = await Asset.create({
        name,
        type,
        url: publicUrl,
        thumbnail: thumbnailUrl,
        duration: type === "VIDEO" ? 1 : 10,
        size: file.size,
        userId: session.user.id,
        campaignId: validCampaignId,
      });

      return NextResponse.json({ asset, signedUrl });
    } catch (uploadError) {
      console.error("[S3_UPLOAD_ERROR]", uploadError);
      return new NextResponse(
        uploadError instanceof Error
          ? uploadError.message
          : "Failed to upload file",
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[ASSET_UPLOAD_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

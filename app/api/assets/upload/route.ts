import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Asset from "@/models/Asset";
import { getSignedUploadUrl, generateS3Key } from "@/lib/s3";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const name = formData.get("name") as string;
    const type = formData.get("type") as "IMAGE" | "VIDEO" | "HTML" | "URL";

    if (!file || !name || !type) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    await connectDB();

    try {
      // Generate a unique key for the file in S3 using user's email
      const key = generateS3Key(file, session.user.email!);

      // Get signed URL for direct upload
      const { signedUrl, publicUrl } = await getSignedUploadUrl(file, key);

      // Create the asset record with the S3 URL
      const asset = await Asset.create({
        name,
        type,
        url: publicUrl,
        size: file.size,
        userId: session.user.id,
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
    return new NextResponse(
      error instanceof Error ? error.message : "Internal Error",
      { status: 500 }
    );
  }
}

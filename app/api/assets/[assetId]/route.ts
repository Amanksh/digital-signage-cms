import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Asset from "@/models/Asset";
import User from "@/models/User";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

export async function DELETE(
  request: Request,
  context: { params: { assetId: string } }
) {
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

    const asset = await Asset.findOne({
      _id: context.params.assetId,
      userId: session.user.id,
    });

    if (!asset) {
      return new NextResponse("Asset not found", { status: 404 });
    }

    if (asset.type === "IMAGE" || asset.type === "VIDEO") {
      try {
        // Extract the key from the URL - get everything after the bucket name
        const url = new URL(asset.url);
        const key = url.pathname.substring(1); // Remove leading slash

        console.log("Deleting S3 object with key:", key);

        const s3Client = new S3Client({
          region: process.env.REGION,
          credentials: {
            accessKeyId: process.env.KEY_ID!,
            secretAccessKey: process.env.ACCESS_KEY!,
          },
        });

        const deleteCommand = new DeleteObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME!,
          Key: key,
        });

        await s3Client.send(deleteCommand);
        console.log("Successfully deleted S3 object");
      } catch (s3Error) {
        console.error("[S3_DELETE_ERROR]", s3Error);
        // Continue with database deletion even if S3 deletion fails
      }
    }

    await asset.deleteOne();
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[ASSET_DELETE_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

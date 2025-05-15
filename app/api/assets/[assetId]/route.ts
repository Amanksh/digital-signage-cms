import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Asset from "@/models/Asset";

export async function DELETE(
  request: Request,
  { params }: { params: { assetId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await connectDB();

    const asset = await Asset.findOne({
      _id: params.assetId,
      userId: session.user.id,
    });

    if (!asset) {
      return new NextResponse("Asset not found", { status: 404 });
    }

    // TODO: Delete the file from S3 if it's an image or video
    // For now, we'll just delete the database record
    await asset.deleteOne();

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[ASSET_DELETE_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

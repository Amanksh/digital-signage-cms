import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Asset from "@/models/Asset";
import User from "@/models/User";

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
    const name = formData.get("name") as string;
    const url = formData.get("url") as string;
    const contentType = formData.get("contentType") as string;

    if (!name || !url || !contentType) {
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

    // Map the content type to the correct asset type
    const assetType = contentTypeMap[contentType];
    if (!assetType) {
      return NextResponse.json(
        { error: "Invalid content type" },
        { status: 400 }
      );
    }

    // Create the asset record
    const asset = await Asset.create({
      name,
      type: assetType,
      url,
      duration: contentType === "video" ? 1 : 10,
      size: 0, // URL assets don't have a file size
      userId: session.user.id,
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

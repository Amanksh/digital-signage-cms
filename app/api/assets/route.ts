import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Asset from "@/models/Asset";
import User from "@/models/User";

export async function GET() {
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

    const assets = await Asset.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .select("id name type url size createdAt duration thumbnail");

    return NextResponse.json(assets);
  } catch (error) {
    console.error("[ASSETS_GET_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

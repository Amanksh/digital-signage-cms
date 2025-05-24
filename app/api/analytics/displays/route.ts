import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Display from "@/models/Display";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Get total number of displays that are online for the current user
    const total = await Display.countDocuments({
      status: "online",
      userId: session.user.id,
    });

    // Get number of active displays for the current user
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const active = await Display.countDocuments({
      status: "online",
      userId: session.user.id,
      lastActive: { $gte: fiveMinutesAgo },
    });

    return NextResponse.json({
      total,
      active,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching display statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch display statistics" },
      { status: 500 }
    );
  }
}

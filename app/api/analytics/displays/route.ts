import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Display from "@/models/Display";

export async function GET() {
  try {
    await connectDB();

    // Get total number of displays that are online
    const total = await Display.countDocuments({ status: "online" });

    // Get number of active displays (displays that have been active in the last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const active = await Display.countDocuments({
      status: "online",
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

import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";

export async function GET() {
  try {
    await connectDB();
    
    const totalUsers = await User.countDocuments();
    
    return NextResponse.json({
      totalUsers,
      message: `Total users in the system: ${totalUsers}`
    });
  } catch (error) {
    console.error("[USER_COUNT_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to get user count" },
      { status: 500 }
    );
  }
}

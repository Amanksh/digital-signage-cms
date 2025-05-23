import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Display from "@/models/Display";
import Playlist from "@/models/Playlist";
import User from "@/models/User";

// GET /api/displays - Get all displays for the user
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

    const displays = await Display.find({ userId: session.user.id }).populate(
      "playlistId"
    );

    return NextResponse.json(displays);
  } catch (error) {
    console.error("[DISPLAYS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST /api/displays - Create a new display
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { name, deviceId, location, resolution } = body;

    if (!name || !deviceId || !location || !resolution) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    await connectDB();

    // Check if deviceId already exists
    const existingDisplay = await Display.findOne({ deviceId });
    if (existingDisplay) {
      return new NextResponse("Device ID already exists", { status: 400 });
    }

    const display = await Display.create({
      name,
      deviceId,
      location,
      resolution,
      userId: session.user.id,
    });

    return NextResponse.json(display);
  } catch (error) {
    console.error("[DISPLAYS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

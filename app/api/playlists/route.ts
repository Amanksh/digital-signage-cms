import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Playlist from "@/models/Playlist";

// GET /api/playlists - Get all playlists for the user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await connectDB();

    const playlists = await Playlist.find({ userId: session.user.id })
      .populate("items.assetId")
      .sort({ createdAt: -1 });

    return NextResponse.json(playlists);
  } catch (error) {
    console.error("[PLAYLISTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST /api/playlists - Create a new playlist
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { name, description, items, schedule } = body;

    if (!name || !description) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    await connectDB();

    const playlist = await Playlist.create({
      name,
      description,
      userId: session.user.id,
      items: items || [],
      schedule,
      status: schedule ? "scheduled" : "inactive",
    });

    return NextResponse.json(playlist);
  } catch (error) {
    console.error("[PLAYLISTS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

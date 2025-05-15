import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Playlist from "@/models/Playlist";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await connectDB();

    const playlists = await Playlist.find({ userId: session.user.id })
      .populate("items.asset")
      .sort({ createdAt: -1 });

    return NextResponse.json(playlists);
  } catch (error) {
    console.log("[PLAYLISTS_GET_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { name, description, items } = body;

    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
    }

    await connectDB();

    const playlist = await Playlist.create({
      name,
      description,
      userId: session.user.id,
      items: items || [],
    });

    return NextResponse.json(playlist);
  } catch (error) {
    console.log("[PLAYLIST_CREATE_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

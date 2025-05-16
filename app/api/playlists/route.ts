import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Playlist from "@/models/Playlist";
import Asset from "@/models/Asset";
import mongoose from "mongoose";

// Ensure models are registered
if (!mongoose.models.Asset) {
  mongoose.model("Asset", Asset.schema);
}

// GET /api/playlists - Get all playlists for the current user
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
    const { name, items, description } = body;

    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
    }

    if (!description) {
      return new NextResponse("Description is required", { status: 400 });
    }

    await connectDB();

    const playlist = await Playlist.create({
      name,
      description,
      items,
      userId: session.user.id,
    });

    return NextResponse.json(playlist);
  } catch (error) {
    console.error("[PLAYLISTS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

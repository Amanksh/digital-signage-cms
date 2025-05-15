import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Playlist from "@/models/Playlist";

// GET /api/playlists/[playlistId] - Get a specific playlist
export async function GET(
  request: Request,
  { params }: { params: { playlistId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await connectDB();

    const playlist = await Playlist.findOne({
      _id: params.playlistId,
      userId: session.user.id,
    }).populate("items.assetId");

    if (!playlist) {
      return new NextResponse("Playlist not found", { status: 404 });
    }

    return NextResponse.json(playlist);
  } catch (error) {
    console.error("[PLAYLIST_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// PATCH /api/playlists/[playlistId] - Update a playlist
export async function PATCH(
  request: Request,
  { params }: { params: { playlistId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { name, description, items, schedule, status } = body;

    await connectDB();

    const playlist = await Playlist.findOne({
      _id: params.playlistId,
      userId: session.user.id,
    });

    if (!playlist) {
      return new NextResponse("Playlist not found", { status: 404 });
    }

    if (name) playlist.name = name;
    if (description) playlist.description = description;
    if (items) playlist.items = items;
    if (schedule) {
      playlist.schedule = schedule;
      playlist.status = "scheduled";
    }
    if (status) playlist.status = status;

    await playlist.save();

    return NextResponse.json(playlist);
  } catch (error) {
    console.error("[PLAYLIST_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// DELETE /api/playlists/[playlistId] - Delete a playlist
export async function DELETE(
  request: Request,
  { params }: { params: { playlistId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await connectDB();

    const playlist = await Playlist.findOneAndDelete({
      _id: params.playlistId,
      userId: session.user.id,
    });

    if (!playlist) {
      return new NextResponse("Playlist not found", { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[PLAYLIST_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

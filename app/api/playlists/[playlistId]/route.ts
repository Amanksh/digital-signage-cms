import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Playlist from "@/models/Playlist";
import mongoose from "mongoose";

// GET /api/playlists/[playlistId] - Get a specific playlist
export async function GET(
  request: Request,
  context: { params: Promise<{ playlistId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { playlistId } = await context.params;

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
      return new NextResponse("Invalid playlist ID", { status: 400 });
    }

    const playlist = await Playlist.findOne({
      _id: playlistId,
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
  context: { params: Promise<{ playlistId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { playlistId } = await context.params;

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
      return new NextResponse("Invalid playlist ID", { status: 400 });
    }

    const body = await request.json();
    const { name, description, items, schedule, status } = body;

    await connectDB();

    const playlist = await Playlist.findOne({
      _id: playlistId,
      userId: session.user.id,
    });

    if (!playlist) {
      return new NextResponse("Playlist not found", { status: 404 });
    }

    // Update fields if they exist in the request
    if (name !== undefined) playlist.name = name;
    if (description !== undefined) playlist.description = description;
    if (items !== undefined) {
      // Ensure items have valid ObjectIds for assetId and update the entire items array
      playlist.items = items.map((item: any) => ({
        assetId: mongoose.Types.ObjectId.isValid(item.assetId)
          ? item.assetId
          : null,
        duration: Number(item.duration),
        order: Number(item.order),
      }));

      // Remove any items with null assetId
      playlist.items = playlist.items.filter(
        (item: { assetId: mongoose.Types.ObjectId | null }) =>
          item.assetId !== null
      );
    }
    if (schedule !== undefined) {
      playlist.schedule = schedule;
      playlist.status = "scheduled";
    }
    if (status !== undefined) playlist.status = status;

    await playlist.save();

    return NextResponse.json(playlist);
  } catch (error) {
    console.error("[PLAYLIST_PATCH]", error);
    return new NextResponse(
      error instanceof Error ? error.message : "Internal Error",
      { status: 500 }
    );
  }
}

// DELETE /api/playlists/[playlistId] - Delete a playlist
export async function DELETE(
  request: Request,
  context: { params: Promise<{ playlistId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { playlistId } = await context.params;

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
      return new NextResponse("Invalid playlist ID", { status: 400 });
    }

    await connectDB();

    const playlist = await Playlist.findOneAndDelete({
      _id: playlistId,
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

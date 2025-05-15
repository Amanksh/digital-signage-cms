import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Display from "@/models/Display";

// GET /api/displays/[displayId] - Get a specific display
export async function GET(
  request: Request,
  { params }: { params: { displayId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await connectDB();

    const display = await Display.findOne({
      _id: params.displayId,
      userId: session.user.id,
    }).populate("playlistId");

    if (!display) {
      return new NextResponse("Display not found", { status: 404 });
    }

    return NextResponse.json(display);
  } catch (error) {
    console.error("[DISPLAY_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// PATCH /api/displays/[displayId] - Update a display
export async function PATCH(
  request: Request,
  { params }: { params: { displayId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { name, location, resolution, playlistId, status } = body;

    await connectDB();

    const display = await Display.findOne({
      _id: params.displayId,
      userId: session.user.id,
    });

    if (!display) {
      return new NextResponse("Display not found", { status: 404 });
    }

    // Update only the fields that are provided
    if (name) display.name = name;
    if (location) display.location = location;
    if (resolution) display.resolution = resolution;
    if (playlistId) display.playlistId = playlistId;
    if (status) display.status = status;

    await display.save();

    return NextResponse.json(display);
  } catch (error) {
    console.error("[DISPLAY_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// DELETE /api/displays/[displayId] - Delete a display
export async function DELETE(
  request: Request,
  { params }: { params: { displayId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await connectDB();

    const display = await Display.findOneAndDelete({
      _id: params.displayId,
      userId: session.user.id,
    });

    if (!display) {
      return new NextResponse("Display not found", { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[DISPLAY_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

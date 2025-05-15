import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Display from "@/models/Display";
import Asset from "@/models/Asset";
import mongoose from "mongoose";

// Ensure models are registered
if (!mongoose.models.Asset) {
  mongoose.model("Asset", Asset.schema);
}

// Helper function to add CORS headers
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*", // In production, replace with your media player domain
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

// GET /api/displays/device/[deviceId] - Get playlist for a specific device
export async function GET(
  request: Request,
  { params }: { params: { deviceId: string } }
) {
  try {
    await connectDB();

    const display = await Display.findOne({
      deviceId: params.deviceId,
    }).populate({
      path: "playlistId",
      populate: {
        path: "items.assetId",
      },
    });

    if (!display) {
      return new NextResponse("Display not found", {
        status: 404,
        headers: corsHeaders(),
      });
    }

    // Update last active timestamp
    display.lastActive = new Date();
    display.status = "online";
    await display.save();

    // If no playlist is assigned, return empty playlist
    if (!display.playlistId) {
      return NextResponse.json(
        {
          displayId: display._id,
          name: display.name,
          playlist: null,
        },
        { headers: corsHeaders() }
      );
    }

    // Return the playlist with all its items and assets
    return NextResponse.json(
      {
        displayId: display._id,
        name: display.name,
        playlist: display.playlistId,
      },
      { headers: corsHeaders() }
    );
  } catch (error) {
    console.error("[DISPLAY_DEVICE_GET]", error);
    return new NextResponse("Internal Error", {
      status: 500,
      headers: corsHeaders(),
    });
  }
}

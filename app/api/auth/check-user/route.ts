import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ exists: false }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email });

    return NextResponse.json({ exists: !!user });
  } catch (error) {
    console.error("[CHECK_USER_ERROR]", error);
    return NextResponse.json({ exists: false }, { status: 500 });
  }
}

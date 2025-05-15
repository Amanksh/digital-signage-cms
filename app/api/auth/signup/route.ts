import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db";
import User from "@/models/User";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name, password } = body;

    if (!email || !name || !password) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    await connectDB();

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return new NextResponse("Email already exists", { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      email,
      name,
      password: hashedPassword,
    });

    return NextResponse.json({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
    });
  } catch (error) {
    console.log("[SIGNUP_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

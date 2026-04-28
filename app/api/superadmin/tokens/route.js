import Token from "@/lib/models/Token";
import { NextResponse } from "next/server";

export async function GET() {
  try {

    const tokens = await Token.find({ isActive: true }).sort({ sortOrder: 1 });

    return NextResponse.json({
      success: true,
      data: tokens,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch tokens",
        error: error.message,
      },
      { status: 500 }
    );
  }
}


// POST
export async function POST(req) {
  try {

    const body = await req.json();

    if (!body.name || !body.symbol || !body.slug) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const token = await Token.create(body);

    return NextResponse.json({
      success: true,
      message: "Token created successfully",
      data: token,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
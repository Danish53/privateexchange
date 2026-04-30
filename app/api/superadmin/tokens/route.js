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

    // Calculate usdPerUnit from totalTokens (1 USD / totalTokens)
    let usdPerUnit = body.usdPerUnit;
    
    if (body.totalTokens) {
      const totalTokens = parseFloat(body.totalTokens);
      
      if (totalTokens === 0) {
        return NextResponse.json(
          { success: false, message: "Total tokens cannot be zero" },
          { status: 400 }
        );
      }
      
      usdPerUnit = 1 / totalTokens;
    } else if (!body.usdPerUnit) {
      return NextResponse.json(
        { success: false, message: "Either provide usdPerUnit or totalTokens" },
        { status: 400 }
      );
    }

    // Create token with calculated usdPerUnit
    const token = await Token.create({
      name: body.name,
      symbol: body.symbol,
      slug: body.slug,
      usdPerUnit: usdPerUnit,
      sortOrder: body.sortOrder || 0,
      isActive: body.isActive !== false,
    });

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
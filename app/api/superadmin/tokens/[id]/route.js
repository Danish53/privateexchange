import Token from "@/lib/models/Token";
import { NextResponse } from "next/server";

export async function PUT(req, { params }) {
    try {

        const { id } = params;
        const body = await req.json();

        // Calculate usdPerUnit from totalTokens (1 USD / totalTokens) if provided
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
          // For updates, if no usdPerUnit and no totalTokens, keep existing value
          const existingToken = await Token.findById(id);
          if (existingToken) {
            usdPerUnit = existingToken.usdPerUnit;
          }
        }

        const updatedToken = await Token.findByIdAndUpdate(
            id,
            {
                name: body.name,
                symbol: body.symbol,
                slug: body.slug,
                usdPerUnit: usdPerUnit,
                sortOrder: body.sortOrder,
                isActive: body.isActive,
            },
            { new: true }
        );

        if (!updatedToken) {
            return NextResponse.json(
                { success: false, message: "Token not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Token updated successfully",
            data: updatedToken,
        });
    } catch (error) {
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}


export async function DELETE(req, { params }) {
    try {

        const { id } = params;

        // const deleted = await Token.findByIdAndDelete(id);
        const deleted = await Token.findByIdAndUpdate(id, { isActive: false });
        if (!deleted) {
            return NextResponse.json(
                { success: false, message: "Token not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Token deleted successfully",
        });
    } catch (error) {
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}
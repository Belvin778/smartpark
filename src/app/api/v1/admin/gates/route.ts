import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUserFromRequest } from "@/lib/auth";
import { CreateGateSchema } from "@/lib/validators";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const facilityId = searchParams.get("facilityId");

    const gates = await db.parkingGate.findMany({
      where: facilityId ? { facilityId } : undefined,
      include: { facility: true },
      orderBy: { code: "asc" },
    });

    return NextResponse.json({ success: true, gates });
  } catch (err) {
    console.error("List gates error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = CreateGateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const gate = await db.parkingGate.create({
      data: parsed.data,
    });

    return NextResponse.json({ success: true, gate }, { status: 201 });
  } catch (err) {
    console.error("Create gate error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

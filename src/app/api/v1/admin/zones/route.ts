import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUserFromRequest } from "@/lib/auth";
import { CreateZoneSchema } from "@/lib/validators";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const facilityId = searchParams.get("facilityId");

    const zones = await db.parkingZone.findMany({
      where: facilityId ? { facilityId } : undefined,
      include: { facility: true, spaces: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, zones });
  } catch (err) {
    console.error("List zones error:", err);
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
    const parsed = CreateZoneSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const zone = await db.parkingZone.create({
      data: parsed.data,
    });

    return NextResponse.json({ success: true, zone }, { status: 201 });
  } catch (err) {
    console.error("Create zone error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

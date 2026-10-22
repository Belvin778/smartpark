import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUserFromRequest } from "@/lib/auth";
import { CreateFacilitySchema } from "@/lib/validators";
import { recordAuditLog } from "@/lib/services/audit.service";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
    }

    const facilities = await db.parkingFacility.findMany({
      include: {
        zones: true,
        gates: true,
        _count: {
          select: { sessions: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, facilities });
  } catch (err) {
    console.error("List facilities error:", err);
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
    const parsed = CreateFacilitySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, code, address, totalCapacity, hourlyRate } = parsed.data;

    // Check unique code
    const existing = await db.parkingFacility.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `Facility with code ${code} already exists.` },
        { status: 409 }
      );
    }

    const facility = await db.parkingFacility.create({
      data: {
        name,
        code: code.toUpperCase(),
        address,
        totalCapacity,
        hourlyRate,
        currentOccupancy: 0,
        status: "ACTIVE",
      },
    });

    // Default entry & exit gates
    await db.parkingGate.createMany({
      data: [
        { facilityId: facility.id, name: `${name} Gate 1 (Entry)`, code: `${facility.code}-G1`, gateType: "ENTRY" },
        { facilityId: facility.id, name: `${name} Gate 2 (Exit)`, code: `${facility.code}-G2`, gateType: "EXIT" },
      ],
    });

    await recordAuditLog({
      actorId: user.id,
      action: "FACILITY_CREATED",
      entityType: "ParkingFacility",
      entityId: facility.id,
      metadata: { name, code, totalCapacity },
      ipAddress: req.headers.get("x-forwarded-for"),
    });

    return NextResponse.json({ success: true, facility }, { status: 201 });
  } catch (err) {
    console.error("Create facility error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

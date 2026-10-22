import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUserFromRequest } from "@/lib/auth";
import { CreateVehicleSchema, normalizePlate } from "@/lib/validators";
import { issueQRCredential } from "@/lib/services/qr.service";
import { recordAuditLog } from "@/lib/services/audit.service";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");

    let whereClause: Record<string, unknown> = {};

    // If vehicle owner, only their vehicles
    if (user.role === "VEHICLE_OWNER") {
      whereClause.ownerId = user.id;
    }

    if (search) {
      const normalizedSearch = normalizePlate(search);
      whereClause.OR = [
        { normalizedPlate: { contains: normalizedSearch } },
        { displayPlate: { contains: search } },
        { make: { contains: search } },
        { model: { contains: search } },
      ];
    }

    const vehicles = await db.vehicle.findMany({
      where: whereClause,
      include: {
        owner: {
          select: { id: true, fullName: true, email: true },
        },
        qrCredentials: {
          where: { status: "ACTIVE" },
          take: 1,
          orderBy: { createdAt: "desc" },
        },
        parkingSessions: {
          where: { status: "ACTIVE" },
          include: { facility: true },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      vehicles: vehicles.map((v) => ({
        ...v,
        activeCredential: v.qrCredentials[0] || null,
        currentParkingSession: v.parkingSessions[0] || null,
      })),
    });
  } catch (err) {
    console.error("List vehicles error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = CreateVehicleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { plate, vehicleType, make, model, color } = parsed.data;
    const normalized = normalizePlate(plate);

    // Validate regional plate format (e.g. at least 3 alphanumeric chars)
    if (normalized.length < 3) {
      return NextResponse.json(
        { success: false, error: "License plate must contain at least 3 alphanumeric characters" },
        { status: 400 }
      );
    }

    // Check duplicate active plate
    const existing = await db.vehicle.findUnique({
      where: { normalizedPlate: normalized },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `Vehicle with plate "${plate}" is already registered in the system.` },
        { status: 409 }
      );
    }

    // Create vehicle
    const vehicle = await db.vehicle.create({
      data: {
        ownerId: user.id,
        normalizedPlate: normalized,
        displayPlate: plate.trim().toUpperCase(),
        vehicleType,
        make: make?.trim() || null,
        model: model?.trim() || null,
        color: color?.trim() || null,
        status: "ACTIVE",
      },
    });

    // Automatically issue the first cryptographic QR credential
    const { credential, rawToken } = await issueQRCredential(vehicle.id, user.id);

    await recordAuditLog({
      actorId: user.id,
      action: "VEHICLE_REGISTERED",
      entityType: "Vehicle",
      entityId: vehicle.id,
      metadata: { plate: vehicle.displayPlate, type: vehicle.vehicleType },
      ipAddress: req.headers.get("x-forwarded-for"),
    });

    return NextResponse.json(
      {
        success: true,
        vehicle,
        credential,
        rawToken, // Sent to client for immediate rendering/downloading
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Register vehicle error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

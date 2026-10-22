import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUserFromRequest } from "@/lib/auth";
import { issueQRCredential } from "@/lib/services/qr.service";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const vehicle = await db.vehicle.findUnique({ where: { id: params.id } });
    if (!vehicle) {
      return NextResponse.json({ success: false, error: "Vehicle not found" }, { status: 404 });
    }

    if (user.role === "VEHICLE_OWNER" && vehicle.ownerId !== user.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // Issue new QR credential (revokes previous one)
    const { credential, rawToken } = await issueQRCredential(vehicle.id, user.id);

    return NextResponse.json({
      success: true,
      credential,
      rawToken, // Sent to owner's client to render the new QR code
      message: "New QR credential generated successfully",
    });
  } catch (err) {
    console.error("Generate QR error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const vehicle = await db.vehicle.findUnique({
      where: { id: params.id },
      include: {
        owner: { select: { fullName: true, email: true } },
        qrCredentials: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!vehicle) {
      return NextResponse.json({ success: false, error: "Vehicle not found" }, { status: 404 });
    }

    if (user.role === "VEHICLE_OWNER" && vehicle.ownerId !== user.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const activeCredential = vehicle.qrCredentials.find((c) => c.status === "ACTIVE") || null;

    return NextResponse.json({
      success: true,
      vehicle: {
        id: vehicle.id,
        displayPlate: vehicle.displayPlate,
        vehicleType: vehicle.vehicleType,
        make: vehicle.make,
        model: vehicle.model,
        owner: vehicle.owner,
      },
      activeCredential,
      allCredentials: vehicle.qrCredentials,
    });
  } catch (err) {
    console.error("Get QR error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

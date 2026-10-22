import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUserFromRequest } from "@/lib/auth";
import { RevokeQRSchema } from "@/lib/validators";
import { revokeQRCredential } from "@/lib/services/qr.service";

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

    const body = await req.json();
    const parsed = RevokeQRSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Find the currently active credential for this vehicle
    const activeCred = await db.qRCredential.findFirst({
      where: { vehicleId: vehicle.id, status: "ACTIVE" },
    });

    if (!activeCred) {
      return NextResponse.json(
        { success: false, error: "No active QR credential to revoke" },
        { status: 400 }
      );
    }

    const revoked = await revokeQRCredential(activeCred.id, parsed.data.reason, user.id);

    return NextResponse.json({
      success: true,
      credential: revoked,
      message: "QR credential revoked successfully. Scans with this QR code will now be rejected.",
    });
  } catch (err) {
    console.error("Revoke QR error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

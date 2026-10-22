import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth";
import { processParkingEntry } from "@/lib/services/parking.service";
import { normalizePlate } from "@/lib/validators";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req);
    // Parking entry can be triggered by Operator, Admin, or Gate Device API key
    if (!user || (user.role !== "OPERATOR" && user.role !== "ADMIN")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Operator or Admin access required to operate parking entry" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { qrToken, plate, facilityId, gateId, zoneId, idempotencyKey, notes } = body;

    if (!facilityId) {
      return NextResponse.json(
        { success: false, error: "Parking facility ID is required" },
        { status: 400 }
      );
    }

    if (!qrToken && !plate) {
      return NextResponse.json(
        { success: false, error: "QR token or license plate is required" },
        { status: 400 }
      );
    }

    const normalizedPlate = plate ? normalizePlate(plate) : undefined;

    const result = await processParkingEntry({
      qrToken,
      normalizedPlate,
      facilityId,
      gateId,
      zoneId,
      operatorId: user.id,
      idempotencyKey,
      notes,
    });

    if (!result.success) {
      // Choose appropriate HTTP status code
      const status =
        result.code === "FACILITY_FULL"
          ? 409
          : result.code === "ALREADY_PARKED"
          ? 409
          : result.code === "INVALID_CREDENTIAL"
          ? 400
          : result.code === "VEHICLE_NOT_FOUND"
          ? 404
          : 400;

      return NextResponse.json(result, { status });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error("Parking entry error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

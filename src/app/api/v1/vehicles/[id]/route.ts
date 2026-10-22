import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUserFromRequest } from "@/lib/auth";
import { UpdateVehicleSchema } from "@/lib/validators";
import { recordAuditLog } from "@/lib/services/audit.service";

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
        owner: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
        qrCredentials: {
          orderBy: { createdAt: "desc" },
        },
        parkingSessions: {
          orderBy: { entryTime: "desc" },
          take: 20,
          include: {
            facility: true,
            entryGate: true,
            exitGate: true,
          },
        },
      },
    });

    if (!vehicle) {
      return NextResponse.json({ success: false, error: "Vehicle not found" }, { status: 404 });
    }

    // Role check: Only vehicle owner or Operator/Admin can view
    if (user.role === "VEHICLE_OWNER" && vehicle.ownerId !== user.id) {
      return NextResponse.json({ success: false, error: "Forbidden: Not your vehicle" }, { status: 403 });
    }

    const activeCredential = vehicle.qrCredentials.find((c) => c.status === "ACTIVE") || null;
    const currentSession = vehicle.parkingSessions.find((s) => s.status === "ACTIVE") || null;

    return NextResponse.json({
      success: true,
      vehicle: {
        ...vehicle,
        activeCredential,
        currentSession,
      },
    });
  } catch (err) {
    console.error("Get vehicle error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
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
    const parsed = UpdateVehicleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await db.vehicle.update({
      where: { id: params.id },
      data: parsed.data,
    });

    await recordAuditLog({
      actorId: user.id,
      action: "VEHICLE_UPDATED",
      entityType: "Vehicle",
      entityId: updated.id,
      metadata: parsed.data,
      ipAddress: req.headers.get("x-forwarded-for"),
    });

    return NextResponse.json({ success: true, vehicle: updated });
  } catch (err) {
    console.error("Update vehicle error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
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

    // Check if vehicle has an active parking session
    const activeSession = await db.parkingSession.findFirst({
      where: { vehicleId: params.id, status: "ACTIVE" },
    });

    if (activeSession) {
      return NextResponse.json(
        { success: false, error: "Cannot delete vehicle while it is parked in an active session." },
        { status: 400 }
      );
    }

    await db.vehicle.delete({ where: { id: params.id } });

    await recordAuditLog({
      actorId: user.id,
      action: "VEHICLE_DELETED",
      entityType: "Vehicle",
      entityId: params.id,
      metadata: { plate: vehicle.displayPlate },
    });

    return NextResponse.json({ success: true, message: "Vehicle deleted successfully" });
  } catch (err) {
    console.error("Delete vehicle error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

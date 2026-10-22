import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUserFromRequest } from "@/lib/auth";
import { normalizePlate } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const facilityId = searchParams.get("facilityId");
    const status = searchParams.get("status");
    const plate = searchParams.get("plate");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    // If Vehicle Owner, only view sessions for vehicles they own
    if (user.role === "VEHICLE_OWNER") {
      where.vehicle = { ownerId: user.id };
    }

    if (facilityId) {
      where.facilityId = facilityId;
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (plate) {
      const normalized = normalizePlate(plate);
      where.vehicle = {
        ...(where.vehicle as object),
        OR: [
          { normalizedPlate: { contains: normalized } },
          { displayPlate: { contains: plate.trim() } },
        ],
      };
    }

    if (dateFrom || dateTo) {
      where.entryTime = {};
      if (dateFrom) {
        (where.entryTime as Record<string, unknown>).gte = new Date(dateFrom);
      }
      if (dateTo) {
        const d = new Date(dateTo);
        d.setHours(23, 59, 59, 999);
        (where.entryTime as Record<string, unknown>).lte = d;
      }
    }

    const [total, sessions] = await Promise.all([
      db.parkingSession.count({ where }),
      db.parkingSession.findMany({
        where,
        skip,
        take: limit,
        orderBy: { entryTime: "desc" },
        include: {
          vehicle: {
            include: {
              owner: {
                select: { id: true, fullName: true, email: true },
              },
            },
          },
          facility: {
            select: { id: true, name: true, code: true, hourlyRate: true },
          },
          entryGate: {
            select: { id: true, name: true, code: true },
          },
          exitGate: {
            select: { id: true, name: true, code: true },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      sessions,
    });
  } catch (err) {
    console.error("List sessions error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

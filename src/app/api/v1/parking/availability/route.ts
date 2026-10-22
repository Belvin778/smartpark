import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const facilityId = searchParams.get("facilityId");

    const facilities = await db.parkingFacility.findMany({
      where: facilityId ? { id: facilityId } : undefined,
      include: {
        zones: {
          select: {
            id: true,
            name: true,
            code: true,
            capacity: true,
            currentOccupancy: true,
            status: true,
          },
        },
        gates: {
          select: {
            id: true,
            name: true,
            code: true,
            gateType: true,
            status: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const data = facilities.map((f) => {
      const availableSpaces = Math.max(0, f.totalCapacity - f.currentOccupancy);
      const occupancyRate = f.totalCapacity > 0 ? Math.round((f.currentOccupancy / f.totalCapacity) * 100) : 0;
      const isFull = f.currentOccupancy >= f.totalCapacity;

      return {
        id: f.id,
        name: f.name,
        code: f.code,
        address: f.address,
        totalCapacity: f.totalCapacity,
        currentOccupancy: f.currentOccupancy,
        availableSpaces,
        occupancyRate,
        isFull,
        hourlyRate: f.hourlyRate,
        status: f.status,
        zones: f.zones.map((z) => ({
          ...z,
          availableSpaces: Math.max(0, z.capacity - z.currentOccupancy),
          occupancyRate: z.capacity > 0 ? Math.round((z.currentOccupancy / z.capacity) * 100) : 0,
        })),
        gates: f.gates,
      };
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      facilities: data,
    });
  } catch (err) {
    console.error("Availability error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

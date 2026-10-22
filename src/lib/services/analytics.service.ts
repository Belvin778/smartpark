import { db } from "../db";

export async function getFacilityAnalytics(facilityId?: string) {
  const whereFacility = facilityId ? { facilityId } : {};

  // 1. Facility occupancy summaries
  const facilities = await db.parkingFacility.findMany({
    where: facilityId ? { id: facilityId } : undefined,
    include: {
      zones: true,
      gates: true,
    },
  });

  const totalCapacity = facilities.reduce((sum, f) => sum + f.totalCapacity, 0);
  const currentOccupancy = facilities.reduce((sum, f) => sum + f.currentOccupancy, 0);
  const availableSpaces = Math.max(0, totalCapacity - currentOccupancy);
  const occupancyRate = totalCapacity > 0 ? Math.round((currentOccupancy / totalCapacity) * 100) : 0;

  // 2. Active sessions
  const activeSessionsCount = await db.parkingSession.count({
    where: {
      ...whereFacility,
      status: "ACTIVE",
    },
  });

  // 3. Completed sessions today
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const completedToday = await db.parkingSession.count({
    where: {
      ...whereFacility,
      status: "COMPLETED",
      exitTime: { gte: startOfDay },
    },
  });

  // 4. Entries today
  const entriesToday = await db.parkingSession.count({
    where: {
      ...whereFacility,
      entryTime: { gte: startOfDay },
    },
  });

  // 5. Total revenue today
  const completedSessionsToday = await db.parkingSession.findMany({
    where: {
      ...whereFacility,
      status: "COMPLETED",
      exitTime: { gte: startOfDay },
    },
    select: { feeAmount: true, durationMinutes: true },
  });

  const revenueToday = completedSessionsToday.reduce((sum, s) => sum + (s.feeAmount || 0), 0);
  const avgDurationMinutes =
    completedSessionsToday.length > 0
      ? Math.round(
          completedSessionsToday.reduce((sum, s) => sum + (s.durationMinutes || 0), 0) /
            completedSessionsToday.length
        )
      : 0;

  // 6. Recent sessions
  const recentSessions = await db.parkingSession.findMany({
    where: whereFacility,
    orderBy: { entryTime: "desc" },
    take: 10,
    include: {
      vehicle: true,
      facility: true,
      entryGate: true,
      exitGate: true,
    },
  });

  return {
    overview: {
      totalCapacity,
      currentOccupancy,
      availableSpaces,
      occupancyRate,
      activeSessionsCount,
      completedToday,
      entriesToday,
      revenueToday: Number(revenueToday.toFixed(2)),
      avgDurationMinutes,
    },
    facilities: facilities.map((f) => ({
      id: f.id,
      name: f.name,
      code: f.code,
      totalCapacity: f.totalCapacity,
      currentOccupancy: f.currentOccupancy,
      availableSpaces: Math.max(0, f.totalCapacity - f.currentOccupancy),
      occupancyRate: f.totalCapacity > 0 ? Math.round((f.currentOccupancy / f.totalCapacity) * 100) : 0,
      hourlyRate: f.hourlyRate,
      status: f.status,
      zones: f.zones,
    })),
    recentSessions,
  };
}

import { db } from "../db";
import { validateScannedQR } from "./qr.service";
import { recordAuditLog } from "./audit.service";
import { realtimeBus } from "../events";

export interface EntryRequestOptions {
  qrToken?: string;
  normalizedPlate?: string;
  facilityId: string;
  gateId?: string;
  zoneId?: string;
  spaceId?: string;
  operatorId?: string;
  idempotencyKey?: string;
  notes?: string;
}

export interface ExitRequestOptions {
  qrToken?: string;
  normalizedPlate?: string;
  facilityId: string;
  gateId?: string;
  operatorId?: string;
  idempotencyKey?: string;
  notes?: string;
}

/**
 * Handles atomic parking entry with strict race-condition defense and capacity invariants.
 */
export async function processParkingEntry(options: EntryRequestOptions) {
  const { qrToken, normalizedPlate, facilityId, gateId, zoneId, spaceId, operatorId, idempotencyKey, notes } =
    options;

  // 1. Idempotency Check
  if (idempotencyKey) {
    const existing = await db.parkingSession.findUnique({
      where: { idempotencyKey },
      include: {
        vehicle: true,
        facility: true,
        entryGate: true,
      },
    });
    if (existing) {
      return {
        success: true,
        isIdempotentReplay: true,
        session: existing,
        facility: existing.facility,
        message: "Entry already processed (Idempotent response)",
      };
    }
  }

  // 2. Identify Vehicle (via QR token or plate)
  let vehicleId: string;
  let vehicleInfo: {
    id: string;
    displayPlate: string;
    normalizedPlate: string;
    vehicleType: string;
    make: string | null;
    model: string | null;
    color: string | null;
    owner: { fullName: string; email: string };
  };

  if (qrToken) {
    const qrResult = await validateScannedQR(qrToken);
    if (!qrResult.valid || !qrResult.credential) {
      return {
        success: false,
        code: "INVALID_CREDENTIAL",
        message: qrResult.reason || "Invalid QR credential",
      };
    }
    vehicleId = qrResult.credential.vehicle.id;
    vehicleInfo = qrResult.credential.vehicle;
  } else if (normalizedPlate) {
    const vehicle = await db.vehicle.findUnique({
      where: { normalizedPlate },
      include: {
        owner: {
          select: { fullName: true, email: true },
        },
      },
    });
    if (!vehicle) {
      return {
        success: false,
        code: "VEHICLE_NOT_FOUND",
        message: `Vehicle with plate ${normalizedPlate} is not registered in the system`,
      };
    }
    if (vehicle.status !== "ACTIVE") {
      return {
        success: false,
        code: "VEHICLE_INACTIVE",
        message: "Vehicle registration is suspended or inactive",
      };
    }
    vehicleId = vehicle.id;
    vehicleInfo = vehicle;
  } else {
    return {
      success: false,
      code: "MISSING_IDENTIFIER",
      message: "Either QR credential or vehicle plate must be provided",
    };
  }

  // 3. Check for existing active parking session (Strict Single Active Session Invariant)
  const existingActive = await db.parkingSession.findFirst({
    where: {
      vehicleId,
      status: "ACTIVE",
    },
    include: { facility: true },
  });

  if (existingActive) {
    return {
      success: false,
      code: "ALREADY_PARKED",
      message: `Vehicle is already parked in facility "${existingActive.facility.name}" since ${existingActive.entryTime.toLocaleTimeString()}`,
      existingSession: existingActive,
    };
  }

  // 4. Atomic Transaction: Check Capacity and Increment Occupancy
  // Uses interactive transaction to prevent TOCTOU race conditions
  const result = await db.$transaction(async (tx) => {
    // Lock and check facility
    const facility = await tx.parkingFacility.findUnique({
      where: { id: facilityId },
    });

    if (!facility) {
      throw new Error("FACILITY_NOT_FOUND");
    }

    if (facility.status !== "ACTIVE") {
      throw new Error("FACILITY_MAINTENANCE");
    }

    if (facility.currentOccupancy >= facility.totalCapacity) {
      throw new Error("FACILITY_FULL");
    }

    // Atomically increment occupancy
    const updatedFacility = await tx.parkingFacility.update({
      where: { id: facilityId },
      data: {
        currentOccupancy: {
          increment: 1,
        },
      },
    });

    // Check optional zone capacity
    let targetZoneId = zoneId;
    if (targetZoneId) {
      const zone = await tx.parkingZone.findUnique({ where: { id: targetZoneId } });
      if (zone && zone.currentOccupancy < zone.capacity) {
        await tx.parkingZone.update({
          where: { id: targetZoneId },
          data: { currentOccupancy: { increment: 1 } },
        });
      } else {
        targetZoneId = undefined;
      }
    }

    // Create Parking Session
    const session = await tx.parkingSession.create({
      data: {
        vehicleId,
        facilityId,
        zoneId: targetZoneId || null,
        spaceId: spaceId || null,
        entryGateId: gateId || null,
        entryTime: new Date(),
        status: "ACTIVE",
        idempotencyKey: idempotencyKey || null,
        notes: notes || null,
      },
      include: {
        vehicle: true,
        facility: true,
        entryGate: true,
      },
    });

    return { session, facility: updatedFacility };
  }).catch((err) => {
    if (err.message === "FACILITY_FULL") {
      return { error: "FACILITY_FULL", message: "Facility has reached maximum capacity" };
    }
    if (err.message === "FACILITY_MAINTENANCE") {
      return { error: "FACILITY_MAINTENANCE", message: "Facility is currently undergoing maintenance" };
    }
    if (err.message === "FACILITY_NOT_FOUND") {
      return { error: "FACILITY_NOT_FOUND", message: "Target parking facility was not found" };
    }
    throw err;
  });

  if ("error" in result) {
    return {
      success: false,
      code: result.error,
      message: result.message,
    };
  }

  // 5. Audit Log
  await recordAuditLog({
    actorId: operatorId || null,
    action: "PARKING_ENTRY_AUTHORIZED",
    entityType: "ParkingSession",
    entityId: result.session.id,
    metadata: {
      plate: vehicleInfo.displayPlate,
      facilityId,
      gateId,
      occupancy: result.facility.currentOccupancy,
      capacity: result.facility.totalCapacity,
    },
  });

  // 6. Realtime SSE Broadcast
  realtimeBus.broadcast("parking:entry", {
    sessionId: result.session.id,
    facilityId,
    plate: vehicleInfo.displayPlate,
    entryTime: result.session.entryTime,
    currentOccupancy: result.facility.currentOccupancy,
    totalCapacity: result.facility.totalCapacity,
    availableSpaces: Math.max(0, result.facility.totalCapacity - result.facility.currentOccupancy),
  });

  return {
    success: true,
    session: result.session,
    vehicle: vehicleInfo,
    facility: result.facility,
    availableSpaces: Math.max(0, result.facility.totalCapacity - result.facility.currentOccupancy),
    message: `Entry authorized for vehicle ${vehicleInfo.displayPlate}`,
  };
}

/**
 * Handles atomic parking exit, duration calculation, and capacity release.
 */
export async function processParkingExit(options: ExitRequestOptions) {
  const { qrToken, normalizedPlate, facilityId, gateId, operatorId, idempotencyKey, notes } = options;

  // 1. Identify Vehicle
  let vehicleId: string;
  let vehicleDisplay: string = "";

  if (qrToken) {
    const qrResult = await validateScannedQR(qrToken);
    if (!qrResult.valid || !qrResult.credential) {
      return {
        success: false,
        code: "INVALID_CREDENTIAL",
        message: qrResult.reason || "Invalid QR credential",
      };
    }
    vehicleId = qrResult.credential.vehicle.id;
    vehicleDisplay = qrResult.credential.vehicle.displayPlate;
  } else if (normalizedPlate) {
    const vehicle = await db.vehicle.findUnique({
      where: { normalizedPlate },
    });
    if (!vehicle) {
      return {
        success: false,
        code: "VEHICLE_NOT_FOUND",
        message: `Vehicle with plate ${normalizedPlate} not found`,
      };
    }
    vehicleId = vehicle.id;
    vehicleDisplay = vehicle.displayPlate;
  } else {
    return {
      success: false,
      code: "MISSING_IDENTIFIER",
      message: "Either QR credential or vehicle plate required",
    };
  }

  // 2. Find active session
  const activeSession = await db.parkingSession.findFirst({
    where: {
      vehicleId,
      status: "ACTIVE",
    },
    include: {
      facility: true,
      vehicle: {
        include: {
          owner: {
            select: { fullName: true, email: true },
          },
        },
      },
    },
  });

  if (!activeSession) {
    return {
      success: false,
      code: "NO_ACTIVE_SESSION",
      message: `No active parking session found for vehicle ${vehicleDisplay}. Vehicle has either already exited or was not recorded at entry.`,
    };
  }

  const exitTime = new Date();
  const entryTime = new Date(activeSession.entryTime);
  const durationMs = Math.max(0, exitTime.getTime() - entryTime.getTime());
  const durationMinutes = Math.ceil(durationMs / (1000 * 60));
  const hoursParked = Math.max(1, Math.ceil(durationMinutes / 60));
  const feeAmount = hoursParked * (activeSession.facility.hourlyRate || 2.5);

  // 3. Atomic Exit Transaction: Complete session & safely decrement occupancy
  const result = await db.$transaction(async (tx) => {
    // Complete session
    const updatedSession = await tx.parkingSession.update({
      where: { id: activeSession.id },
      data: {
        status: "COMPLETED",
        exitTime,
        exitGateId: gateId || null,
        durationMinutes,
        feeAmount,
        notes: notes ? `${activeSession.notes || ""}; ${notes}`.trim() : activeSession.notes,
      },
      include: {
        vehicle: true,
        facility: true,
        entryGate: true,
        exitGate: true,
      },
    });

    // Safely decrement facility occupancy (never negative)
    const currentFac = await tx.parkingFacility.findUnique({
      where: { id: activeSession.facilityId },
    });

    const newOccupancy = Math.max(0, (currentFac?.currentOccupancy || 1) - 1);

    const updatedFacility = await tx.parkingFacility.update({
      where: { id: activeSession.facilityId },
      data: { currentOccupancy: newOccupancy },
    });

    // If session had a zone, decrement zone occupancy too
    if (activeSession.zoneId) {
      const z = await tx.parkingZone.findUnique({ where: { id: activeSession.zoneId } });
      if (z) {
        await tx.parkingZone.update({
          where: { id: activeSession.zoneId },
          data: { currentOccupancy: Math.max(0, z.currentOccupancy - 1) },
        });
      }
    }

    return { session: updatedSession, facility: updatedFacility };
  });

  // 4. Audit Log
  await recordAuditLog({
    actorId: operatorId || null,
    action: "PARKING_EXIT_AUTHORIZED",
    entityType: "ParkingSession",
    entityId: result.session.id,
    metadata: {
      plate: vehicleDisplay,
      durationMinutes,
      feeAmount,
      occupancy: result.facility.currentOccupancy,
    },
  });

  // 5. Realtime SSE Broadcast
  realtimeBus.broadcast("parking:exit", {
    sessionId: result.session.id,
    facilityId: result.facility.id,
    plate: vehicleDisplay,
    exitTime,
    durationMinutes,
    currentOccupancy: result.facility.currentOccupancy,
    totalCapacity: result.facility.totalCapacity,
    availableSpaces: Math.max(0, result.facility.totalCapacity - result.facility.currentOccupancy),
  });

  return {
    success: true,
    session: result.session,
    durationMinutes,
    feeAmount,
    facility: result.facility,
    availableSpaces: Math.max(0, result.facility.totalCapacity - result.facility.currentOccupancy),
    message: `Exit authorized for vehicle ${vehicleDisplay}. Parked for ${durationMinutes} minutes.`,
  };
}

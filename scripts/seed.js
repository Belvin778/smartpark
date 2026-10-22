const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const prisma = new PrismaClient();

function generateToken() {
  const randomHex = crypto.randomBytes(32).toString("hex");
  const timestamp = Date.now().toString(36);
  return `SPK_${timestamp}_${randomHex}`;
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token.trim()).digest("hex");
}

function createTokenPreview(token) {
  return `${token.substring(0, 7)}***${token.substring(token.length - 4)}`;
}

async function main() {
  console.log("🌱 Starting SmartPark database seeding...");

  // Clear existing records in reverse dependency order
  await prisma.auditLog.deleteMany({});
  await prisma.parkingSession.deleteMany({});
  await prisma.reservation.deleteMany({});
  await prisma.qRCredential.deleteMany({});
  await prisma.parkingSpace.deleteMany({});
  await prisma.parkingGate.deleteMany({});
  await prisma.parkingZone.deleteMany({});
  await prisma.vehicle.deleteMany({});
  await prisma.parkingFacility.deleteMany({});
  await prisma.user.deleteMany({});

  const defaultPasswordHash = await bcrypt.hash("Password123!", 10);

  // 1. Users
  console.log("Creating users...");
  const adminUser = await prisma.user.create({
    data: {
      fullName: "System Administrator",
      email: "admin@smartpark.com",
      passwordHash: defaultPasswordHash,
      role: "ADMIN",
      phone: "+1-555-0100",
    },
  });

  const operatorUser = await prisma.user.create({
    data: {
      fullName: "John Gate Operator",
      email: "operator@smartpark.com",
      passwordHash: defaultPasswordHash,
      role: "OPERATOR",
      phone: "+1-555-0101",
    },
  });

  const sarahUser = await prisma.user.create({
    data: {
      fullName: "Sarah Jenkins",
      email: "sarah.owner@example.com",
      passwordHash: defaultPasswordHash,
      role: "VEHICLE_OWNER",
      phone: "+1-555-0102",
    },
  });

  const michaelUser = await prisma.user.create({
    data: {
      fullName: "Michael Chang",
      email: "michael.owner@example.com",
      passwordHash: defaultPasswordHash,
      role: "VEHICLE_OWNER",
      phone: "+1-555-0103",
    },
  });

  // 2. Facilities
  console.log("Creating facilities...");
  const downtownFacility = await prisma.parkingFacility.create({
    data: {
      name: "Downtown Metro Garage",
      code: "FAC-DT01",
      address: "100 Financial Way, City Center",
      timezone: "America/New_York",
      totalCapacity: 40,
      currentOccupancy: 3,
      hourlyRate: 3.5,
      status: "ACTIVE",
    },
  });

  const airportFacility = await prisma.parkingFacility.create({
    data: {
      name: "Airport Express Terminal Parking",
      code: "FAC-AP02",
      address: "Terminal 2 Parkway, Airport District",
      timezone: "America/New_York",
      totalCapacity: 100,
      currentOccupancy: 8,
      hourlyRate: 5.0,
      status: "ACTIVE",
    },
  });

  // 3. Zones & Spaces for Downtown
  console.log("Creating zones and spaces...");
  const zoneA = await prisma.parkingZone.create({
    data: {
      facilityId: downtownFacility.id,
      name: "Ground Floor - Standard & EV",
      code: "Z-GF-01",
      capacity: 20,
      currentOccupancy: 2,
      status: "ACTIVE",
    },
  });

  const zoneB = await prisma.parkingZone.create({
    data: {
      facilityId: downtownFacility.id,
      name: "Level 1 - Executive & Accessible",
      code: "Z-L1-02",
      capacity: 20,
      currentOccupancy: 1,
      status: "ACTIVE",
    },
  });

  // 4. Gates
  console.log("Creating gates...");
  const gateEntry1 = await prisma.parkingGate.create({
    data: {
      facilityId: downtownFacility.id,
      name: "North Barrier (Entry 1)",
      code: "DT-G-N1",
      gateType: "ENTRY",
      status: "ONLINE",
    },
  });

  const gateExit1 = await prisma.parkingGate.create({
    data: {
      facilityId: downtownFacility.id,
      name: "South Barrier (Exit 1)",
      code: "DT-G-S1",
      gateType: "EXIT",
      status: "ONLINE",
    },
  });

  const gateExpress = await prisma.parkingGate.create({
    data: {
      facilityId: downtownFacility.id,
      name: "VIP / Express Gate",
      code: "DT-G-VIP",
      gateType: "BIDIRECTIONAL",
      status: "ONLINE",
    },
  });

  // Airport Gates
  await prisma.parkingGate.create({
    data: {
      facilityId: airportFacility.id,
      name: "Terminal 2 Main Entry",
      code: "AP-G-T2E",
      gateType: "ENTRY",
      status: "ONLINE",
    },
  });

  await prisma.parkingGate.create({
    data: {
      facilityId: airportFacility.id,
      name: "Terminal 2 Main Exit",
      code: "AP-G-T2X",
      gateType: "EXIT",
      status: "ONLINE",
    },
  });

  // 5. Vehicles & QR Credentials
  console.log("Registering vehicles and issuing QR credentials...");
  const vehiclesData = [
    {
      ownerId: sarahUser.id,
      displayPlate: "ABC-1234",
      normalizedPlate: "ABC1234",
      vehicleType: "CAR",
      make: "Tesla",
      model: "Model 3",
      color: "Pearl White",
    },
    {
      ownerId: sarahUser.id,
      displayPlate: "XYZ-9876",
      normalizedPlate: "XYZ9876",
      vehicleType: "CAR",
      make: "BMW",
      model: "330i",
      color: "Black Sapphire",
    },
    {
      ownerId: michaelUser.id,
      displayPlate: "MOTO-555",
      normalizedPlate: "MOTO555",
      vehicleType: "MOTORCYCLE",
      make: "Ducati",
      model: "Monster",
      color: "Ducati Red",
    },
    {
      ownerId: michaelUser.id,
      displayPlate: "VAN-7788",
      normalizedPlate: "VAN7788",
      vehicleType: "VAN",
      make: "Ford",
      model: "Transit",
      color: "Ingot Silver",
    },
  ];

  const createdVehicles = [];
  const tokenPairs = [];

  for (const vData of vehiclesData) {
    const vehicle = await prisma.vehicle.create({ data: vData });
    createdVehicles.push(vehicle);

    // Issue QR credential
    const rawToken = generateToken();
    const tokenHash = hashToken(rawToken);
    const rawTokenPreview = createTokenPreview(rawToken);

    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const qr = await prisma.qRCredential.create({
      data: {
        vehicleId: vehicle.id,
        tokenHash,
        rawTokenPreview,
        status: "ACTIVE",
        expiresAt,
      },
    });

    tokenPairs.push({
      plate: vehicle.displayPlate,
      rawToken,
      qrId: qr.id,
      vehicleId: vehicle.id,
    });
  }

  // 6. Active Parking Session for Vehicle 1 (ABC-1234)
  console.log("Creating active parking session...");
  const activeEntryTime = new Date(Date.now() - 45 * 60 * 1000); // entered 45 minutes ago

  await prisma.parkingSession.create({
    data: {
      vehicleId: createdVehicles[0].id,
      facilityId: downtownFacility.id,
      zoneId: zoneA.id,
      entryGateId: gateEntry1.id,
      entryTime: activeEntryTime,
      status: "ACTIVE",
      notes: "Regular entry via QR scan",
    },
  });

  // 7. Historical Completed Sessions
  console.log("Creating completed parking sessions for analytics...");
  const pastSessions = [
    {
      vehicleId: createdVehicles[1].id,
      facilityId: downtownFacility.id,
      zoneId: zoneB.id,
      entryGateId: gateEntry1.id,
      exitGateId: gateExit1.id,
      minutesAgo: 180,
      duration: 75,
      fee: 7.0,
    },
    {
      vehicleId: createdVehicles[2].id,
      facilityId: downtownFacility.id,
      zoneId: zoneA.id,
      entryGateId: gateExpress.id,
      exitGateId: gateExit1.id,
      minutesAgo: 320,
      duration: 120,
      fee: 7.0,
    },
    {
      vehicleId: createdVehicles[3].id,
      facilityId: downtownFacility.id,
      zoneId: zoneA.id,
      entryGateId: gateEntry1.id,
      exitGateId: gateExit1.id,
      minutesAgo: 600,
      duration: 210,
      fee: 14.0,
    },
  ];

  for (const s of pastSessions) {
    const entryTime = new Date(Date.now() - s.minutesAgo * 60 * 1000);
    const exitTime = new Date(entryTime.getTime() + s.duration * 60 * 1000);

    await prisma.parkingSession.create({
      data: {
        vehicleId: s.vehicleId,
        facilityId: s.facilityId,
        zoneId: s.zoneId,
        entryGateId: s.entryGateId,
        exitGateId: s.exitGateId,
        entryTime,
        exitTime,
        durationMinutes: s.duration,
        feeAmount: s.fee,
        status: "COMPLETED",
      },
    });
  }

  // 8. Audit Logs
  console.log("Generating initial audit logs...");
  await prisma.auditLog.create({
    data: {
      actorId: adminUser.id,
      action: "SYSTEM_INITIALIZED",
      entityType: "System",
      metadata: JSON.stringify({ version: "1.0.0", seeded: true }),
    },
  });

  console.log("\n✅ Database seeding complete!");
  console.log("-----------------------------------------------------");
  console.log("🔑 Demo Accounts:");
  console.log("1. Admin:         admin@smartpark.com      / Password123!");
  console.log("2. Operator:      operator@smartpark.com   / Password123!");
  console.log("3. Vehicle Owner: sarah.owner@example.com  / Password123!");
  console.log("4. Vehicle Owner: michael.owner@example.com / Password123!");
  console.log("-----------------------------------------------------");
  console.log("🚗 Seeded Vehicles & Active QR Tokens:");
  tokenPairs.forEach((tp) => {
    console.log(`Plate: ${tp.plate} -> QR Token: ${tp.rawToken}`);
  });
  console.log("-----------------------------------------------------\n");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

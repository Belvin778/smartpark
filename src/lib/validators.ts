import { z } from "zod";

// Vehicle registration plate normalization: uppercase, remove non-alphanumeric chars
export function normalizePlate(plate: string): string {
  return plate.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

export const RegisterSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
  role: z.enum(["ADMIN", "OPERATOR", "VEHICLE_OWNER"]).default("VEHICLE_OWNER"),
});

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const CreateVehicleSchema = z.object({
  plate: z
    .string()
    .min(2, "License plate must be at least 2 characters")
    .max(15, "License plate too long"),
  vehicleType: z.enum(["CAR", "MOTORCYCLE", "VAN", "EV", "TRUCK"]).default("CAR"),
  make: z.string().optional(),
  model: z.string().optional(),
  color: z.string().optional(),
});

export const UpdateVehicleSchema = z.object({
  make: z.string().optional(),
  model: z.string().optional(),
  color: z.string().optional(),
  status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
});

export const RevokeQRSchema = z.object({
  reason: z.string().min(3, "Revocation reason must be specified"),
});

export const ParkingEntrySchema = z.object({
  qrToken: z.string().min(5, "Valid QR token is required"),
  facilityId: z.string().uuid("Valid facility ID required"),
  gateId: z.string().uuid("Valid gate ID required").optional(),
  zoneId: z.string().uuid().optional(),
  idempotencyKey: z.string().optional(),
});

export const ParkingExitSchema = z.object({
  qrToken: z.string().min(5, "Valid QR token is required"),
  facilityId: z.string().uuid("Valid facility ID required"),
  gateId: z.string().uuid("Valid gate ID required").optional(),
  idempotencyKey: z.string().optional(),
});

export const ManualEntrySchema = z.object({
  plate: z.string().min(2, "License plate required"),
  facilityId: z.string().uuid("Valid facility ID required"),
  gateId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export const ManualExitSchema = z.object({
  plate: z.string().min(2, "License plate required"),
  facilityId: z.string().uuid("Valid facility ID required"),
  gateId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export const CreateFacilitySchema = z.object({
  name: z.string().min(2, "Facility name required"),
  code: z.string().min(2, "Facility code required"),
  address: z.string().min(3, "Address required"),
  totalCapacity: z.number().int().positive("Capacity must be positive"),
  hourlyRate: z.number().nonnegative("Hourly rate must be non-negative").default(2.5),
});

export const CreateZoneSchema = z.object({
  facilityId: z.string().uuid(),
  name: z.string().min(2),
  code: z.string().min(1),
  capacity: z.number().int().positive(),
});

export const CreateGateSchema = z.object({
  facilityId: z.string().uuid(),
  name: z.string().min(2),
  code: z.string().min(1),
  gateType: z.enum(["ENTRY", "EXIT", "BIDIRECTIONAL"]).default("BIDIRECTIONAL"),
});

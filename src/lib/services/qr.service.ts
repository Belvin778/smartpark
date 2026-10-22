import crypto from "crypto";
import { db } from "../db";
import { recordAuditLog } from "./audit.service";

/**
 * Generates a high-entropy 256-bit cryptographically secure token.
 * Format: SPK_<timestamp>_<64-char-hex>
 */
export function generateSecureRawToken(): string {
  const randomHex = crypto.randomBytes(32).toString("hex");
  const timestamp = Date.now().toString(36);
  return `SPK_${timestamp}_${randomHex}`;
}

/**
 * Computes SHA-256 hash of the token to store in the database.
 */
export function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken.trim()).digest("hex");
}

/**
 * Generates an opaque preview of the token for operator UI (e.g., SPK_***4a2b).
 */
export function createTokenPreview(rawToken: string): string {
  if (rawToken.length <= 12) return "SPK_***";
  return `${rawToken.substring(0, 7)}***${rawToken.substring(rawToken.length - 4)}`;
}

/**
 * Issues a new QR credential for a vehicle, automatically revoking previous active credentials.
 */
export async function issueQRCredential(vehicleId: string, actorId?: string, expiresDays = 365) {
  const rawToken = generateSecureRawToken();
  const tokenHash = hashToken(rawToken);
  const rawTokenPreview = createTokenPreview(rawToken);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresDays);

  // Revoke any previous active credentials
  await db.qRCredential.updateMany({
    where: {
      vehicleId,
      status: "ACTIVE",
    },
    data: {
      status: "REVOKED",
      revokedAt: new Date(),
      revocationReason: "Superseded by new credential issuance",
    },
  });

  const credential = await db.qRCredential.create({
    data: {
      vehicleId,
      tokenHash,
      rawTokenPreview,
      status: "ACTIVE",
      expiresAt,
    },
    include: {
      vehicle: {
        include: {
          owner: {
            select: {
              fullName: true,
              email: true,
            },
          },
        },
      },
    },
  });

  await recordAuditLog({
    actorId,
    action: "QR_CREDENTIAL_ISSUED",
    entityType: "QRCredential",
    entityId: credential.id,
    metadata: { vehicleId, preview: rawTokenPreview },
  });

  return {
    credential,
    rawToken, // Sent to client ONLY upon creation to render QR
  };
}

/**
 * Validates a scanned QR token against authoritative database records.
 */
export async function validateScannedQR(rawToken: string) {
  const tokenHash = hashToken(rawToken);

  const credential = await db.qRCredential.findUnique({
    where: { tokenHash },
    include: {
      vehicle: {
        include: {
          owner: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },
        },
      },
    },
  });

  if (!credential) {
    return { valid: false, reason: "QR credential not recognized" };
  }

  if (credential.status === "REVOKED") {
    return {
      valid: false,
      reason: `QR credential has been revoked (${credential.revocationReason || "Compromised / Replaced"})`,
      credential,
    };
  }

  if (credential.status === "EXPIRED" || (credential.expiresAt && credential.expiresAt < new Date())) {
    return { valid: false, reason: "QR credential has expired", credential };
  }

  if (credential.vehicle.status !== "ACTIVE") {
    return { valid: false, reason: "Vehicle is currently suspended or inactive", credential };
  }

  return { valid: true, credential };
}

/**
 * Revokes a QR credential.
 */
export async function revokeQRCredential(credentialId: string, reason: string, actorId?: string) {
  const updated = await db.qRCredential.update({
    where: { id: credentialId },
    data: {
      status: "REVOKED",
      revokedAt: new Date(),
      revocationReason: reason,
    },
  });

  await recordAuditLog({
    actorId,
    action: "QR_CREDENTIAL_REVOKED",
    entityType: "QRCredential",
    entityId: credentialId,
    metadata: { reason },
  });

  return updated;
}

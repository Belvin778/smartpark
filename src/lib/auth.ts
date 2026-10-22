import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import { db } from "./db";

const JWT_SECRET = process.env.JWT_SECRET || "smartpark-fallback-secret-key-32chars";

export interface TokenPayload {
  userId: string;
  email: string;
  role: "ADMIN" | "OPERATOR" | "VEHICLE_OWNER";
  fullName: string;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}

export function signToken(payload: TokenPayload, expiresIn: string | number = "7d"): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return jwt.sign(payload, JWT_SECRET, { expiresIn: expiresIn as any });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export async function getAuthUserFromRequest(req: NextRequest) {
  // Check Authorization Bearer header first
  const authHeader = req.headers.get("authorization");
  let token: string | null = null;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  } else {
    // Check cookies
    const cookieToken = req.cookies.get("smartpark_token")?.value;
    if (cookieToken) {
      token = cookieToken;
    }
  }

  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const user = await db.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      phone: true,
    },
  });

  return user;
}

export function hasRequiredRole(userRole: string, allowedRoles: string[]): boolean {
  return allowedRoles.includes(userRole);
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { RegisterSchema } from "@/lib/validators";
import { hashPassword, signToken } from "@/lib/auth";
import { recordAuditLog } from "@/lib/services/audit.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { fullName, email, password, phone, role } = parsed.data;

    // Check email uniqueness
    const existing = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "An account with this email address already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await db.user.create({
      data: {
        fullName,
        email: email.toLowerCase(),
        passwordHash,
        phone: phone || null,
        role,
      },
    });

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role as "ADMIN" | "OPERATOR" | "VEHICLE_OWNER",
      fullName: user.fullName,
    });

    await recordAuditLog({
      actorId: user.id,
      action: "USER_REGISTERED",
      entityType: "User",
      entityId: user.id,
      metadata: { role: user.role },
      ipAddress: req.headers.get("x-forwarded-for"),
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      token,
    });

    // Set cookie
    response.cookies.set("smartpark_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

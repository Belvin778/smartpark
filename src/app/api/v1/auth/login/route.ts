import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { LoginSchema } from "@/lib/validators";
import { comparePassword, signToken } from "@/lib/auth";
import { recordAuditLog } from "@/lib/services/audit.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role as "ADMIN" | "OPERATOR" | "VEHICLE_OWNER",
      fullName: user.fullName,
    });

    await recordAuditLog({
      actorId: user.id,
      action: "USER_LOGGED_IN",
      entityType: "User",
      entityId: user.id,
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

    response.cookies.set("smartpark_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

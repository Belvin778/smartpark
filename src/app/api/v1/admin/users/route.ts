import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUserFromRequest } from "@/lib/auth";
import { recordAuditLog } from "@/lib/services/audit.service";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
    }

    const users = await db.user.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        _count: {
          select: { vehicles: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, users });
  } catch (err) {
    console.error("List users error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { userId, role } = body;

    if (!userId || !["ADMIN", "OPERATOR", "VEHICLE_OWNER"].includes(role)) {
      return NextResponse.json({ success: false, error: "Invalid userId or role" }, { status: 400 });
    }

    const updated = await db.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, fullName: true, email: true, role: true },
    });

    await recordAuditLog({
      actorId: user.id,
      action: "USER_ROLE_CHANGED",
      entityType: "User",
      entityId: userId,
      metadata: { newRole: role },
      ipAddress: req.headers.get("x-forwarded-for"),
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (err) {
    console.error("Update user role error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

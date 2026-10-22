import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth";
import { getFacilityAnalytics } from "@/lib/services/analytics.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const facilityId = searchParams.get("facilityId") || undefined;

    const data = await getFacilityAnalytics(facilityId);

    return NextResponse.json({ success: true, ...data });
  } catch (err) {
    console.error("Admin analytics error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

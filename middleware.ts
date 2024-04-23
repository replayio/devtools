import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/recording")) {
    const dashboardUrl = process.env.DASHBOARD_URL || "https://replay-dashboard.vercel.app";
    return NextResponse.rewrite(`${dashboardUrl}${url.pathname}${url.search}`);
  }
}

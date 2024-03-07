import type { NextRequest } from "next/server";
import { NextResponse, userAgent } from "next/server";

export function middleware(request: NextRequest) {
  const { ua } = userAgent(request);

  if (isMobile(ua)) {
    // If the user is attempting to visit Replay on a mobile device for the first time,
    // show them a message that it has not been optimized for mobile
    // If they have already confirmed this message (detectable via a cookie) then let them through
    const cookie = request.cookies.get("mobile-warning-dismissed");
    if (cookie == null && request.nextUrl.pathname !== "/mobile-warning") {
      return NextResponse.redirect(new URL("/mobile-warning", request.url));
    }
  }
}

// Which routes should this middleware respond to
export const config = {
  matcher: ["/", "/team/:path*", "/recording/:path*"],
};

function isMobile(ua: string) {
  return /iP(hone|ad|od)/.test(ua) || /Android/.test(ua);
}

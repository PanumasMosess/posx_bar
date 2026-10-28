import { NextResponse } from "next/server";
import { auth } from "./lib/auth";

export default auth((req) => {
  const contentEncoding = req.headers.get("content-encoding")?.toLowerCase();

  if (contentEncoding && contentEncoding.includes("br")) {
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "Unknown IP";

    const requestedPath = req.nextUrl.pathname;
    const timestamp = new Date().toLocaleString("th-TH", {
      timeZone: "Asia/Bangkok",
    });

    console.warn(`[SECURITY ALERT] 🛑 บล็อกความพยายามใช้ช่องโหว่ Node2Shell`);
    console.warn(`  - เวลา: ${timestamp}`);
    console.warn(`  - IP ผู้ต้องสงสัย: ${clientIp}`);
    console.warn(`  - เส้นทางเป้าหมาย: ${requestedPath}`);

    return new NextResponse(
      JSON.stringify({
        success: false,
        message:
          "Brotli compression is temporarily disabled for security reasons.",
      }),
      {
        status: 400,
        headers: { "content-type": "application/json" },
      },
    );
  }

  const isServerAction = req.headers.has("next-action");
  if (isServerAction) {
    return NextResponse.next();
  }

  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  const isAuthRoute = pathname === "/";

  const isProtectedRoute =
    pathname.startsWith("/pos") ||
    pathname.startsWith("/kitchen") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/reports");

  if (pathname === "/login") {
    const homeUrl = new URL("/", req.nextUrl.origin);
    return NextResponse.redirect(homeUrl);
  }

  if (!isLoggedIn && isProtectedRoute) {
    const homeUrl = new URL("/", req.nextUrl.origin);
    return NextResponse.redirect(homeUrl);
  }

  if (isLoggedIn && isAuthRoute) {
    const posUrl = new URL("/pos", req.nextUrl.origin);
    return NextResponse.redirect(posUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

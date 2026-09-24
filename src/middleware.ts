import { NextResponse } from "next/server";
import { auth } from "./lib/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  // 1. หน้าแรก / เป็นหน้า Auth หลัก
  const isAuthRoute = pathname === "/";

  // 2. กำหนดหน้าปลายทางที่ต้องการป้องกัน (Protected Routes)
  const isProtectedRoute =
    pathname.startsWith("/pos") ||
    pathname.startsWith("/kitchen") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/reports");

  // 🎯 กรณีผู้ใช้กดเข้า /login โดยตรง ให้ redirect กลับไปหน้าแรก / เสมอ
  if (pathname === "/login") {
    const homeUrl = new URL("/", req.nextUrl.origin);
    return NextResponse.redirect(homeUrl);
  }

  // 🎯 กรณีที่ยังไม่ได้เข้าสู่ระบบ แล้วพยายามเข้า Protected Routes ให้ไปหน้าแรก /
  if (!isLoggedIn && isProtectedRoute) {
    const homeUrl = new URL("/", req.nextUrl.origin);
    return NextResponse.redirect(homeUrl);
  }

  // 🎯 กรณีที่เข้าสู่ระบบแล้ว แต่พยายามจะเปิดหน้าแรก / ซ้ำ ให้เด้งไป /pos ทันที
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

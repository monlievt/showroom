import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("nur_mobil_session");

  let session: { role?: string; investorId?: string } | null = null;
  if (sessionCookie?.value) {
    try {
      const decoded = JSON.parse(
        Buffer.from(sessionCookie.value, "base64").toString("utf-8")
      );
      session = JSON.parse(decoded.payload);
    } catch {
      session = null;
    }
  }

  // 1. Proteksi Rute /admin/* -> Hanya untuk Owner (role: ADMIN)
  if (pathname.startsWith("/admin")) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (session.role !== "ADMIN") {
      // Jika investor mencoba buka halaman admin, alihkan ke portal investor
      return NextResponse.redirect(new URL("/investor", request.url));
    }
  }

  // 2. Proteksi Rute /investor/* -> Untuk Investor atau Admin
  if (pathname.startsWith("/investor")) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. Jika sudah login dan membuka /login -> redirect sesuai peran
  if (pathname === "/login" && session) {
    if (session.role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", request.url));
    } else {
      return NextResponse.redirect(new URL("/investor", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/investor/:path*", "/login"],
};

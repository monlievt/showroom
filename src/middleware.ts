import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);

  // Verifikasi kriptografis signature HMAC session untuk mencegah Cookie Spoofing / Privilege Escalation
  let session = sessionCookie?.value ? verifySessionToken(sessionCookie.value) : null;

  // Jika cookie ada tapi tidak valid (dicoba dipalsukan/spoofed), hapus cookie tersebut
  const isCookieTampered = Boolean(sessionCookie?.value && !session);

  // 1. Proteksi Rute /admin/* -> Berdasarkan Role-Based Access Control (RBAC)
  if (pathname.startsWith("/admin")) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      const res = NextResponse.redirect(loginUrl);
      if (isCookieTampered) {
        res.cookies.delete(SESSION_COOKIE_NAME);
      }
      return res;
    }

    // Role INVESTOR tidak diizinkan membuka modul admin internal
    if (session.role === "INVESTOR") {
      return NextResponse.redirect(new URL("/investor", request.url));
    }

    // Role SALES: Hanya diizinkan melihat katalog stok mobil (/admin/inventory)
    if (session.role === "SALES") {
      const isAllowedSalesPath = pathname.startsWith("/admin/inventory");
      if (!isAllowedSalesPath) {
        return NextResponse.redirect(
          new URL("/admin/inventory?status=READY_FOR_SALE", request.url)
        );
      }
    }

    // Role STAFF_ADMIN: Akses operasional garasi & penjualan
    // DILARANG membuka: kas besar bank (/admin/finance), bagi hasil investor (/admin/investors), pengaturan sistem & backup (/admin/settings)
    if (session.role === "STAFF_ADMIN") {
      const isRestrictedForStaff =
        pathname.startsWith("/admin/investors") ||
        (pathname.startsWith("/admin/finance") &&
          !pathname.startsWith("/admin/finance/assets")) ||
        pathname.startsWith("/admin/settings");

      if (isRestrictedForStaff) {
        return NextResponse.redirect(new URL("/admin/inventory", request.url));
      }
    }
  }

  // 2. Proteksi Rute /investor/* -> Untuk Investor atau Admin/Owner
  if (pathname.startsWith("/investor")) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      const res = NextResponse.redirect(loginUrl);
      if (isCookieTampered) {
        res.cookies.delete(SESSION_COOKIE_NAME);
      }
      return res;
    }
  }

  // 3. Jika sudah login dan membuka /login -> redirect sesuai peran
  if (pathname === "/login" && session) {
    if (session.role === "OWNER" || session.role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", request.url));
    } else if (session.role === "STAFF_ADMIN") {
      return NextResponse.redirect(new URL("/admin/inventory", request.url));
    } else if (session.role === "SALES") {
      return NextResponse.redirect(
        new URL("/admin/inventory?status=READY_FOR_SALE", request.url)
      );
    } else {
      return NextResponse.redirect(new URL("/investor", request.url));
    }
  }

  const response = NextResponse.next();

  // Bersihkan cookie palsu jika ada pada rute publik
  if (isCookieTampered) {
    response.cookies.delete(SESSION_COOKIE_NAME);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/investor/:path*", "/login"],
};

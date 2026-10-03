import type { NextConfig } from "next";

const securityHeaders = [
  // 1. Cegah Clickjacking dan embedding ilegal (Anti-Defacement)
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  // 2. Cegah MIME-Sniffing (Cegah browser menganggap file gambar/text sebagai executable script)
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  // 3. Paksa HTTPS & HSTS (Mencegah Man-In-The-Middle & SSL Stripping)
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // 4. Batasi kebocoran URL asal referer ke domain eksternal
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  // 5. Matikan fitur sensitif peramban yang tidak dibutuhkan showroom
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  // 6. Proteksi XSS peramban
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  // 7. Kontrol DNS Prefetching
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  // 8. Content Security Policy (CSP) bertingkat
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com https://www.gstatic.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://generativelanguage.googleapis.com https://api.telegram.org",
      "frame-ancestors 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false, // Sembunyikan header 'X-Powered-By: Next.js' agar hacker tidak mudah mengetahui stack versi teknologi
  devIndicators: {
    position: "bottom-right",
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

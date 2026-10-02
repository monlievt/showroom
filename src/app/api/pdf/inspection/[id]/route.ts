import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import fs from "fs";
import path from "path";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { InspectionPdfDocument } from "@/components/pdf/InspectionPdfDocument";
import { rateLimiter, getClientIp } from "@/lib/security/rate-limiter";

// Direktori cache lokal untuk dokumen PDF 8 halaman
const PDF_CACHE_DIR = path.join(process.cwd(), ".cache", "pdf");

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // ── 0. VALIDASI FORMAT PARAMETER ID & RATE LIMITING ──
    if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
      return NextResponse.json({ error: "Format ID inspeksi tidak valid" }, { status: 400 });
    }

    const clientIp = getClientIp(req.headers);
    const limitCheck = rateLimiter.check(`pdf:${clientIp}`, 40, 60 * 1000);
    if (!limitCheck.allowed) {
      return new NextResponse("Batas frekuensi unduh tercapai. Silakan coba kembali dalam beberapa saat.", {
        status: 429,
        headers: { "Retry-After": String(limitCheck.retryAfterSec) },
      });
    }

    // ── 1. PROTEKSI ANTI-HOTLINKING & ANTI-EMBEDDING ──
    const referer = req.headers.get("referer");
    const host = req.headers.get("host") || "";
    const secFetchDest = req.headers.get("sec-fetch-dest");

    if (referer) {
      try {
        const refUrl = new URL(referer);
        const isSameOrigin =
          refUrl.host === host ||
          refUrl.hostname === "localhost" ||
          refUrl.hostname === "127.0.0.1";

        // Blokir jika website pihak ketiga mencoba menyematkan PDF ke dalam iframe/embed mereka
        if (!isSameOrigin && (secFetchDest === "iframe" || secFetchDest === "embed" || secFetchDest === "object")) {
          return new NextResponse(
            "Penyematan dokumen PDF secara eksternal tidak diizinkan. Silakan akses portal resmi Showroom Nur Mobil.",
            {
              status: 403,
              headers: { "Content-Type": "text/plain; charset=utf-8" },
            }
          );
        }
      } catch {
        // Abaikan parsing error
      }
    }

    // ── 2. QUERY DATABASE ──
    const inspection = await prisma.inspection.findUnique({
      where: { id },
      include: {
        vehicle: {
          include: {
            photos: true,
          },
        },
        panels: true,
        photos: true,
      },
    });

    if (!inspection || !inspection.vehicle) {
      return NextResponse.json(
        { error: "Lembar inspeksi tidak ditemukan" },
        { status: 404 }
      );
    }

    const plateClean = inspection.vehicle.plateNumber.replace(/\s+/g, "");
    const filename = `inspeksi-${plateClean}-v${inspection.version}.pdf`;

    // ── 3. SISTEM FILE CACHE (OPTIMASI CPU & PERFORMA) ──
    const timeKey = inspection.inspectedAt ? new Date(inspection.inspectedAt).getTime() : 0;
    const cacheFileName = `${inspection.id}-v${inspection.version}-${timeKey}.pdf`;
    const cacheFilePath = path.join(PDF_CACHE_DIR, cacheFileName);

    const headers = {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      "X-Frame-Options": "SAMEORIGIN",
      "Content-Security-Policy": "frame-ancestors 'self'",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "X-PDF-Cache": "MISS",
    };

    // Jika file sudah pernah di-generate sebelumnya dan masih valid di disk:
    if (fs.existsSync(cacheFilePath)) {
      try {
        const cachedBuffer = fs.readFileSync(cacheFilePath);
        return new Response(cachedBuffer as any, {
          headers: {
            ...headers,
            "X-PDF-Cache": "HIT",
          },
        });
      } catch (readErr) {
        console.warn("Gagal membaca cache PDF disk, melakukan generate ulang:", readErr);
      }
    }

    // ── 4. GENERATE QR CODE VERIFIKASI DIGITAL ──
    const hostWithProto = req.nextUrl.origin || `http://${host}`;
    const publicVerificationUrl = `${hostWithProto}/inspeksi/${inspection.id}`;
    let qrCodeUrl: string | null = null;

    try {
      qrCodeUrl = await QRCode.toDataURL(publicVerificationUrl, {
        margin: 1,
        width: 140,
        errorCorrectionLevel: "M",
        color: {
          dark: "#1C1917",
          light: "#FFFFFF",
        },
      });
    } catch (qrErr) {
      console.warn("Gagal membuat QR Code verifikasi PDF:", qrErr);
    }

    // ── 5. RENDER PDF 8 HALAMAN DENGAN REACT-PDF ──
    const buffer = await renderToBuffer(
      React.createElement(InspectionPdfDocument, {
        inspection,
        vehicle: inspection.vehicle,
        qrCodeUrl,
      }) as any
    );

    // ── 6. SIMPAN KE DISK CACHE SECARA ASINKRON ──
    try {
      if (!fs.existsSync(PDF_CACHE_DIR)) {
        fs.mkdirSync(PDF_CACHE_DIR, { recursive: true });
      }
      fs.writeFileSync(cacheFilePath, buffer);
    } catch (writeErr) {
      console.warn("Gagal menyimpan cache PDF disk:", writeErr);
    }

    return new Response(buffer as any, {
      headers,
    });
  } catch (error: any) {
    console.error("Gagal men-generate PDF inspeksi:", error);
    return NextResponse.json(
      { error: error.message || "Gagal membuat dokumen PDF" },
      { status: 500 }
    );
  }
}

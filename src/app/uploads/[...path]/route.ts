import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import fs from "fs";
import path from "path";

// MIME types mapping untuk file yang diizinkan sistem
const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".pdf": "application/pdf",
  ".svg": "image/svg+xml",
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: segments } = await params;

    if (!segments || segments.length === 0) {
      return new NextResponse("File tidak ditemukan", { status: 404 });
    }

    // Rekonstruksi sub-path dari URL
    const relativeSubPath = segments.join("/");

    // Sanitasi anti-path traversal
    if (relativeSubPath.includes("..") || relativeSubPath.includes("\\")) {
      return new NextResponse("Akses dilarang (Path traversal terdeteksi)", { status: 403 });
    }

    // Lokasi utama: public/uploads/...
    const uploadsRoot = path.resolve(process.cwd(), "public", "uploads");
    let targetPath = path.resolve(uploadsRoot, relativeSubPath);

    // Pastikan path target tetap berada dalam folder root uploads
    if (!targetPath.startsWith(uploadsRoot)) {
      return new NextResponse("Akses dilarang", { status: 403 });
    }

    // Fallback: Jika tidak ada di public/uploads, cek direktori uploads di root project
    if (!fs.existsSync(targetPath)) {
      const altUploadsRoot = path.resolve(process.cwd(), "uploads");
      const altPath = path.resolve(altUploadsRoot, relativeSubPath);
      if (altPath.startsWith(altUploadsRoot) && fs.existsSync(altPath)) {
        targetPath = altPath;
      } else {
        return new NextResponse("File bukti / lampiran tidak ditemukan pada server", { status: 404 });
      }
    }

    const fileStat = await stat(targetPath);
    if (fileStat.isDirectory()) {
      return new NextResponse("Path adalah direktori, bukan file", { status: 400 });
    }

    const ext = path.extname(targetPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    const fileBuffer = await readFile(targetPath);

    const filename = path.basename(targetPath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(fileStat.size),
        // Cache selama 1 hari di browser, revalidate jika berubah
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("Error serving upload file:", error);
    return new NextResponse("Terjadi kesalahan saat memuat file", { status: 500 });
  }
}

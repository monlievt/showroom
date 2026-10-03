import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { rateLimiter, getClientIp } from "@/lib/security/rate-limiter";

// Whitelist ekstensi dan MIME type yang diizinkan (Cegah upload script, HTML, SVG XSS, shell, dll)
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".pdf"]);

// Validasi Magic Bytes (file signature) untuk memastikan isi file asli bukan rekayasa ekstensi
function validateMagicBytes(buffer: Buffer): { valid: boolean; ext?: string } {
  if (buffer.length < 12) return { valid: false };

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, ext: ".jpg" };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { valid: true, ext: ".png" };
  }

  // WebP: RIFF .... WEBP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { valid: true, ext: ".webp" };
  }

  // PDF: %PDF (25 50 44 46)
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return { valid: true, ext: ".pdf" };
  }

  return { valid: false };
}

export async function POST(req: NextRequest) {
  try {
    // ── 1. PROTEKSI RATE LIMITING (CEGAH SPAM / DISK FLOODING) ──
    const clientIp = getClientIp(req.headers);
    const limitCheck = rateLimiter.check(`upload:${clientIp}`, 30, 60 * 1000);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: `Terlalu banyak permintaan unggah. Coba lagi dalam ${limitCheck.retryAfterSec} detik.` },
        { status: 429, headers: { "Retry-After": String(limitCheck.retryAfterSec) } }
      );
    }

    // ── 2. AUTENTIKASI & OTORISASI (HANYA STAFF / ADMIN / OWNER) ──
    const session = await getSession();
    if (!session || !["OWNER", "ADMIN", "STAFF_ADMIN"].includes(session.role)) {
      return NextResponse.json(
        { error: "Akses ditolak: Anda tidak memiliki wewenang untuk mengunggah file." },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const vehicleId = formData.get("vehicleId") as string | null;
    const investorId = formData.get("investorId") as string | null;
    const saleId = formData.get("saleId") as string | null;
    const referenceId = (formData.get("referenceId") as string | null) || "general";
    const uploadType = formData.get("uploadType") as "PHOTO" | "DOCUMENT" | "RECEIPT" | "TRANSFER_PROOF" | null;
    const category = (formData.get("category") as string) || "CONDITION_INTAKE";
    const docType = (formData.get("docType") as string) || "STNK_SCAN";

    if (!file || !uploadType) {
      return NextResponse.json(
        { error: "Parameter tidak lengkap (file dan uploadType wajib diisi)." },
        { status: 400 }
      );
    }

    // ── 3. SANITASI INPUT & CEGAH PATH TRAVERSAL ──
    const safeIdPattern = /^[a-zA-Z0-9_-]+$/;
    const targetId = vehicleId || investorId || saleId || referenceId;
    if (targetId && !safeIdPattern.test(targetId)) {
      return NextResponse.json(
        { error: "Format ID referensi tidak valid." },
        { status: 400 }
      );
    }

    const validUploadTypes = ["PHOTO", "DOCUMENT", "RECEIPT", "TRANSFER_PROOF"];
    if (!validUploadTypes.includes(uploadType)) {
      return NextResponse.json(
        { error: "Jenis uploadType tidak diizinkan." },
        { status: 400 }
      );
    }

    // Validasi ukuran: max 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Ukuran file maksimal 10MB." },
        { status: 400 }
      );
    }

    // ── 4. VALIDASI MIME TYPE & EXTENSION (CEGAH DEFACEMENT / WEBSHELL / XSS) ──
    const claimedExt = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(claimedExt)) {
      return NextResponse.json(
        { error: `Format file '${claimedExt}' dilarang demi keamanan sistem. Hanya JPG, PNG, WEBP, dan PDF yang diizinkan.` },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
      return NextResponse.json(
        { error: `Tipe MIME '${file.type}' tidak diizinkan.` },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ── 5. VALIDASI MAGIC BYTES (FILE SIGNATURE ASLI) ──
    const signatureCheck = validateMagicBytes(buffer);
    if (!signatureCheck.valid) {
      return NextResponse.json(
        { error: "Integritas file ditolak: Header biner file tidak cocok dengan format gambar atau PDF yang sah." },
        { status: 400 }
      );
    }

    // ── 6. PENYIMPANAN AMAN DENGAN FILENAME TERISOLASI ──
    let relativeDir = `/uploads/general/${uploadType.toLowerCase()}`;
    if (vehicleId) {
      relativeDir = `/uploads/vehicles/${vehicleId}/${uploadType.toLowerCase()}`;
    } else if (investorId) {
      relativeDir = `/uploads/investors/${investorId}/transfer_proofs`;
    } else if (saleId) {
      relativeDir = `/uploads/sales/${saleId}/receipts`;
    } else if (referenceId && referenceId !== "general") {
      relativeDir = `/uploads/finance/${referenceId}/${uploadType.toLowerCase()}`;
    }
    const baseUploadRoot = path.join(process.cwd(), "public", "uploads");
    const uploadDir = path.resolve(process.cwd(), "public", relativeDir.replace(/^\//, ""));

    // Pastikan folder target berada di dalam public/uploads (Anti-Path-Traversal)
    if (!uploadDir.startsWith(baseUploadRoot)) {
      return NextResponse.json(
        { error: "Direktori tujuan tidak valid." },
        { status: 400 }
      );
    }

    await mkdir(uploadDir, { recursive: true });

    // Nama file acak UUID kriptografis + ekstensi terverifikasi (Abaikan nama asli dari client)
    const secureExt = signatureCheck.ext || claimedExt;
    const randomSuffix = crypto.randomBytes(8).toString("hex");
    const filename = `${Date.now()}_${randomSuffix}${secureExt}`;
    const fullPath = path.resolve(uploadDir, filename);

    if (!fullPath.startsWith(uploadDir)) {
      return NextResponse.json({ error: "Path file tidak valid." }, { status: 400 });
    }

    await writeFile(fullPath, buffer);
    const fileUrl = `${relativeDir}/${filename}`;

    if (uploadType === "RECEIPT" || uploadType === "TRANSFER_PROOF") {
      return NextResponse.json({ success: true, fileUrl });
    }

    if (uploadType === "PHOTO") {
      if (!vehicleId) {
        return NextResponse.json({ error: "vehicleId wajib untuk tipe PHOTO." }, { status: 400 });
      }

      const tag = (formData.get("tag") as string) || null;
      const title = (formData.get("title") as string) || null;

      const validCategories = [
        "CONDITION_INTAKE",
        "CONDITION_BEFORE_REPAIR",
        "CONDITION_AFTER_REPAIR",
        "FINAL_LISTING",
        "DOCUMENT_PROOF",
      ];
      const safeCategory = validCategories.includes(category)
        ? category
        : "CONDITION_INTAKE";

      const photo = await prisma.vehiclePhoto.create({
        data: {
          vehicleId,
          category: safeCategory as any,
          tag: tag ? tag.slice(0, 100) : undefined,
          title: title ? title.slice(0, 200) : undefined,
          fileUrl,
        },
      });

      return NextResponse.json({ success: true, data: photo, fileUrl });
    } else {
      if (!vehicleId) {
        return NextResponse.json({ error: "vehicleId wajib untuk tipe DOCUMENT." }, { status: 400 });
      }

      const doc = await prisma.vehicleDocument.create({
        data: {
          vehicleId,
          type: docType as any,
          fileUrl,
          uploadedBy: session.fullName || "Admin",
        },
      });

      return NextResponse.json({ success: true, data: doc, fileUrl });
    }
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Gagal memproses file pada server." },
      { status: 500 }
    );
  }
}

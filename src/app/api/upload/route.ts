import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const vehicleId = formData.get("vehicleId") as string | null;
    const uploadType = formData.get("uploadType") as "PHOTO" | "DOCUMENT" | "RECEIPT" | null;
    const category = (formData.get("category") as string) || "CONDITION_INTAKE";
    const docType = (formData.get("docType") as string) || "STNK_SCAN";

    if (!file || !vehicleId || !uploadType) {
      return NextResponse.json(
        { error: "Parameter tidak lengkap (file, vehicleId, uploadType wajib diisi)." },
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

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Simpan ke disk lokal server: public/uploads/vehicles/{vehicleId}/{uploadType}
    const relativeDir = `/uploads/vehicles/${vehicleId}/${uploadType.toLowerCase()}`;
    const uploadDir = path.join(process.cwd(), "public", relativeDir);
    await mkdir(uploadDir, { recursive: true });

    const originalExt = path.extname(file.name) || ".jpg";
    const filename = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}${originalExt}`;
    const fullPath = path.join(uploadDir, filename);

    await writeFile(fullPath, buffer);
    const fileUrl = `${relativeDir}/${filename}`;

    if (uploadType === "RECEIPT") {
      return NextResponse.json({ success: true, fileUrl });
    }

    if (uploadType === "PHOTO") {
      const photo = await prisma.vehiclePhoto.create({
        data: {
          vehicleId,
          category: category as any,
          fileUrl,
        },
      });

      return NextResponse.json({ success: true, data: photo, fileUrl });
    } else {
      const doc = await prisma.vehicleDocument.create({
        data: {
          vehicleId,
          type: docType as any,
          fileUrl,
          uploadedBy: "Admin",
        },
      });

      return NextResponse.json({ success: true, data: doc, fileUrl });
    }
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal mengunggah file ke server." },
      { status: 500 }
    );
  }
}

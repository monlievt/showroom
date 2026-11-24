import { unlink } from "fs/promises";
import path from "path";
import prisma from "@/lib/prisma";

/**
 * Menghapus file fisik di folder public/uploads secara aman
 * hanya jika file berada di dalam direktori uploads dan tidak lagi direferensikan di tabel mana pun.
 */
export async function deleteUploadFileIfUnused(fileUrl?: string | null): Promise<boolean> {
  if (!fileUrl || !fileUrl.startsWith("/uploads/")) {
    return false;
  }

  try {
    const [
      photoCount,
      docCount,
      expenseCount,
      paymentCount,
      cashCount,
      ledgerCount,
      opExCount,
      assetCount,
    ] = await Promise.all([
      prisma.vehiclePhoto.count({ where: { fileUrl } }),
      prisma.vehicleDocument.count({ where: { fileUrl } }),
      prisma.expense.count({ where: { receiptUrl: { contains: fileUrl } } }),
      prisma.salePayment.count({ where: { proofUrl: { contains: fileUrl } } }),
      prisma.cashTransaction.count({ where: { proofUrl: { contains: fileUrl } } }),
      prisma.capitalLedger.count({ where: { proofUrl: { contains: fileUrl } } }),
      prisma.operationalExpense.count({ where: { receiptUrl: { contains: fileUrl } } }),
      prisma.showroomAsset.count({ where: { receiptUrl: { contains: fileUrl } } }),
    ]);

    const totalRefs =
      photoCount +
      docCount +
      expenseCount +
      paymentCount +
      cashCount +
      ledgerCount +
      opExCount +
      assetCount;

    if (totalRefs > 0) {
      return false;
    }

    const uploadsRoot = path.resolve(process.cwd(), "public", "uploads");
    const relativePath = fileUrl.replace(/^\/uploads\//, "");
    if (!relativePath || relativePath.includes("..") || relativePath.includes("\\")) {
      return false;
    }

    const fullPath = path.resolve(uploadsRoot, relativePath);
    if (!fullPath.startsWith(uploadsRoot)) {
      return false;
    }

    await unlink(fullPath);
    return true;
  } catch {
    // Abaikan jika file memang sudah tidak ada di disk
    return false;
  }
}

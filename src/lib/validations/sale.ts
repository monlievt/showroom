import { z } from "zod";

export const SaleChannelEnum = z.enum(["SHOWROOM", "DIRECT_CUSTOMER"]);

export const createSaleSchema = z.object({
  vehicleId: z.string().uuid("ID unit kendaraan tidak valid"),
  saleDate: z.coerce.date().default(() => new Date()),
  saleType: SaleChannelEnum.default("DIRECT_CUSTOMER"),
  sellingPrice: z.coerce.number().positive("Harga jual wajib lebih besar dari 0"),
  dueDate: z.coerce.date().optional().nullable(),
  // Data Pembeli (Buyer)
  buyerName: z.string().min(2, "Nama pembeli / showroom rekanan wajib diisi"),
  buyerPhone: z.string().optional().nullable(),
  buyerIsShowroom: z.boolean().default(false),
  buyerAddress: z.string().optional().nullable(),
  buyerNotes: z.string().optional().nullable(),
  // Pembayaran Awal / Tanda Jadi (Opsional saat deal)
  initialPaymentAmount: z.coerce.number().nonnegative().optional().default(0),
  initialPaymentMethod: z.string().default("TRANSFER"),
  tradeInVehicleId: z.string().uuid().optional().nullable(),
  initialPaymentNotes: z.string().optional().nullable(),
  // Serah Terima Fisik & Dokumen Legalitas (Opsional / Rekomendasi saat deal)
  handoverOdometer: z.coerce.number().nonnegative().optional().nullable(),
  handoverPhotoUrl: z.string().optional().nullable(),
  bastDocUrl: z.string().optional().nullable(),
  paymentReceiptUrl: z.string().optional().nullable(),
  buyerIdCardUrl: z.string().optional().nullable(),
  handoverChecklist: z.array(z.string()).optional().default([]),
  handoverNotes: z.string().optional().nullable(),
  // Komisi Makelar / Mediator (Jika Ada)
  brokerName: z.string().optional().nullable(),
  brokerFee: z.coerce.number().nonnegative().optional().nullable(),
}).refine((data) => {
  // Jika bukan pembayaran lunas 100% (skema Cash Tempo Garasi)
  const isTempo = (data.initialPaymentAmount || 0) < data.sellingPrice;
  if (isTempo) {
    const minDp = data.sellingPrice * 0.7;
    // DP wajib minimal 70%
    if ((data.initialPaymentAmount || 0) < minDp) {
      return false;
    }
  }
  return true;
}, {
  message: "Aturan Nur Mobil: Pembelian Cash Tempo wajib DP minimal 70% dari harga kesepakatan",
  path: ["initialPaymentAmount"],
}).refine((data) => {
  const isTempo = (data.initialPaymentAmount || 0) < data.sellingPrice;
  if (isTempo) {
    if (!data.dueDate) return false;
    const saleTime = new Date(data.saleDate).getTime();
    const dueTime = new Date(data.dueDate).getTime();
    const diffDays = Math.ceil((dueTime - saleTime) / (1000 * 60 * 60 * 24));
    // Tempo maksimal 30 hari (1 bulan)
    if (diffDays > 30 || diffDays < 0) {
      return false;
    }
  }
  return true;
}, {
  message: "Aturan Nur Mobil: Batas jatuh tempo Cash Tempo maksimal 30 hari (1 bulan)",
  path: ["dueDate"],
});

export type CreateSaleInput = z.input<typeof createSaleSchema>;


export const createSalePaymentSchema = z.object({
  saleId: z.string().uuid("ID transaksi penjualan tidak valid"),
  amount: z.coerce.number().positive("Nominal pembayaran harus lebih besar dari 0"),
  paidAt: z.coerce.date().default(() => new Date()),
  method: z.string().default("TRANSFER"), // "CASH", "TRANSFER", "TRADE_IN"
  tradeInVehicleId: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
  proofUrl: z.string().optional().nullable(),
});

export type CreateSalePaymentInput = z.input<typeof createSalePaymentSchema>;

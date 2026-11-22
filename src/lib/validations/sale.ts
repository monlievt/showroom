import { z } from "zod";

export const SaleChannelEnum = z.enum(["SHOWROOM", "DIRECT_CUSTOMER"]);

export const createSaleSchema = z.object({
  vehicleId: z.string().uuid("ID unit kendaraan tidak valid"),
  saleDate: z.coerce.date().default(() => new Date()),
  saleType: SaleChannelEnum.default("DIRECT_CUSTOMER"),
  sellingPrice: z.coerce.number().positive("Harga jual wajib lebih besar dari 0"),
  dueDate: z.coerce.date().optional().nullable(),
  // Data Pembeli (Buyer)
  buyerName: z.string().trim().min(2, "Nama pembeli / showroom rekanan wajib diisi"),
  buyerPhone: z.string().trim().optional().nullable(),
  buyerIsShowroom: z.boolean().default(false),
  buyerAddress: z.string().trim().optional().nullable(),
  buyerNotes: z.string().trim().optional().nullable(),
  // Pembayaran Awal / Tanda Jadi (Opsional saat deal)
  initialPaymentAmount: z.coerce.number().nonnegative().optional().default(0),
  initialPaymentMethod: z.string().default("TRANSFER"),
  tradeInVehicleId: z.string().uuid().optional().nullable(),
  initialPaymentNotes: z.string().optional().nullable(),
  // Serah Terima Fisik & Dokumen Legalitas (Opsional)
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
});

export type CreateSaleInput = z.input<typeof createSaleSchema>;

export const updateSaleSchema = z.object({
  saleId: z.string().uuid("ID transaksi penjualan tidak valid"),
  saleDate: z.coerce.date(),
  saleType: SaleChannelEnum,
  sellingPrice: z.coerce.number().positive("Harga jual wajib lebih besar dari 0"),
  dueDate: z.coerce.date().optional().nullable(),
  buyerName: z.string().trim().min(2, "Nama pembeli / showroom wajib diisi"),
  buyerPhone: z.string().trim().optional().nullable(),
  buyerAddress: z.string().trim().optional().nullable(),
  buyerIsShowroom: z.boolean().default(false),
});

export type UpdateSaleInput = z.input<typeof updateSaleSchema>;

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

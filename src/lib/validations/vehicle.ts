import { z } from "zod";

export const TransmissionTypeEnum = z.enum(["AUTOMATIC", "MANUAL", "CVT", "DCT"]);
export const SourceTypeEnum = z.enum(["AUCTION", "BROKER", "DIRECT_BUY"]);
export const AuctionLotTypeEnum = z.enum(["EKS_PERUSAHAAN", "EKS_TARIKAN_LEASING", "UNKNOWN"]);
export const DocumentStatusEnum = z.enum([
  "READY",
  "PROCESS_1_2_WEEKS",
  "LOST_NEED_REPLACEMENT",
  "MUTATION_REQUIRED",
]);
export const VehicleStatusEnum = z.enum([
  "INTAKE",
  "IN_REPAIR",
  "READY_FOR_SALE",
  "BOOKED",
  "AT_SHOWROOM_PENDING",
  "SOLD_SETTLED",
]);

export const createVehicleSchema = z.object({
  plateNumber: z
    .string()
    .min(3, "Nomor plat minimal 3 karakter")
    .max(15, "Nomor plat maksimal 15 karakter")
    .transform((val) => val.toUpperCase().trim()),
  brand: z.string().min(2, "Merk mobil wajib diisi"),
  model: z.string().min(2, "Tipe/model mobil wajib diisi"),
  year: z.coerce
    .number()
    .int()
    .min(1990, "Tahun pembuatan minimal 1990")
    .max(new Date().getFullYear() + 1, "Tahun pembuatan tidak valid"),
  color: z.string().min(2, "Warna mobil wajib diisi"),
  odometer: z.coerce.number().int().nonnegative("Odometer tidak boleh negatif"),
  transmission: TransmissionTypeEnum,
  engineCapacity: z.coerce.number().int().positive("Kapasitas mesin wajib diisi"),
  sourceType: SourceTypeEnum.default("AUCTION"),
  auctionHouse: z.string().optional().nullable(),
  auctionLotType: AuctionLotTypeEnum.optional().nullable(),
  purchasePrice: z.coerce
    .number()
    .positive("Harga beli harus lebih besar dari 0"),
  purchaseDate: z.coerce.date(),
  targetSellingPrice: z.coerce
    .number()
    .positive("Harga target jual harus lebih besar dari 0")
    .optional()
    .nullable(),
  minSellingPrice: z.coerce
    .number()
    .positive("Batas harga bawah harus lebih besar dari 0")
    .optional()
    .nullable(),
  currentLocation: z.string().default("Garasi Utama"),
  taxExpiryDate: z.coerce.date().optional().nullable(),
  platExpiryDate: z.coerce.date().optional().nullable(),
  taxNominal: z.coerce.number().nonnegative().optional().nullable(),
  stnkStatus: DocumentStatusEnum.default("READY"),
  bpkbStatus: DocumentStatusEnum.default("READY"),
  bpkbLeadDays: z.coerce.number().int().default(7),
  stnkLeadDays: z.coerce.number().int().optional().nullable(),
  estimatedReadyDate: z.coerce.date().optional().nullable(),
  youtubeVideoId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  physicalChecklist: z
    .object({
      spareTire: z.enum(["ADA_BAGUS", "ADA_AUS", "TIDAK_ADA"]).default("ADA_BAGUS"),
      jack: z.boolean().default(true),
      wheelWrench: z.boolean().default(true),
      keysCount: z.enum(["2_KEYS", "1_KEY"]).default("2_KEYS"),
      serviceBook: z.boolean().default(true),
      cabinMats: z.boolean().default(true),
      audioUnit: z.enum(["ORIGINAL", "MODIFIED", "BROKEN_OR_NONE"]).default("ORIGINAL"),
    })
    .optional()
    .nullable(),
});

export type CreateVehicleInput = z.input<typeof createVehicleSchema>;

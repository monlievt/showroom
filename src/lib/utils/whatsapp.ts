import { formatRupiah } from "../utils";

export interface WhatsAppVehiclePayload {
  brand: string;
  model: string;
  year: number;
  plateNumber: string;
  targetSellingPrice?: number | string | null;
  status: string;
  url?: string;
}

export interface WhatsAppAdminContact {
  id: string;
  name: string;
  role: string;
  phone: string;
  isPrimary: boolean;
  isActive: boolean;
}

export const DEFAULT_WHATSAPP_ADMINS: WhatsAppAdminContact[] = [
  {
    id: "admin-rio",
    name: "Rio",
    role: "Konsultasi & Negosiasi Unit",
    phone: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "081234567890",
    isPrimary: true,
    isActive: true,
  },
  {
    id: "admin-garasi",
    name: "Admin Garasi Nur Mobil",
    role: "Jadwal Cek Fisik & Lokasi Showroom",
    phone: process.env.GARAGE_WHATSAPP_NUMBER || "081398765432",
    isPrimary: false,
    isActive: true,
  },
];

/**
 * Normalisasi format nomor WhatsApp ke awalan 62 tanpa karakter non-digit
 */
export function normalizeWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) {
    return "62" + digits.slice(1);
  }
  if (digits.startsWith("62")) {
    return digits;
  }
  return "62" + digits;
}

/**
 * Menghasilkan tautan langsung Click-to-WhatsApp untuk admin
 */
export function generateDirectWhatsAppLink(
  phone: string,
  message: string = "Halo Admin Nur Mobil, saya ingin tanya info unit mobil bekas."
): string {
  const cleanPhone = normalizeWhatsAppNumber(phone);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Menghasilkan URL Click-to-WhatsApp untuk calon pembeli di katalog publik.
 * Memuat detail mobil, plat nomor, harga listing, dan status unit.
 */
export function generateCatalogWhatsAppLink(
  adminPhone: string,
  vehicle: WhatsAppVehiclePayload
): string {
  // Format nomor WA: ganti 08xx jadi 628xx dan hilangkan tanda hubung/spasi
  const cleanPhone = adminPhone.replace(/\D/g, "").replace(/^0/, "62");
  
  const priceText = vehicle.targetSellingPrice 
    ? ` seharga ${formatRupiah(vehicle.targetSellingPrice)}` 
    : "";
  const urlText = vehicle.url ? `\n\nLink unit: ${vehicle.url}` : "";

  let text = `Halo Admin Nur Mobil, saya tertarik unit *${vehicle.brand} ${vehicle.model} ${vehicle.year}* (Plat *${vehicle.plateNumber}*)${priceText}.\nApakah unit ini masih READY atau sudah BOOKED?${urlText}`;
  if (vehicle.status === "INTAKE" || vehicle.status === "IN_REPAIR") {
    text = `Halo Admin Nur Mobil, saya tertarik dengan unit yang SEGERA HADIR: *${vehicle.brand} ${vehicle.model} ${vehicle.year}* (Plat *${vehicle.plateNumber}*).\nKapan estimasi unit selesai persiapan salon/inspeksi dan bisa dicek di garasi? Apakah bisa di-booking duluan?${urlText}`;
  } else if (vehicle.status === "SOLD_SETTLED") {
    text = `Halo Admin Nur Mobil, saya melihat unit *${vehicle.brand} ${vehicle.model} ${vehicle.year}* (Plat *${vehicle.plateNumber}*) yang sudah TERJUAL di katalog.\nApakah ada rekomendasi stok unit serupa yang sedang intake atau segera ready di showroom?${urlText}`;
  }

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

/**
 * Menghasilkan URL Click-to-WhatsApp untuk reminder piutang/pelunasan dari dashboard admin.
 */
export function generateReceivableReminderLink(
  buyerPhone: string,
  data: {
    buyerName: string;
    brand: string;
    model: string;
    plateNumber: string;
    remainingAmount: number | string;
    dueDate?: string | null;
  }
): string {
  const cleanPhone = buyerPhone.replace(/\D/g, "").replace(/^0/, "62");
  const dueText = data.dueDate ? ` yang jatuh tempo pada ${data.dueDate}` : "";

  const text = `Halo Pak/Bu *${data.buyerName}*,\n\nKonfirmasi sisa pelunasan untuk unit *${data.brand} ${data.model}* (Plat *${data.plateNumber}*) sebesar *${formatRupiah(data.remainingAmount)}*${dueText}.\n\nMohon konfirmasi bukti transfer jika sudah melakukan pembayaran ke rekening resmi Nur Mobil. Terima kasih!`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

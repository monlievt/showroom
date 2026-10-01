export type VehicleStatus =
  | "INTAKE"
  | "IN_REPAIR"
  | "READY_FOR_SALE"
  | "BOOKED"
  | "AT_SHOWROOM_PENDING"
  | "SOLD_SETTLED";

const ALLOWED_TRANSITIONS: Record<VehicleStatus, VehicleStatus[]> = {
  // INTAKE bisa langsung ke READY_FOR_SALE (unit eks perusahaan kondisi baik, tidak perlu bengkel)
  // INTAKE bisa ke IN_REPAIR (unit perlu salon/cat/servis sebelum dipajang)
  INTAKE: ["IN_REPAIR", "READY_FOR_SALE"],
  IN_REPAIR: ["READY_FOR_SALE", "INTAKE"], // bisa kembali ke INTAKE jika perlu revisi assessment
  READY_FOR_SALE: ["BOOKED", "AT_SHOWROOM_PENDING", "SOLD_SETTLED", "IN_REPAIR"], // bisa balik ke bengkel jika ditemukan masalah saat test drive
  BOOKED: ["READY_FOR_SALE", "SOLD_SETTLED"],
  AT_SHOWROOM_PENDING: ["READY_FOR_SALE", "SOLD_SETTLED"],
  SOLD_SETTLED: [], // Terminal status — tidak boleh diubah langsung kecuali reversal formal
};

/**
 * Memvalidasi apakah transisi status kendaraan diizinkan oleh state machine.
 * Berdasarkan ARCHITECTURE.md §5.
 */
export function canTransition(from: VehicleStatus, to: VehicleStatus): boolean {
  if (from === to) return true;
  const allowed = ALLOWED_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

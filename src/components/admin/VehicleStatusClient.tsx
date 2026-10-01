"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Car,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Info,
  ShieldAlert,
} from "lucide-react";
import { updateVehicleStatusAction } from "@/app/actions/vehicle";
import { canTransition, type VehicleStatus } from "@/lib/calculations/vehicle-state";

interface VehicleSummary {
  id: string;
  plateNumber: string;
  brand: string;
  model: string;
  year: number;
  status: string;
}

const STATUS_DESCRIPTIONS: Record<
  string,
  { label: string; desc: string; badgeClass: string }
> = {
  INTAKE: {
    label: "Intake Baru",
    desc: "Unit baru saja didapat/menang lelang, parkir di garasi dan belum siap display.",
    badgeClass: "bg-[#EFECE8] text-[#6B6560] border-[#D9D4CB]",
  },
  IN_REPAIR: {
    label: "Bengkel / Salon (In Repair)",
    desc: "Unit sedang pengerjaan cat, mesin, kaki-kaki, atau salon detailing.",
    badgeClass: "bg-amber-100 text-amber-900 border-amber-300",
  },
  READY_FOR_SALE: {
    label: "Ready Jual (Display Katalog)",
    desc: "Kondisi unit prima, siap tayang di website publik dan ditawarkan ke calon pembeli.",
    badgeClass: "bg-emerald-100 text-emerald-900 border-emerald-300",
  },
  BOOKED: {
    label: "Booked (Tanda Jadi / DP)",
    desc: "Sudah diikat tanda jadi oleh pembeli atau showroom rekanan.",
    badgeClass: "bg-yellow-100 text-yellow-900 border-yellow-300",
  },
  AT_SHOWROOM_PENDING: {
    label: "Titip Showroom Rekanan",
    desc: "Unit dikirim ke showroom rekanan untuk konsinyasi/pajang dengan tempo pelunasan.",
    badgeClass: "bg-blue-100 text-blue-900 border-blue-300",
  },
  SOLD_SETTLED: {
    label: "Terjual Lunas (Settled)",
    desc: "Pembayaran 100% lunas, siap cetak kuitansi resmi dan bagi hasil investor.",
    badgeClass: "bg-[#1C1917] text-white border-black",
  },
};

export function VehicleStatusClient({ vehicle }: { vehicle: VehicleSummary }) {
  const router = useRouter();
  const currentStatus = vehicle.status as VehicleStatus;

  const allStatuses: VehicleStatus[] = [
    "INTAKE",
    "IN_REPAIR",
    "READY_FOR_SALE",
    "BOOKED",
    "AT_SHOWROOM_PENDING",
    "SOLD_SETTLED",
  ];

  const validTransitions = allStatuses.filter(
    (s) => s !== currentStatus && canTransition(currentStatus, s)
  );

  const [targetStatus, setTargetStatus] = useState<VehicleStatus>(
    validTransitions[0] || currentStatus
  );
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleUpdate = async () => {
    if (!targetStatus || targetStatus === currentStatus) return;
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await updateVehicleStatusAction(vehicle.id, targetStatus);
      if (!res.success) {
        throw new Error(res.error || "Gagal mengubah status");
      }

      setSuccessMsg("Status unit berhasil diperbarui! Mengalihkan ke inventori...");
      setTimeout(() => {
        router.push("/admin/inventory");
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal mengubah status unit");
      setLoading(false);
    }
  };

  const currInfo = STATUS_DESCRIPTIONS[currentStatus] || {
    label: currentStatus,
    desc: "",
    badgeClass: "",
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9D4CB] pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/inventory"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#D9D4CB] text-[#1C1917] hover:bg-[#EFECE8] font-semibold text-xs transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-[#6B6560]" />
            <span>Kembali ke Inventori</span>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#1C1917]">
              Ubah Status Unit Kendaraan
            </h1>
            <p className="text-xs text-[#6B6560]">
              Pengaturan siklus unit dari Intake lelang hingga Ready Jual.
            </p>
          </div>
        </div>
      </div>

      {/* Info Unit */}
      <div className="bg-[#EFECE8] border border-[#D9D4CB] rounded-2xl p-5 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-white rounded-xl border border-[#D9D4CB] text-[#D97706]">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base text-[#1C1917]">
                {vehicle.brand} {vehicle.model}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-white border border-[#D9D4CB] font-bold text-[#1C1917]">
                {vehicle.year}
              </span>
            </div>
            <div className="text-xs font-mono font-bold text-[#D97706] mt-0.5">
              {vehicle.plateNumber}
            </div>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-[#6B6560] block font-medium">Status Saat Ini</span>
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-bold border mt-1 ${currInfo.badgeClass}`}
          >
            {currInfo.label}
          </span>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Status Selection Card */}
      <div className="bg-white border border-[#D9D4CB] rounded-2xl p-6 shadow-xs space-y-5">
        <div>
          <h2 className="text-sm font-bold text-[#1C1917] uppercase tracking-wider mb-1 flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-[#D97706]" />
            <span>Pilih Status Tujuan yang Sah</span>
          </h2>
          <p className="text-xs text-[#6B6560]">
            Sistem menerapkan aturan State Machine untuk menjaga konsistensi data operasional showroom.
          </p>
        </div>

        {validTransitions.length === 0 ? (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="font-bold">Tidak ada perubahan status langsung yang diizinkan saat ini.</p>
              <p className="mt-1 text-amber-800">
                Unit dengan status <strong>{currInfo.label}</strong> telah mencapai batas alur (misal: sudah lunas atau menunggu input pembayaran pada modul Penjualan).
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {validTransitions.map((statusKey) => {
              const info = STATUS_DESCRIPTIONS[statusKey];
              const isSelected = targetStatus === statusKey;

              return (
                <label
                  key={statusKey}
                  onClick={() => setTargetStatus(statusKey)}
                  className={`flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-amber-50/60 border-[#D97706] ring-2 ring-[#D97706]/20"
                      : "bg-[#F7F5F2] border-[#D9D4CB] hover:bg-[#EFECE8]"
                  }`}
                >
                  <input
                    type="radio"
                    name="targetStatus"
                    checked={isSelected}
                    onChange={() => setTargetStatus(statusKey)}
                    className="mt-1 accent-[#D97706]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#1C1917]">
                        {info.label}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${info.badgeClass}`}
                      >
                        {statusKey}
                      </span>
                    </div>
                    <p className="text-xs text-[#6B6560] mt-1">{info.desc}</p>
                  </div>
                </label>
              );
            })}
          </div>
        )}

        <div className="p-3.5 rounded-xl bg-[#F7F5F2] border border-[#D9D4CB] text-[11px] text-[#6B6560] flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0 text-[#D97706]" />
          <span>
            Unit berstatus <strong>Ready Jual</strong> otomatis muncul di website publik dan katalog digital WhatsApp pelanggan.
          </span>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 bg-[#EFECE8] border border-[#D9D4CB] rounded-2xl p-4">
        <Link
          href="/admin/inventory"
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#D9D4CB] bg-white text-center text-sm font-semibold text-[#6B6560] hover:text-[#1C1917] hover:bg-[#F7F5F2] transition-colors shadow-xs"
        >
          Batal & Kembali
        </Link>

        <button
          type="button"
          onClick={handleUpdate}
          disabled={loading || validTransitions.length === 0}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-[#1C1917] hover:bg-[#D97706] text-white rounded-xl text-sm font-bold shadow-md transition-colors disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Memperbarui Status...</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>Konfirmasi Perubahan Status</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

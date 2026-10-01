"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Car,
  Gavel,
  ShieldCheck,
  AlertTriangle,
  Banknote,
  FileText,
  Clock,
  CheckCircle,
  Loader2,
  Wrench,
  Key,
  BookOpen,
  Disc,
  Volume2,
  ShieldAlert,
  Droplet,
  Camera,
  ClipboardCheck,
  Printer,
  RotateCcw,
  CalendarClock,
} from "lucide-react";
import { createVehicleAction } from "@/app/actions/vehicle";
import { cn } from "@/lib/utils";

// AUCTION PRESETS
const AUCTION_HOUSE_PRESETS: Record<
  string,
  { label: string; bpkbLeadDays: number; notes: string }
> = {
  JBA: {
    label: "JBA (Japan Best Auto)",
    bpkbLeadDays: 14,
    notes: "BPKB rata-rata 14 hari kerja",
  },
  AUKSI: {
    label: "AUKSI (Mobil88/Garansindo)",
    bpkbLeadDays: 7,
    notes: "BPKB cepat ~7 hari kerja",
  },
  IBID: {
    label: "IBID (Graha Buana/Astra)",
    bpkbLeadDays: 10,
    notes: "BPKB teratur ~10 hari kerja",
  },
  SMARTBID: {
    label: "SmartBid",
    bpkbLeadDays: 30,
    notes: "BPKB agak lama ~30 hari kerja",
  },
  ADIRA: {
    label: "Adira Auction",
    bpkbLeadDays: 21,
    notes: "BPKB berkisar ~21 hari kerja",
  },
  "BCA FINANCE": {
    label: "BCA Finance Auction",
    bpkbLeadDays: 14,
    notes: "BPKB ~14 hari kerja",
  },
  "STAR AUCTION": {
    label: "Star Auction",
    bpkbLeadDays: 14,
    notes: "BPKB ~14 hari kerja",
  },
  LAINNYA: {
    label: "Balai Lelang Lainnya",
    bpkbLeadDays: 14,
    notes: "Tentukan estimasi secara manual",
  },
};

export function VehicleNewClient() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    plateNumber: "",
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    color: "",
    odometer: 0,
    transmission: "AUTOMATIC",
    engineCapacity: 1500,
    sourceType: "AUCTION",
    auctionHouse: "JBA",
    auctionLotType: "EKS_PERUSAHAAN",
    purchasePrice: 0,
    purchaseDate: new Date().toISOString().split("T")[0],
    targetSellingPrice: 0,
    minSellingPrice: 0,
    currentLocation: "Garasi Utama",
    bpkbStatus: "PROCESS_1_2_WEEKS",
    bpkbLeadDays: 14,
    taxExpiryDate: "",
    platExpiryDate: "",
    taxNominal: 0,
    stnkStatus: "READY",
    notes: "",
  });

  const [physicalChecklist, setPhysicalChecklist] = useState({
    spareTire: "ADA_BAGUS" as "ADA_BAGUS" | "ADA_AUS" | "TIDAK_ADA",
    jack: true,
    wheelWrench: true,
    keysCount: "2_KEYS" as "2_KEYS" | "1_KEY",
    serviceBook: true,
    cabinMats: true,
    audioUnit: "ORIGINAL" as "ORIGINAL" | "MODIFIED" | "BROKEN_OR_NONE",
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [createdVehicle, setCreatedVehicle] = useState<{
    id: string;
    plateNumber: string;
    brand: string;
    model: string;
    year: number;
    purchasePrice: number;
  } | null>(null);

  const isAuction = formData.sourceType === "AUCTION";
  const currentPreset = AUCTION_HOUSE_PRESETS[formData.auctionHouse];

  const handleResetForm = () => {
    setCreatedVehicle(null);
    setFormData({
      plateNumber: "",
      brand: "",
      model: "",
      year: new Date().getFullYear(),
      color: "",
      odometer: 0,
      transmission: "AUTOMATIC",
      engineCapacity: 1500,
      sourceType: "AUCTION",
      auctionHouse: "JBA",
      auctionLotType: "EKS_PERUSAHAAN",
      purchasePrice: 0,
      purchaseDate: new Date().toISOString().split("T")[0],
      targetSellingPrice: 0,
      minSellingPrice: 0,
      currentLocation: "Garasi Utama",
      bpkbStatus: "PROCESS_1_2_WEEKS",
      bpkbLeadDays: 14,
      taxExpiryDate: "",
      platExpiryDate: "",
      taxNominal: 0,
      stnkStatus: "READY",
      notes: "",
    });
    setPhysicalChecklist({
      spareTire: "ADA_BAGUS",
      jack: true,
      wheelWrench: true,
      keysCount: "2_KEYS",
      serviceBook: true,
      cabinMats: true,
      audioUnit: "ORIGINAL",
    });
    setSuccessMsg("");
    setErrorMsg("");
  };

  const handleAuctionHouseChange = (house: string) => {
    const preset = AUCTION_HOUSE_PRESETS[house];
    setFormData((prev) => ({
      ...prev,
      auctionHouse: house,
      bpkbLeadDays: preset?.bpkbLeadDays ?? 14,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await createVehicleAction({
        ...formData,
        year: Number(formData.year),
        odometer: Number(formData.odometer),
        engineCapacity: Number(formData.engineCapacity),
        purchasePrice: Number(formData.purchasePrice),
        purchaseDate: new Date(formData.purchaseDate),
        targetSellingPrice: formData.targetSellingPrice
          ? Number(formData.targetSellingPrice)
          : undefined,
        minSellingPrice: formData.minSellingPrice
          ? Number(formData.minSellingPrice)
          : undefined,
        transmission: formData.transmission as any,
        sourceType: formData.sourceType as any,
        auctionLotType: isAuction ? (formData.auctionLotType as any) : undefined,
        bpkbStatus: formData.bpkbStatus as any,
        bpkbLeadDays: Number(formData.bpkbLeadDays),
        taxExpiryDate: formData.taxExpiryDate ? new Date(formData.taxExpiryDate) : undefined,
        platExpiryDate: formData.platExpiryDate ? new Date(formData.platExpiryDate) : undefined,
        taxNominal: formData.taxNominal ? Number(formData.taxNominal) : undefined,
        stnkStatus: formData.stnkStatus as any,
        physicalChecklist,
      });

      if (!res.success || !res.data) {
        throw new Error(res.error || "Gagal menyimpan unit");
      }

      setLoading(false);
      setCreatedVehicle({
        id: res.data.id,
        plateNumber: res.data.plateNumber,
        brand: res.data.brand,
        model: res.data.model,
        year: res.data.year,
        purchasePrice: Number(res.data.purchasePrice),
      });
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menyimpan unit");
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Top Navigation */}
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
              Intake Kendaraan Baru
            </h1>
            <p className="text-xs text-[#6B6560]">
              Pendaftaran unit masuk dari lelang / pembelian langsung ke garasi.
            </p>
          </div>
        </div>
      </div>

      {/* FLOW GUIDE */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 shadow-xs">
        <div className="flex items-center gap-2 font-bold text-amber-900 mb-2">
          <ShieldCheck className="w-4 h-4 text-amber-600" />
          <span>Alur Penanganan Unit Showroom Nur Mobil:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 font-medium">
          <span className="bg-[#EFECE8] text-[#6B6560] px-3 py-1 rounded-full border border-[#D9D4CB]">
            1. INTAKE (Unit baru masuk)
          </span>
          <span className="text-amber-600 font-bold">→</span>
          <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full border border-amber-300">
            2. IN_REPAIR (Jika butuh salon/bengkel)
          </span>
          <span className="text-amber-600 font-bold">→</span>
          <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-300">
            3. READY JUAL ✅ (Tampil di website publik)
          </span>
        </div>
        <p className="mt-2 text-amber-800 text-[11px]">
          💡 <em>Tip Praktis:</em> Jika unit lelang kondisinya mulus dan siap
          dijual, Anda dapat langsung menggeser status dari INTAKE ke Ready Jual
          kapan saja.
        </p>
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: Identitas & Sumber */}
        <div className="bg-white border border-[#D9D4CB] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#EBE7E1] pb-3">
            <Car className="w-4 h-4 text-[#D97706]" />
            <h2 className="text-sm font-bold text-[#1C1917] uppercase tracking-wider">
              1. Identitas Unit & Sumber Masuk
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                Nomor Plat Polisi *
              </label>
              <input
                required
                type="text"
                placeholder="Contoh: B 1234 CD"
                value={formData.plateNumber}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    plateNumber: e.target.value.toUpperCase(),
                  })
                }
                className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm uppercase font-bold text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
              />
              <span className="text-[10px] text-[#6B6560] mt-1 block">
                Plat unik identifikasi inventori
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                Sumber Pembelian *
              </label>
              <select
                value={formData.sourceType}
                onChange={(e) =>
                  setFormData({ ...formData, sourceType: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-medium text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
              >
                <option value="AUCTION">Balai Lelang</option>
                <option value="BROKER">Makelar / Rekanan</option>
                <option value="DIRECT_BUY">Beli Langsung Pemakai</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                Tanggal Pembelian / Menang Lelang *
              </label>
              <input
                required
                type="date"
                value={formData.purchaseDate}
                onChange={(e) =>
                  setFormData({ ...formData, purchaseDate: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-medium text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: Jika Sumber Balai Lelang */}
        {isAuction && (
          <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-amber-200 pb-3">
              <Gavel className="w-4 h-4 text-amber-700" />
              <h2 className="text-sm font-bold text-amber-950 uppercase tracking-wider">
                2. Balai Lelang & BPKB Tracker Lead Time
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                  Pilihan Balai Lelang
                </label>
                <select
                  value={formData.auctionHouse}
                  onChange={(e) => handleAuctionHouseChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl text-sm font-semibold text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
                >
                  {Object.entries(AUCTION_HOUSE_PRESETS).map(([key, val]) => (
                    <option key={key} value={key}>
                      {val.label}
                    </option>
                  ))}
                </select>
                {currentPreset && (
                  <p className="text-[11px] text-amber-800 mt-1.5 font-medium">
                    📌 {currentPreset.notes}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                  Tipe Lot Lelang
                </label>
                <select
                  value={formData.auctionLotType}
                  onChange={(e) =>
                    setFormData({ ...formData, auctionLotType: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl text-sm font-semibold text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
                >
                  <option value="EKS_PERUSAHAAN">
                    Eks Perusahaan ✅ (BPKB bersih, 7-14 hari)
                  </option>
                  <option value="EKS_TARIKAN_LEASING">
                    Eks Tarikan Leasing ⚠️ (BPKB 14-30 hari)
                  </option>
                  <option value="UNKNOWN">
                    Belum Konfirmasi / Lainnya
                  </option>
                </select>
                {formData.auctionLotType === "EKS_TARIKAN_LEASING" && (
                  <p className="text-[11px] text-orange-800 mt-1.5 font-semibold">
                    ⚠️ Eks Leasing: Pastikan STNK & surat pelepasan hak lengkap.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                  Status BPKB Saat Ini
                </label>
                <select
                  value={formData.bpkbStatus}
                  onChange={(e) =>
                    setFormData({ ...formData, bpkbStatus: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl text-sm font-medium text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
                >
                  <option value="PROCESS_1_2_WEEKS">
                    Masih Diproses Balai Lelang
                  </option>
                  <option value="READY">BPKB Sudah di Tangan</option>
                  <option value="MUTATION_REQUIRED">
                    Perlu Mutasi / Balik Nama
                  </option>
                  <option value="LOST_NEED_REPLACEMENT">
                    Hilang / Butuh Duplikat
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                  Estimasi BPKB Tiba (Hari Kerja)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={formData.bpkbLeadDays}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bpkbLeadDays: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl text-sm font-bold text-amber-950 focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
                  />
                  <span className="text-xs text-amber-900 font-semibold whitespace-nowrap">
                    Hari Kerja
                  </span>
                </div>
                <p className="text-[10px] text-amber-800 mt-1">
                  Otomatis terisi berdasarkan balai lelang yang Anda pilih.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2B: Legalitas STNK & Alarm Pajak Tahunan PKB */}
        <div className="bg-[#FAF9F5] border border-[#D9D4CB] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#EBE7E1] pb-3">
            <div className="flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-[#D97706]" />
              <h2 className="text-sm font-bold text-[#1C1917] uppercase tracking-wider">
                Dokumen STNK & Radar Pajak Kendaraan (PKB)
              </h2>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
              Alarm H-30 Hari Showroom
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                Jatuh Tempo Pajak Tahunan (PKB)
              </label>
              <input
                type="date"
                value={formData.taxExpiryDate}
                onChange={(e) =>
                  setFormData({ ...formData, taxExpiryDate: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-white border border-[#D9D4CB] rounded-xl text-sm font-medium text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
              />
              <span className="text-[10px] text-[#6B6560] mt-1 block">
                Sesuai lembar notice pajak STNK
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                Jatuh Tempo Plat / Kaleng (5 Thn)
              </label>
              <input
                type="date"
                value={formData.platExpiryDate}
                onChange={(e) =>
                  setFormData({ ...formData, platExpiryDate: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-white border border-[#D9D4CB] rounded-xl text-sm font-medium text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
              />
              <span className="text-[10px] text-[#6B6560] mt-1 block">
                Bulan & Tahun plat kaleng mobil
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                Estimasi Pajak Tahunan (Rp)
              </label>
              <input
                type="number"
                min={0}
                placeholder="Contoh: 2800000"
                value={formData.taxNominal || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    taxNominal: Number(e.target.value),
                  })
                }
                className="w-full px-3.5 py-2.5 bg-white border border-[#D9D4CB] rounded-xl text-sm font-semibold text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
              />
              <span className="text-[10px] text-[#6B6560] mt-1 block">
                Acuan negosiasi / perpanjangan
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                Status Fisik STNK
              </label>
              <select
                value={formData.stnkStatus}
                onChange={(e) =>
                  setFormData({ ...formData, stnkStatus: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-white border border-[#D9D4CB] rounded-xl text-sm font-semibold text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
              >
                <option value="READY">STNK Asli Ready di Showroom</option>
                <option value="PROCESS_1_2_WEEKS">Masih Diproses Balai Lelang</option>
                <option value="MUTATION_REQUIRED">Perlu Mutasi / Balik Nama</option>
                <option value="LOST_NEED_REPLACEMENT">STNK Hilang (Butuh Duplikat)</option>
              </select>
            </div>
          </div>

          {/* Banner Analisis Status Pajak STNK Otomatis */}
          {formData.taxExpiryDate && (() => {
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            const target = new Date(formData.taxExpiryDate);
            target.setHours(0, 0, 0, 0);
            const diffDays = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays < 0) {
              return (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold block">Pajak Kendaraan MATI / Lewat Jatuh Tempo ({Math.abs(diffDays)} Hari Lalu)!</strong>
                    <p className="mt-0.5 text-[11px] leading-relaxed">
                      Unit ini berstatus pajak mati. Disarankan untuk segera diproses perpanjangan Samsat sebelum unit dibawa test drive atau diserahterimakan ke konsumen.
                    </p>
                  </div>
                </div>
              );
            } else if (diffDays <= 30) {
              return (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold text-[#78350F] block">Pajak Akan Jatuh Tempo Dalam {diffDays} Hari!</strong>
                    <p className="mt-0.5 text-[11px] text-[#92400E] leading-relaxed">
                      Unit masuk dalam Radar Alarm H-30 Dashboard. Siapkan alokasi dana perpanjangan atau informasikan pada kesepakatan jual-beli.
                    </p>
                  </div>
                </div>
              );
            } else {
              return (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold text-emerald-950 block">Pajak Hidup & Aman (Sisa {diffDays} Hari)</strong>
                    <p className="mt-0.5 text-[11px] text-emerald-800 leading-relaxed">
                      Masa berlaku pajak STNK masih panjang dan siap untuk dipajang serta uji jalan tanpa kendala razia.
                    </p>
                  </div>
                </div>
              );
            }
          })()}
        </div>

        {/* SECTION 3: Spesifikasi Unit */}
        <div className="bg-white border border-[#D9D4CB] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#EBE7E1] pb-3">
            <Car className="w-4 h-4 text-[#D97706]" />
            <h2 className="text-sm font-bold text-[#1C1917] uppercase tracking-wider">
              3. Detail Spesifikasi Kendaraan
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                Merk Kendaraan *
              </label>
              <input
                required
                type="text"
                placeholder="Toyota, Honda, Daihatsu, dll"
                value={formData.brand}
                onChange={(e) =>
                  setFormData({ ...formData, brand: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                Tipe / Model *
              </label>
              <input
                required
                type="text"
                placeholder="Avanza 1.3 G, Brio Satya E, dll"
                value={formData.model}
                onChange={(e) =>
                  setFormData({ ...formData, model: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                Tahun Pembuatan *
              </label>
              <input
                required
                type="number"
                min={1990}
                max={new Date().getFullYear() + 1}
                value={formData.year}
                onChange={(e) =>
                  setFormData({ ...formData, year: Number(e.target.value) })
                }
                className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-semibold text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                Transmisi
              </label>
              <select
                value={formData.transmission}
                onChange={(e) =>
                  setFormData({ ...formData, transmission: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
              >
                <option value="AUTOMATIC">Automatic (AT)</option>
                <option value="MANUAL">Manual (MT)</option>
                <option value="CVT">CVT</option>
                <option value="DCT">DCT</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                Warna Fisik *
              </label>
              <input
                required
                type="text"
                placeholder="Hitam Metalik, Putih..."
                value={formData.color}
                onChange={(e) =>
                  setFormData({ ...formData, color: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                Odometer (km)
              </label>
              <input
                type="number"
                min={0}
                value={formData.odometer}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    odometer: Number(e.target.value),
                  })
                }
                className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                Kapasitas Mesin (CC)
              </label>
              <input
                type="number"
                min={500}
                value={formData.engineCapacity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    engineCapacity: Number(e.target.value),
                  })
                }
                className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: Keuangan & Harga */}
        <div className="bg-white border border-[#D9D4CB] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#EBE7E1] pb-3">
            <Banknote className="w-4 h-4 text-[#D97706]" />
            <h2 className="text-sm font-bold text-[#1C1917] uppercase tracking-wider">
              4. Finansial & Rencana Harga Jual
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                Harga Beli / Menang Lelang (Rp) *
              </label>
              <input
                required
                type="number"
                placeholder="150000000"
                value={formData.purchasePrice || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    purchasePrice: Number(e.target.value),
                  })
                }
                className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-bold text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
              />
              <span className="text-[10px] text-[#6B6560] mt-1 block">
                Otomatis dicatat sebagai HPP awal unit
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                Target Banderol Jual (Rp)
              </label>
              <input
                type="number"
                placeholder="170000000"
                value={formData.targetSellingPrice || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    targetSellingPrice: Number(e.target.value),
                  })
                }
                className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-bold text-[#16A34A] focus:outline-none focus:ring-2 focus:ring-[#16A34A]/40"
              />
              <span className="text-[10px] text-[#6B6560] mt-1 block">
                Harga publish yang tertera di katalog
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                Batas Bawah Nego / Net (Rp)
              </label>
              <input
                type="number"
                placeholder="162000000"
                value={formData.minSellingPrice || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minSellingPrice: Number(e.target.value),
                  })
                }
                className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-medium text-[#92400E] focus:outline-none focus:ring-2 focus:ring-[#92400E]/40"
              />
              <span className="text-[10px] text-[#6B6560] mt-1 block">
                Pedoman batas tawar untuk tim sales
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 5: Ceklist Bawaan Fisik Turun Towing */}
        <div className="bg-white border border-[#D9D4CB] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EBE7E1] pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#D97706]" />
              <h2 className="text-sm font-bold text-[#1C1917] uppercase tracking-wider">
                5. Ceklist Bawaan Fisik Turun Towing (Anti-Kehilangan)
              </h2>
            </div>
            <span className="text-[11px] font-semibold text-[#92400E] bg-[#FEF3C7] px-2.5 py-0.5 rounded-full border border-[#D97706]/30">
              SOP Balai Lelang & Ekspedisi
            </span>
          </div>

          <p className="text-xs text-[#6B6560]">
            Periksa kelengkapan fisik saat unit dibongkar dari truk towing. Data ini otomatis masuk ke laporan inspeksi, surat jalan bengkel, dan mencegah kebocoran HPP.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
            {/* 1. Ban Serep */}
            <div className="p-3.5 rounded-xl border border-[#D9D4CB] bg-[#F7F5F2] space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#1C1917]">
                <Disc className="w-3.5 h-3.5 text-[#D97706]" />
                <span>Ban Cadangan / Serep</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setPhysicalChecklist({ ...physicalChecklist, spareTire: "ADA_BAGUS" })}
                  className={cn(
                    "px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                    physicalChecklist.spareTire === "ADA_BAGUS"
                      ? "bg-[#16A34A] text-white shadow-xs"
                      : "bg-white text-[#6B6560] border border-[#D9D4CB]"
                  )}
                >
                  ✓ Ada (Bagus)
                </button>
                <button
                  type="button"
                  onClick={() => setPhysicalChecklist({ ...physicalChecklist, spareTire: "ADA_AUS" })}
                  className={cn(
                    "px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                    physicalChecklist.spareTire === "ADA_AUS"
                      ? "bg-[#D97706] text-white shadow-xs"
                      : "bg-white text-[#6B6560] border border-[#D9D4CB]"
                  )}
                >
                  ⚠️ Ada (Aus)
                </button>
                <button
                  type="button"
                  onClick={() => setPhysicalChecklist({ ...physicalChecklist, spareTire: "TIDAK_ADA" })}
                  className={cn(
                    "px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                    physicalChecklist.spareTire === "TIDAK_ADA"
                      ? "bg-[#DC2626] text-white shadow-xs"
                      : "bg-white text-[#6B6560] border border-[#D9D4CB]"
                  )}
                >
                  ✕ Tidak Ada
                </button>
              </div>
            </div>

            {/* 2. Dongkrak & Stang */}
            <div className="p-3.5 rounded-xl border border-[#D9D4CB] bg-[#F7F5F2] space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#1C1917]">
                <Wrench className="w-3.5 h-3.5 text-[#D97706]" />
                <span>Dongkrak & Tuas Stang</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPhysicalChecklist({ ...physicalChecklist, jack: true })}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center",
                    physicalChecklist.jack
                      ? "bg-[#16A34A] text-white shadow-xs"
                      : "bg-white text-[#6B6560] border border-[#D9D4CB]"
                  )}
                >
                  ✓ Ada & Fungsi
                </button>
                <button
                  type="button"
                  onClick={() => setPhysicalChecklist({ ...physicalChecklist, jack: false })}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center",
                    !physicalChecklist.jack
                      ? "bg-[#DC2626] text-white shadow-xs"
                      : "bg-white text-[#6B6560] border border-[#D9D4CB]"
                  )}
                >
                  ✕ Tidak Ada
                </button>
              </div>
            </div>

            {/* 3. Kunci Roda & Toolkit */}
            <div className="p-3.5 rounded-xl border border-[#D9D4CB] bg-[#F7F5F2] space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#1C1917]">
                <Wrench className="w-3.5 h-3.5 text-[#D97706]" />
                <span>Kunci Roda & Toolkit</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPhysicalChecklist({ ...physicalChecklist, wheelWrench: true })}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center",
                    physicalChecklist.wheelWrench
                      ? "bg-[#16A34A] text-white shadow-xs"
                      : "bg-white text-[#6B6560] border border-[#D9D4CB]"
                  )}
                >
                  ✓ Ada Lengkap
                </button>
                <button
                  type="button"
                  onClick={() => setPhysicalChecklist({ ...physicalChecklist, wheelWrench: false })}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center",
                    !physicalChecklist.wheelWrench
                      ? "bg-[#DC2626] text-white shadow-xs"
                      : "bg-white text-[#6B6560] border border-[#D9D4CB]"
                  )}
                >
                  ✕ Tidak Ada
                </button>
              </div>
            </div>

            {/* 4. Kunci Kontak & Remote Cadangan */}
            <div className="p-3.5 rounded-xl border border-[#D9D4CB] bg-[#F7F5F2] space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#1C1917]">
                <Key className="w-3.5 h-3.5 text-[#D97706]" />
                <span>Kunci Kontak & Remote</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPhysicalChecklist({ ...physicalChecklist, keysCount: "2_KEYS" })}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center",
                    physicalChecklist.keysCount === "2_KEYS"
                      ? "bg-[#16A34A] text-white shadow-xs"
                      : "bg-white text-[#6B6560] border border-[#D9D4CB]"
                  )}
                >
                  ✓ Lengkap 2 Kunci
                </button>
                <button
                  type="button"
                  onClick={() => setPhysicalChecklist({ ...physicalChecklist, keysCount: "1_KEY" })}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center",
                    physicalChecklist.keysCount === "1_KEY"
                      ? "bg-[#D97706] text-white shadow-xs"
                      : "bg-white text-[#6B6560] border border-[#D9D4CB]"
                  )}
                >
                  ⚠️ Hanya 1 Kunci
                </button>
              </div>
            </div>

            {/* 5. Buku Manual & Servis */}
            <div className="p-3.5 rounded-xl border border-[#D9D4CB] bg-[#F7F5F2] space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#1C1917]">
                <BookOpen className="w-3.5 h-3.5 text-[#D97706]" />
                <span>Buku Manual & Servis</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPhysicalChecklist({ ...physicalChecklist, serviceBook: true })}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center",
                    physicalChecklist.serviceBook
                      ? "bg-[#16A34A] text-white shadow-xs"
                      : "bg-white text-[#6B6560] border border-[#D9D4CB]"
                  )}
                >
                  ✓ Ada
                </button>
                <button
                  type="button"
                  onClick={() => setPhysicalChecklist({ ...physicalChecklist, serviceBook: false })}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center",
                    !physicalChecklist.serviceBook
                      ? "bg-[#78716C] text-white shadow-xs"
                      : "bg-white text-[#6B6560] border border-[#D9D4CB]"
                  )}
                >
                  ✕ Tidak Ada
                </button>
              </div>
            </div>

            {/* 6. Head Unit / Audio */}
            <div className="p-3.5 rounded-xl border border-[#D9D4CB] bg-[#F7F5F2] space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#1C1917]">
                <Volume2 className="w-3.5 h-3.5 text-[#D97706]" />
                <span>Head Unit / Audio</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setPhysicalChecklist({ ...physicalChecklist, audioUnit: "ORIGINAL" })}
                  className={cn(
                    "px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                    physicalChecklist.audioUnit === "ORIGINAL"
                      ? "bg-[#16A34A] text-white shadow-xs"
                      : "bg-white text-[#6B6560] border border-[#D9D4CB]"
                  )}
                >
                  ✓ Original
                </button>
                <button
                  type="button"
                  onClick={() => setPhysicalChecklist({ ...physicalChecklist, audioUnit: "MODIFIED" })}
                  className={cn(
                    "px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                    physicalChecklist.audioUnit === "MODIFIED"
                      ? "bg-[#2563EB] text-white shadow-xs"
                      : "bg-white text-[#6B6560] border border-[#D9D4CB]"
                  )}
                >
                  ⚡ Android/Layar
                </button>
                <button
                  type="button"
                  onClick={() => setPhysicalChecklist({ ...physicalChecklist, audioUnit: "BROKEN_OR_NONE" })}
                  className={cn(
                    "px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                    physicalChecklist.audioUnit === "BROKEN_OR_NONE"
                      ? "bg-[#DC2626] text-white shadow-xs"
                      : "bg-white text-[#6B6560] border border-[#D9D4CB]"
                  )}
                >
                  ✕ Rusak/Hilang
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 6: Catatan & Lokasi Garasi */}
        <div className="bg-white border border-[#D9D4CB] rounded-2xl p-5 sm:p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2 border-b border-[#EBE7E1] pb-3">
            <FileText className="w-4 h-4 text-[#D97706]" />
            <h2 className="text-sm font-bold text-[#1C1917] uppercase tracking-wider">
              6. Catatan Kondisi & Lokasi Garasi
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                Lokasi Parkir Unit Saat Ini
              </label>
              <input
                type="text"
                value={formData.currentLocation}
                onChange={(e) =>
                  setFormData({ ...formData, currentLocation: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm text-[#1C1917]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                Catatan Kondisi Khusus / Kelengkapan
              </label>
              <textarea
                rows={2}
                placeholder="Contoh: Kunci serep ada, buku servis lengkap, baret tipis di bemper depan..."
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm text-[#1C1917] resize-none"
              />
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 bg-[#EFECE8] border border-[#D9D4CB] rounded-2xl p-4">
          <Link
            href="/admin/inventory"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#D9D4CB] bg-white text-center text-sm font-semibold text-[#6B6560] hover:text-[#1C1917] hover:bg-[#F7F5F2] transition-colors shadow-xs"
          >
            Batal & Kembali
          </Link>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-[#D97706] hover:bg-[#92400E] text-white rounded-xl text-sm font-bold shadow-md transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan ke Inventori...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Simpan & Intake Unit</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* ── MODAL PANDUAN LANGKAH BERIKUTNYA (NEXT-STEP DIALOG) ── */}
      {createdVehicle && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-[#D9D4CB] space-y-5">
            {/* Header Dialog */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-[#1C1917]">
                  Unit Berhasil Didaftarkan ke Inventori!
                </h3>
                <p className="text-xs text-[#6B6560] mt-0.5">
                  Data intake dan ceklist fisik turun towing telah aman tersimpan di sistem.
                </p>
              </div>

              {/* Unit Tag Highlight */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F7F5F2] border border-[#D9D4CB]">
                <span className="font-black text-sm text-[#D97706] tracking-wider">
                  {createdVehicle.plateNumber}
                </span>
                <span className="text-xs text-[#6B6560]">•</span>
                <span className="text-xs font-bold text-[#1C1917]">
                  {createdVehicle.brand} {createdVehicle.model} ({createdVehicle.year})
                </span>
              </div>
            </div>

            {/* Prompt Heading */}
            <div className="border-t border-[#EFECE8] pt-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#92400E] block mb-3">
                Langkah Berikutnya yang Direkomendasikan:
              </span>

              {/* 4 Kartu Aksi Cepat */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Ganti Oli Mandiri */}
                <Link
                  href="/admin/finance/assets"
                  className="p-3.5 rounded-2xl border border-[#D9D4CB] bg-[#F7F5F2] hover:bg-[#FEF3C7] hover:border-[#D97706]/50 transition-all group flex flex-col justify-between text-left"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#D97706]">
                      <Droplet className="w-4 h-4" />
                      <span>Servis Oli Mandiri</span>
                    </div>
                    <p className="text-[11px] text-[#6B6560] leading-snug">
                      Ambil oli &amp; filter dari stok garasi, catat HPP servis mandiri (Rp 500rb).
                    </p>
                  </div>
                  <div className="mt-3 text-[11px] font-bold text-[#D97706] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Buka Gudang Bahan</span>
                    <span>→</span>
                  </div>
                </Link>

                {/* 2. Cetak Surat Jalan Bengkel */}
                <a
                  href={`/api/pdf/workshop-dispatch/${createdVehicle.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 rounded-2xl border border-[#D9D4CB] bg-[#F7F5F2] hover:bg-[#FEF3C7] hover:border-[#D97706]/50 transition-all group flex flex-col justify-between text-left"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#92400E]">
                      <Wrench className="w-4 h-4" />
                      <span>Surat Jalan Bengkel</span>
                    </div>
                    <p className="text-[11px] text-[#6B6560] leading-snug">
                      Unduh PDF perintah kerja rekondisi resmi sebelum dikirim ke bengkel cat.
                    </p>
                  </div>
                  <div className="mt-3 text-[11px] font-bold text-[#92400E] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Cetak PDF SPK</span>
                    <span>→</span>
                  </div>
                </a>

                {/* 3. Cek Fisik & Inspeksi */}
                <Link
                  href={`/admin/inspections/${createdVehicle.id}`}
                  className="p-3.5 rounded-2xl border border-[#D9D4CB] bg-[#F7F5F2] hover:bg-emerald-50 hover:border-emerald-300 transition-all group flex flex-col justify-between text-left"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                      <ClipboardCheck className="w-4 h-4 text-emerald-600" />
                      <span>Inspeksi 11 Panel</span>
                    </div>
                    <p className="text-[11px] text-[#6B6560] leading-snug">
                      Uji mikron cat &amp; verifikasi bodi bebas tabrak dan bebas banjir.
                    </p>
                  </div>
                  <div className="mt-3 text-[11px] font-bold text-emerald-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Mulai Cek Fisik</span>
                    <span>→</span>
                  </div>
                </Link>

                {/* 4. Upload Foto Media */}
                <Link
                  href={`/admin/inventory/${createdVehicle.id}/media`}
                  className="p-3.5 rounded-2xl border border-[#D9D4CB] bg-[#F7F5F2] hover:bg-blue-50 hover:border-blue-300 transition-all group flex flex-col justify-between text-left"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-800">
                      <Camera className="w-4 h-4 text-blue-600" />
                      <span>Upload Media &amp; Berkas</span>
                    </div>
                    <p className="text-[11px] text-[#6B6560] leading-snug">
                      Unggah foto eksterior, interior, serta scan STNK &amp; kuitansi lelang.
                    </p>
                  </div>
                  <div className="mt-3 text-[11px] font-bold text-blue-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Upload Media</span>
                    <span>→</span>
                  </div>
                </Link>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="border-t border-[#EFECE8] pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleResetForm}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#D9D4CB] text-xs font-bold text-[#6B6560] hover:text-[#1C1917] hover:bg-[#F7F5F2] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>+ Input Unit Mobil Lainnya</span>
              </button>

              <Link
                href="/admin/inventory"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#1C1917] hover:bg-[#44403C] text-white text-xs font-bold text-center shadow-md transition-all cursor-pointer"
              >
                Selesai &amp; Buka Daftar Inventori
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

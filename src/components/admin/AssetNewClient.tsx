"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Wrench,
  DollarSign,
  Calendar,
  MapPin,
  FileText,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Layers,
} from "lucide-react";
import { createShowroomAsset } from "@/app/actions/asset";

const ASSET_CATEGORIES = [
  { value: "INSPECTION_TOOLS", label: "Peralatan Cek Fisik & Inspeksi (OBD Scanner, Paint Gauge)" },
  { value: "WORKSHOP_EQUIPMENT", label: "Peralatan Poles, Cuci & Salon Garasi" },
  { value: "OFFICE_ELECTRONICS", label: "Elektronik Showroom & Kasir (Laptop, Printer, CCTV)" },
  { value: "FACILITY_FURNITURE", label: "Fasilitas & Display (Neon Box, Meja Tamu, Sofa)" },
  { value: "OPERATIONAL_VEHICLE", label: "Kendaraan Operasional Showroom" },
  { value: "OTHER", label: "Aset Inventaris Lainnya" },
];

const ASSET_CONDITIONS = [
  { value: "EXCELLENT", label: "Sangat Baik (Prima / Baru)" },
  { value: "GOOD", label: "Baik (Normal Operasional)" },
  { value: "FAIR", label: "Cukup (Perlu Servis Ringan)" },
  { value: "DAMAGED", label: "Rusak / Butuh Penggantian" },
];

export function AssetNewClient() {
  const router = useRouter();

  const [assetName, setAssetName] = useState("");
  const [assetCategory, setAssetCategory] = useState("INSPECTION_TOOLS");
  const [assetCondition, setAssetCondition] = useState("EXCELLENT");
  const [purchaseCost, setPurchaseCost] = useState<number | "">("");
  const [currentValue, setCurrentValue] = useState<number | "">("");
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [location, setLocation] = useState("Garasi Utama Nur Mobil");
  const [notes, setNotes] = useState("");
  const [recordCashOut, setRecordCashOut] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName.trim()) {
      setErrorMsg("Nama aset wajib diisi");
      return;
    }
    if (!purchaseCost || Number(purchaseCost) <= 0) {
      setErrorMsg("Harga beli awal aset harus lebih dari Rp 0");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await createShowroomAsset(
        {
          name: assetName.trim(),
          category: assetCategory as any,
          condition: assetCondition as any,
          purchaseCost: Number(purchaseCost),
          currentValue: currentValue ? Number(currentValue) : Number(purchaseCost),
          purchaseDate: new Date(purchaseDate),
          location: location.trim(),
          notes: notes.trim() || undefined,
        },
        recordCashOut
      );

      if (!res.success) {
        throw new Error(res.error || "Gagal menambahkan aset");
      }

      setSuccessMsg("Aset inventaris berhasil ditambahkan! Mengalihkan...");
      setTimeout(() => {
        router.push("/admin/finance/assets");
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal mencatat aset");
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9D4CB] pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/finance/assets"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#D9D4CB] text-[#1C1917] hover:bg-[#EFECE8] font-semibold text-xs transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-[#6B6560]" />
            <span>Kembali ke Aset Tetap</span>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#1C1917]">
              Tambah Aset Tetap & Inventaris Showroom
            </h1>
            <p className="text-xs text-[#6B6560]">
              Pencatatan peralatan bengkel, alat cek fisik, laptop, neon box, dan fasilitas garasi.
            </p>
          </div>
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border border-[#D9D4CB] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#EBE7E1] pb-3">
            <Wrench className="w-4 h-4 text-[#D97706]" />
            <h2 className="text-sm font-bold text-[#1C1917] uppercase tracking-wider">
              1. Identitas Barang / Peralatan
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                Nama Barang / Alat Inventaris *
              </label>
              <input
                required
                type="text"
                placeholder="Contoh: Mesin Poles Dual Action Shinemate, OBD2 Scanner Autel..."
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-semibold text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                Kondisi Fisik Alat *
              </label>
              <select
                value={assetCondition}
                onChange={(e) => setAssetCondition(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-medium text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
              >
                {ASSET_CONDITIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                Kategori Aset *
              </label>
              <select
                value={assetCategory}
                onChange={(e) => setAssetCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-semibold text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
              >
                {ASSET_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#6B6560]" />
                <span>Lokasi Penyimpanan</span>
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: Nilai Pembelian & Valuasi */}
        <div className="bg-white border border-[#D9D4CB] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#EBE7E1] pb-3">
            <DollarSign className="w-4 h-4 text-[#D97706]" />
            <h2 className="text-sm font-bold text-[#1C1917] uppercase tracking-wider">
              2. Nilai Pembelian & Tanggal Pengadaan
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                Harga Beli Awal (Rp) *
              </label>
              <input
                required
                type="number"
                min={1}
                placeholder="Contoh: 3500000"
                value={purchaseCost}
                onChange={(e) => {
                  const val = e.target.value === "" ? "" : Number(e.target.value);
                  setPurchaseCost(val);
                  if (!currentValue && val !== "") setCurrentValue(val);
                }}
                className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-bold text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                Taksiran Nilai Sekarang (Rp)
              </label>
              <input
                type="number"
                min={0}
                placeholder="Nilai setelah penyusutan"
                value={currentValue}
                onChange={(e) =>
                  setCurrentValue(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-bold text-[#16A34A] focus:outline-none focus:ring-2 focus:ring-[#16A34A]/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#6B6560]" />
                <span>Tanggal Beli / Masuk</span>
              </label>
              <input
                required
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-medium text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
              />
            </div>
          </div>

          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-amber-950">
              <input
                type="checkbox"
                checked={recordCashOut}
                onChange={(e) => setRecordCashOut(e.target.checked)}
                className="rounded text-[#D97706] focus:ring-[#D97706]"
              />
              <span>
                Potong saldo kas BCA showroom saat ini (Catat pengeluaran kas riil)
              </span>
            </label>
            <p className="text-[10px] text-amber-800 ml-5 mt-0.5">
              Centang jika barang baru dibeli menggunakan uang rekening showroom hari ini. Jangan centang jika ini inventaris lama bawaan.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#6B6560]" />
              <span>Catatan / Nomor Seri / Garansi</span>
            </label>
            <textarea
              rows={2}
              placeholder="Contoh: No seri 99281, garansi toko sampai Desember 2026..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40 resize-none"
            />
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 bg-[#EFECE8] border border-[#D9D4CB] rounded-2xl p-4">
          <Link
            href="/admin/finance/assets"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#D9D4CB] bg-white text-center text-sm font-semibold text-[#6B6560] hover:text-[#1C1917] hover:bg-[#F7F5F2] transition-colors shadow-xs"
          >
            Batal & Kembali
          </Link>

          <button
            type="submit"
            disabled={loading || !purchaseCost || Number(purchaseCost) <= 0}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-[#D97706] hover:bg-[#92400E] text-white rounded-xl text-sm font-bold shadow-md transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan Aset...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Simpan Aset Inventaris</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

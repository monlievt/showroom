"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Wrench,
  Receipt,
  Upload,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Calendar,
  Store,
  DollarSign,
  FileText,
  Car,
} from "lucide-react";
import { createExpenseAction } from "@/app/actions/expense";
import { formatRupiah } from "@/lib/utils";

interface VehicleSummary {
  id: string;
  plateNumber: string;
  brand: string;
  model: string;
  year: number;
  purchasePrice: number;
  totalExpenses: number;
  totalHpp: number;
  status: string;
}

const EXPENSE_CATEGORIES = [
  { value: "OIL_AND_SERVICE", label: "Oli, Tune Up & Servis Rutin" },
  { value: "BODY_REPAIR", label: "Body Repair, Ketok & Cat" },
  { value: "SALON_DETAILING", label: "Salon Interior, Eksterior & Detailing" },
  { value: "TIRES_AND_WHEELS", label: "Ganti Ban, Spooring & Balancing" },
  { value: "REGISTRATION_TAX", label: "Pajak Tahunan, Kaleng, Balik Nama & STNK" },
  { value: "ELECTRICAL", label: "Kelistrikan, Audio & AC Mobil" },
  { value: "SPAREPARTS", label: "Penggantian Sparepart & Kaki-kaki" },
  { value: "OTHER", label: "Biaya Operasional / Lainnya" },
];

export function VehicleExpenseNewClient({ vehicle }: { vehicle: VehicleSummary }) {
  const router = useRouter();

  const [category, setCategory] = useState("OIL_AND_SERVICE");
  const [vendorName, setVendorName] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [receiptUrl, setReceiptUrl] = useState<string>("");
  const [receiptFileName, setReceiptFileName] = useState<string>("");
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceiptFileName(file.name);
    setUploadingReceipt(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("vehicleId", vehicle.id);
      formData.append("uploadType", "RECEIPT");
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.fileUrl) {
        setReceiptUrl(data.fileUrl);
      } else {
        throw new Error(data.error || "Gagal upload nota");
      }
    } catch (err: any) {
      console.error("Error uploading receipt:", err);
      setErrorMsg("Gagal mengunggah foto nota: " + (err.message || ""));
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setErrorMsg("Nominal biaya harus lebih dari Rp 0");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await createExpenseAction({
        vehicleId: vehicle.id,
        category: category as any,
        vendorName: vendorName || "Bengkel / Toko",
        amount: Number(amount),
        date: new Date(date),
        notes,
        receiptUrl: receiptUrl || undefined,
      });

      if (!res.success) {
        throw new Error(res.error || "Gagal mencatat biaya");
      }

      setSuccessMsg("Biaya berhasil dicatat dan HPP unit berhasil diperbarui! Mengalihkan...");
      setTimeout(() => {
        router.push("/admin/inventory");
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal mencatat biaya");
      setLoading(false);
    }
  };

  const simulatedNewHpp = vehicle.totalHpp + (Number(amount) || 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
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
              Catat Biaya Perbaikan & HPP Unit
            </h1>
            <p className="text-xs text-[#6B6560]">
              Pengeluaran bengkel, salon, sparepart yang otomatis menambah Harga Pokok Penjualan (HPP).
            </p>
          </div>
        </div>
      </div>

      {/* Info Card Unit */}
      <div className="bg-[#EFECE8] border border-[#D9D4CB] rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-white rounded-xl border border-[#D9D4CB] text-[#D97706]">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-[#1C1917] tracking-tight">
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

        <div className="grid grid-cols-3 gap-3 border-t md:border-t-0 md:border-l border-[#D9D4CB] pt-3 md:pt-0 md:pl-5 text-right">
          <div>
            <span className="text-[10px] text-[#6B6560] block font-medium">Harga Beli</span>
            <span className="text-xs font-bold text-[#1C1917]">
              {formatRupiah(vehicle.purchasePrice)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[#6B6560] block font-medium">Biaya Berjalan</span>
            <span className="text-xs font-bold text-[#D97706]">
              {formatRupiah(vehicle.totalExpenses)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[#6B6560] block font-bold">HPP Sekarang</span>
            <span className="text-xs font-extrabold text-[#16A34A]">
              {formatRupiah(vehicle.totalHpp)}
            </span>
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
              Rincian Pengeluaran Servis / Perbaikan
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1.5 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-[#6B6560]" />
                <span>Kategori Pengeluaran *</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-semibold text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#6B6560]" />
                <span>Tanggal Pembayaran / Pengerjaan *</span>
              </label>
              <input
                required
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-medium text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1.5 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-[#6B6560]" />
                <span>Nama Bengkel / Vendor / Toko</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Bengkel Maju Lancar, Toko Aki Jaya..."
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-[#6B6560]" />
                <span>Nominal Biaya (Rp) *</span>
              </label>
              <input
                required
                type="number"
                min={1}
                placeholder="Contoh: 750000"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-bold text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#6B6560]" />
              <span>Deskripsi Pekerjaan / Catatan Sparepart</span>
            </label>
            <textarea
              rows={3}
              placeholder="Contoh: Ganti oli Shell Helix 4L + filter oli, kampas rem depan kiri kanan..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40 resize-none"
            />
          </div>

          {/* Upload Nota Fisik */}
          <div className="border-t border-[#EBE7E1] pt-4">
            <label className="block text-xs font-semibold text-[#1C1917] mb-1.5 flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-[#6B6560]" />
              <span>Lampirkan Foto Nota / Struk Fisik (Opsional)</span>
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                disabled={uploadingReceipt}
                className="w-full sm:flex-1 text-xs file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#1C1917] file:text-white hover:file:bg-[#D97706] file:cursor-pointer"
              />
              {uploadingReceipt && (
                <span className="text-xs text-[#D97706] flex items-center gap-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Mengunggah nota...
                </span>
              )}
              {receiptUrl && !uploadingReceipt && (
                <span className="text-xs text-[#16A34A] font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Nota Terunggah
                </span>
              )}
            </div>
            {receiptFileName && (
              <p className="text-[11px] text-[#6B6560] mt-1">File: {receiptFileName}</p>
            )}
          </div>
        </div>

        {/* Live Calculation Preview */}
        {amount && Number(amount) > 0 ? (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs flex items-center justify-between">
            <span className="text-amber-900 font-medium">
              Simulasi HPP Baru setelah biaya dicatat:
            </span>
            <div className="flex items-center gap-2">
              <span className="line-through text-[#6B6560]">
                {formatRupiah(vehicle.totalHpp)}
              </span>
              <span className="font-extrabold text-sm text-[#1C1917]">
                → {formatRupiah(simulatedNewHpp)}
              </span>
            </div>
          </div>
        ) : null}

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 bg-[#EFECE8] border border-[#D9D4CB] rounded-2xl p-4">
          <Link
            href="/admin/inventory"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#D9D4CB] bg-white text-center text-sm font-semibold text-[#6B6560] hover:text-[#1C1917] hover:bg-[#F7F5F2] transition-colors shadow-xs"
          >
            Batal & Kembali
          </Link>

          <button
            type="submit"
            disabled={loading || uploadingReceipt}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-[#D97706] hover:bg-[#92400E] text-white rounded-xl text-sm font-bold shadow-md transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan Biaya...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Simpan Biaya & Update HPP</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

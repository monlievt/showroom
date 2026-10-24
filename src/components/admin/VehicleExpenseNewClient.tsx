"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Wrench,
  Receipt,
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
import { formatRupiah, formatThousands, parseThousands } from "@/lib/utils";
import { ProofUploadField } from "@/components/admin/ProofUploadField";

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
  { value: "BODY_PAINT", label: "Body Repair, Ketok & Cat" },
  { value: "DETAILING_SALON", label: "Salon Interior, Eksterior & Detailing" },
  { value: "TIRES_AND_WHEELS", label: "Ganti Ban, Spooring & Balancing" },
  { value: "DOCUMENT_TAX_MUTATION", label: "Pajak Tahunan, Kaleng, Balik Nama & STNK" },
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
  const [proofUrls, setProofUrls] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

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
        receiptUrl: proofUrls.length > 0 ? JSON.stringify(proofUrls) : undefined,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/inventory"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[var(--line)] text-[var(--ink)] hover:bg-[var(--bg)] font-semibold text-xs transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-[var(--muted)]" />
            <span>Kembali ke Inventori</span>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[var(--ink)]">
              Catat Biaya Perbaikan & HPP Unit
            </h1>
            <p className="text-xs text-[var(--muted)]">
              Pengeluaran bengkel, salon, sparepart yang otomatis menambah Harga Pokok Penjualan (HPP).
            </p>
          </div>
        </div>
      </div>

      {/* Info Card Unit */}
      <div className="bg-[var(--bg)] border border-[var(--line)] rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-white rounded-xl border border-[var(--line)] text-[var(--accent)]">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-[var(--ink)] tracking-tight">
                {vehicle.brand} {vehicle.model}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-white border border-[var(--line)] font-bold text-[var(--ink)]">
                {vehicle.year}
              </span>
            </div>
            <div className="text-xs font-mono font-bold text-[var(--accent)] mt-0.5">
              {vehicle.plateNumber}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 border-t md:border-t-0 md:border-l border-[var(--line)] pt-3 md:pt-0 md:pl-5 text-right">
          <div>
            <span className="text-[10px] text-[var(--muted)] block font-medium">Harga Beli</span>
            <span className="text-xs font-bold text-[var(--ink)]">
              {formatRupiah(vehicle.purchasePrice)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[var(--muted)] block font-medium">Biaya Berjalan</span>
            <span className="text-xs font-bold text-[var(--accent)]">
              {formatRupiah(vehicle.totalExpenses)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[var(--muted)] block font-bold">HPP Sekarang</span>
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
        <div className="bg-white border border-[var(--line)] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[var(--line)] pb-3">
            <Wrench className="w-4 h-4 text-[var(--accent)]" />
            <h2 className="text-sm font-bold text-[var(--ink)] uppercase tracking-wider">
              Rincian Pengeluaran Servis / Perbaikan
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-[var(--muted)]" />
                <span>Kategori Pengeluaran *</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--line)] rounded-xl text-sm font-semibold text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[var(--muted)]" />
                <span>Tanggal Pembayaran / Pengerjaan *</span>
              </label>
              <input
                required
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--line)] rounded-xl text-sm font-medium text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-[var(--muted)]" />
                <span>Nama Bengkel / Vendor / Toko</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Bengkel Maju Lancar, Toko Aki Jaya..."
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--line)] rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-[var(--muted)]" />
                <span>Nominal Biaya (Rp) *</span>
              </label>
              <input
                required
                type="text"
                inputMode="numeric"
                placeholder="Contoh: 750.000"
                value={amount ? formatThousands(amount) : ""}
                onChange={(e) => setAmount(parseThousands(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--line)] rounded-xl text-sm font-bold text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[var(--muted)]" />
              <span>Deskripsi Pekerjaan / Catatan Sparepart</span>
            </label>
            <textarea
              rows={3}
              placeholder="Contoh: Ganti oli Shell Helix 4L + filter oli, kampas rem depan kiri kanan..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--line)] rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 resize-none"
            />
          </div>

          {/* Upload Nota Fisik - menggunakan ProofUploadField */}
          <div className="border-t border-[var(--line)] pt-4">
            <ProofUploadField
              label="Lampiran Foto Nota / Struk / Screenshot Pembayaran (Bisa Beberapa)"
              value={proofUrls}
              onChange={setProofUrls}
              uploadType="RECEIPT"
              vehicleId={vehicle.id}
            />
          </div>
        </div>

        {/* Live Calculation Preview */}
        {amount && Number(amount) > 0 ? (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs flex items-center justify-between">
            <span className="text-amber-900 font-medium">
              Simulasi HPP Baru setelah biaya dicatat:
            </span>
            <div className="flex items-center gap-2">
              <span className="line-through text-[var(--muted)]">
                {formatRupiah(vehicle.totalHpp)}
              </span>
              <span className="font-extrabold text-sm text-[var(--ink)]">
                → {formatRupiah(simulatedNewHpp)}
              </span>
            </div>
          </div>
        ) : null}

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 bg-[var(--bg)] border border-[var(--line)] rounded-2xl p-4">
          <Link
            href="/admin/inventory"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[var(--line)] bg-white text-center text-sm font-semibold text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--bg)] transition-colors shadow-xs"
          >
            Batal & Kembali
          </Link>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-[var(--accent)] hover:bg-[#92400E] text-white rounded-xl text-sm font-bold shadow-md transition-colors disabled:opacity-50 cursor-pointer"
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

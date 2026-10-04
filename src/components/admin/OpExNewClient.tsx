"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building,
  DollarSign,
  Calendar,
  Store,
  FileText,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Info,
} from "lucide-react";
import { formatThousands, parseThousands } from "@/lib/utils";
import { recordOperationalExpense } from "@/app/actions/operational-expense";
import { ProofUploadField } from "@/components/admin/ProofUploadField";

const OPEX_CATEGORIES = [
  { value: "RENT_SHOWROOM", label: "Sewa Lahan & Garasi Showroom" },
  { value: "UTILITIES_WIFI", label: "Listrik, Air & WiFi Internet" },
  { value: "MARKETING_ADS", label: "Iklan Berbayar FB/IG, TikTok & OLX" },
  { value: "SALARY_WAGES", label: "Gaji & Upah Karyawan Showroom" },
  { value: "OFFICE_SUPPLIES", label: "Kertas, ATK, Kwitansi & Materai" },
  { value: "CONSUMPTION_GUEST", label: "Kopi, Air Mineral & Jamuan Tamu/Customer" },
  { value: "MAINTENANCE", label: "Perawatan Fasilitas Garasi & Kebersihan" },
  { value: "OTHER", label: "Beban Operasional Rutin Lainnya" },
];

export function OpExNewClient() {
  const router = useRouter();

  const [category, setCategory] = useState("RENT_SHOWROOM");
  const [amount, setAmount] = useState<number | "">("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [vendorName, setVendorName] = useState("");
  const [notes, setNotes] = useState("");
  const [proofUrls, setProofUrls] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setErrorMsg("Nominal beban operasional harus lebih dari Rp 0");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await recordOperationalExpense({
        category: category as any,
        amount: Number(amount),
        date: new Date(date),
        recipient: vendorName || undefined,
        notes: notes || undefined,
        proofUrls: proofUrls.length > 0 ? proofUrls : undefined,
      });

      if (!res.success) {
        throw new Error(res.error || "Gagal mencatat beban operasional");
      }

      setSuccessMsg("Beban operasional berhasil dicatat! Mengalihkan...");
      setTimeout(() => {
        router.push("/admin/finance/expenses");
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal mencatat beban operasional");
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9D4CB] pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/finance/expenses"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#D9D4CB] text-[#1C1917] hover:bg-[#EFECE8] font-semibold text-xs transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-[#6B6560]" />
            <span>Kembali ke Beban &amp; Prive</span>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#1C1917]">
              Catat Beban Operasional Showroom
            </h1>
            <p className="text-xs text-[#6B6560]">
              Pengeluaran ruko, listrik, gaji, iklan yang tidak dibebankan ke HPP unit mobil.
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <strong className="block font-bold">Pemisahan Biaya Ruko vs Biaya Mobil:</strong>
          <span>
            Beban operasional showroom dicatat terpisah agar tidak menggelembungkan HPP kendaraan dan tidak mengurangi hak bagi hasil per unit bagi investor.
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border border-[#D9D4CB] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#EBE7E1] pb-3">
            <Building className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-[#1C1917] uppercase tracking-wider">
              Rincian Beban Operasional
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                Kategori Beban *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-semibold text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {OPEX_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-[#6B6560]" />
                <span>Nominal Pengeluaran (Rp) *</span>
              </label>
              <input
                required
                type="text"
                inputMode="numeric"
                placeholder="Contoh: 1.500.000"
                value={amount !== "" ? formatThousands(amount) : ""}
                onChange={(e) => setAmount(parseThousands(e.target.value) || "")}
                className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-bold text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#6B6560]" />
                <span>Tanggal Transaksi *</span>
              </label>
              <input
                required
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-medium text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1.5 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-[#6B6560]" />
                <span>Penerima / Vendor / Pemilik Ruko</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: PLN, Indihome, Pemilik Ruko Pak Haji..."
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#6B6560]" />
              <span>Keterangan Tambahan</span>
            </label>
            <textarea
              rows={2}
              placeholder="Contoh: Pembayaran internet periode Oktober, iuran kebersihan..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
            />
          </div>

          {/* Proof Upload */}
          <ProofUploadField
            label="Lampiran Bukti Pembayaran / Kwitansi / Nota (Bisa Beberapa Foto)"
            value={proofUrls}
            onChange={setProofUrls}
            uploadType="RECEIPT"
            referenceId="opex"
          />
        </div>

        {/* Bottom Actions Bar */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 bg-[#EFECE8] border border-[#D9D4CB] rounded-2xl p-4">
          <Link
            href="/admin/finance/expenses"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#D9D4CB] bg-white text-center text-sm font-semibold text-[#6B6560] hover:text-[#1C1917] hover:bg-[#F7F5F2] transition-colors shadow-xs"
          >
            Batal &amp; Kembali
          </Link>

          <button
            type="submit"
            disabled={loading || !amount || Number(amount) <= 0}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan Beban...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Simpan Beban Operasional</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

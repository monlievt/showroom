"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ShoppingBag,
  DollarSign,
  Calendar,
  FileText,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Info,
} from "lucide-react";
import { recordOwnerDraw } from "@/app/actions/operational-expense";
import { ProofUploadField } from "@/components/admin/ProofUploadField";

export function OwnerDrawNewClient() {
  const router = useRouter();

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
      setErrorMsg("Nominal prive harus lebih dari Rp 0");
      return;
    }
    if (!notes.trim()) {
      setErrorMsg("Keterangan kebutuhan pribadi wajib diisi");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await recordOwnerDraw({
        amount: Number(amount),
        date: new Date(date),
        notes: notes.trim(),
        proofUrls: proofUrls.length > 0 ? proofUrls : undefined,
      });

      if (!res.success) {
        throw new Error(res.error || "Gagal mencatat prive owner");
      }

      setSuccessMsg("Pengambilan prive pribadi berhasil dicatat! Mengalihkan...");
      setTimeout(() => {
        router.push("/admin/finance/expenses");
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal mencatat prive");
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
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
              Catat Prive (Kebutuhan Pribadi Owner)
            </h1>
            <p className="text-xs text-[#6B6560]">
              Penarikan uang dari rekening BCA showroom untuk kebutuhan dapur/keluarga.
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200 text-xs text-purple-900 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
        <div>
          <strong className="block font-bold">Prinsip Rekening Campur BCA:</strong>
          <span>
            Uang kas rekening bank akan berkurang secara riil, namun <strong>TIDAK dimasukkan ke biaya unit mobil</strong>. Dengan demikian, laba kotor mobil dan bagian bagi hasil investor tidak akan berkurang secara sepihak.
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
            <ShoppingBag className="w-4 h-4 text-purple-600" />
            <h2 className="text-sm font-bold text-[#1C1917] uppercase tracking-wider">
              Form Penarikan Prive
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-[#6B6560]" />
                <span>Nominal Penarikan Pribadi (Rp) *</span>
              </label>
              <input
                required
                type="number"
                min={1}
                placeholder="Contoh: 2000000"
                value={amount}
                onChange={(e) =>
                  setAmount(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-bold text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#6B6560]" />
                <span>Tanggal Penarikan / Transfer *</span>
              </label>
              <input
                required
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-medium text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#6B6560]" />
              <span>Keterangan Kebutuhan Keluarga / Pribadi *</span>
            </label>
            <textarea
              rows={3}
              required
              placeholder="Contoh: Belanja bulanan dapur, bayar SPP anak sekolah, keperluan darurat keluarga..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-none"
            />
          </div>

          {/* Proof Upload */}
          <ProofUploadField
            label="Lampiran Bukti Transfer / Screenshot Penarikan (Opsional)"
            value={proofUrls}
            onChange={setProofUrls}
            uploadType="TRANSFER_PROOF"
            referenceId="owner-draw"
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
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold shadow-md transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan Prive...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Simpan Penarikan Prive</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

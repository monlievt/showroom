"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Receipt,
  DollarSign,
  FileText,
  AlertTriangle,
  CheckCircle,
  Loader2,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { formatThousands, parseThousands } from "@/lib/utils";
import { recordManualCashTransaction } from "@/app/actions/cash-transaction";
import { ProofUploadField } from "@/components/admin/ProofUploadField";

export function CashTransactionNewClient() {
  const router = useRouter();

  const [cashType, setCashType] = useState("IN_CAPITAL_DEPOSIT");
  const [amount, setAmount] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [proofUrls, setProofUrls] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const isIncome = cashType.startsWith("IN_");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setErrorMsg("Nominal transaksi harus lebih dari Rp 0");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await recordManualCashTransaction({
        type: cashType as any,
        amount: Number(amount),
        notes: notes.trim() || undefined,
        proofUrls: proofUrls.length > 0 ? proofUrls : undefined,
      });

      if (!res.success) {
        throw new Error(res.error || "Gagal mencatat transaksi kas");
      }

      setSuccessMsg("Transaksi kas berhasil dibukukan! Mengalihkan...");
      setTimeout(() => {
        router.push("/admin/finance");
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal mencatat transaksi kas");
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9D4CB] pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/finance"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#D9D4CB] text-[#1C1917] hover:bg-[#EFECE8] font-semibold text-xs transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-[#6B6560]" />
            <span>Kembali ke Arus Kas</span>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#1C1917]">
              Pencatatan Transaksi Kas Manual
            </h1>
            <p className="text-xs text-[#6B6560]">
              Penyesuaian saldo rekening kas masuk atau keluar di luar modul mobil &amp; penjualan.
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
            <Receipt className="w-4 h-4 text-[#D97706]" />
            <h2 className="text-sm font-bold text-[#1C1917] uppercase tracking-wider">
              Rincian Kas Masuk / Keluar
            </h2>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
              Tipe Transaksi Kas *
            </label>
            <select
              value={cashType}
              onChange={(e) => setCashType(e.target.value)}
              className="w-full px-3.5 py-3 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-semibold text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
            >
              <optgroup label="🟢 Kas Masuk (Menambah Saldo BCA)">
                <option value="IN_CAPITAL_DEPOSIT">Setor Modal Umum / Investor</option>
                <option value="IN_OWNER_EQUITY">Setor Modal Tambahan Pribadi Owner</option>
                <option value="IN_OTHER">Pemasukan Kas Lainnya</option>
              </optgroup>
              <optgroup label="🔴 Kas Keluar (Mengurangi Saldo BCA)">
                <option value="OUT_CAPITAL_RETURN">Penarikan / Pengembalian Modal</option>
                <option value="OUT_OTHER">Pengeluaran Kas Lainnya</option>
              </optgroup>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1.5 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-[#6B6560]" />
              <span>Nominal Transaksi (Rp) *</span>
            </label>
            <input
              required
              type="text"
              inputMode="numeric"
              placeholder="Contoh: 5.000.000"
              value={amount !== "" ? formatThousands(amount) : ""}
              onChange={(e) => setAmount(parseThousands(e.target.value) || "")}
              className={`w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-bold focus:outline-none focus:ring-2 ${
                isIncome
                  ? "text-emerald-700 focus:ring-emerald-500/20"
                  : "text-red-700 focus:ring-red-500/20"
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#6B6560]" />
              <span>Keterangan Transaksi</span>
            </label>
            <textarea
              rows={3}
              placeholder="Penjelasan mutasi untuk arsip pembukuan kas..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40 resize-none"
            />
          </div>

          {/* Proof Upload */}
          <ProofUploadField
            value={proofUrls}
            onChange={setProofUrls}
            uploadType="TRANSFER_PROOF"
            referenceId="cash-transaction"
          />
        </div>

        {/* Live Card Preview */}
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between ${
            isIncome
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-red-50 border-red-200 text-red-900"
          }`}
        >
          <div className="flex items-center gap-2">
            {isIncome ? (
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600" />
            )}
            <span className="font-semibold">
              Efek pada Buku Kas: {isIncome ? "Saldo BCA Bertambah (+)" : "Saldo BCA Berkurang (-)"}
            </span>
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 bg-[#EFECE8] border border-[#D9D4CB] rounded-2xl p-4">
          <Link
            href="/admin/finance"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#D9D4CB] bg-white text-center text-sm font-semibold text-[#6B6560] hover:text-[#1C1917] hover:bg-[#F7F5F2] transition-colors shadow-xs"
          >
            Batal &amp; Kembali
          </Link>

          <button
            type="submit"
            disabled={loading || !amount || Number(amount) <= 0}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-[#D97706] hover:bg-[#92400E] text-white rounded-xl text-sm font-bold shadow-md transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Membukukan Kas...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Simpan Transaksi Kas</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

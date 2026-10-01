"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Coins,
  DollarSign,
  User,
  FileText,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Info,
} from "lucide-react";
import { depositInvestorCapital } from "@/app/actions/capital-ledger";

interface InvestorOption {
  id: string;
  name: string;
  type: string;
}

export function InvestorDepositNewClient({
  investors,
}: {
  investors: InvestorOption[];
}) {
  const router = useRouter();

  const [selectedInvestorId, setSelectedInvestorId] = useState(
    investors[0]?.id || ""
  );
  const [amount, setAmount] = useState<number | "">("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvestorId) {
      setErrorMsg("Pilih akun investor terlebih dahulu");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setErrorMsg("Nominal setoran modal harus lebih dari Rp 0");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await depositInvestorCapital({
        investorId: selectedInvestorId,
        type: "DEPOSIT",
        amount: Number(amount),
        notes: notes || undefined,
      });

      if (!res.success) {
        throw new Error(res.error || "Gagal mencatat setoran modal investor");
      }

      setSuccessMsg(
        "Setoran modal investor berhasil dicatat pada Ledger & Kas Umum! Mengalihkan..."
      );
      setTimeout(() => {
        router.push("/admin/investors/accounts");
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal mencatat setoran modal");
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9D4CB] pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/investors/accounts"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#D9D4CB] text-[#1C1917] hover:bg-[#EFECE8] font-semibold text-xs transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-[#6B6560]" />
            <span>Kembali ke Akun Investor</span>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#1C1917]">
              Penyetoran Modal Investor
            </h1>
            <p className="text-xs text-[#6B6560]">
              Pencatatan dana segar yang disetorkan investor ke rekening operasional showroom.
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <strong className="block font-bold">Sinkronisasi Ledger & Buku Kas:</strong>
          <span>
            Setoran modal secara otomatis menambah saldo berjalan di <strong>Capital Ledger Investor</strong> sekaligus menambah kas masuk (IN_CAPITAL_DEPOSIT) di buku kas utama rekening BCA showroom.
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
            <Coins className="w-4 h-4 text-[#D97706]" />
            <h2 className="text-sm font-bold text-[#1C1917] uppercase tracking-wider">
              Rincian Setoran Modal Investor
            </h2>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#6B6560]" />
              <span>Pilih Akun Investor *</span>
            </label>
            {investors.length === 0 ? (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-semibold">
                Belum ada profil investor. Silakan buat investor baru terlebih dahulu.
              </div>
            ) : (
              <select
                required
                value={selectedInvestorId}
                onChange={(e) => setSelectedInvestorId(e.target.value)}
                className="w-full px-3.5 py-3 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-bold text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
              >
                {investors.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.name} ({inv.type === "MOTHER_SIBLING" ? "4 Saudara" : inv.type})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1.5 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-[#6B6560]" />
              <span>Nominal Setoran Modal (Rp) *</span>
            </label>
            <input
              required
              type="number"
              min={1}
              placeholder="Contoh: 50000000"
              value={amount}
              onChange={(e) =>
                setAmount(
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
              className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-bold text-[#16A34A] focus:outline-none focus:ring-2 focus:ring-[#16A34A]/40"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#6B6560]" />
              <span>Keterangan / Catatan Transfer Bank</span>
            </label>
            <textarea
              rows={3}
              placeholder="Contoh: Transfer modal tambahan via BCA untuk alokasi lelang unit Fortuner..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40 resize-none"
            />
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 bg-[#EFECE8] border border-[#D9D4CB] rounded-2xl p-4">
          <Link
            href="/admin/investors/accounts"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#D9D4CB] bg-white text-center text-sm font-semibold text-[#6B6560] hover:text-[#1C1917] hover:bg-[#F7F5F2] transition-colors shadow-xs"
          >
            Batal & Kembali
          </Link>

          <button
            type="submit"
            disabled={loading || !amount || Number(amount) <= 0 || investors.length === 0}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-[#D97706] hover:bg-[#92400E] text-white rounded-xl text-sm font-bold shadow-md transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Membukukan Modal...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Simpan Setoran Modal</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

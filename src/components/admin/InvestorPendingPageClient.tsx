"use client";

import React, { useState } from "react";
import {
  HeartHandshake,
  CheckCircle2,
  Coins,
  TrendingUp,
  Building,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Sparkles
} from "lucide-react";
import { formatRupiah, formatDate, cn } from "@/lib/utils";
import { executeProfitDistribution } from "@/app/actions/finance";
import { InvestorSubNav } from "./InvestorSubNav";

interface InvestorPendingProps {
  summary: {
    activeAllocatedCapital: number;
    totalProfitPaid: number;
    totalOwnerProfit: number;
    totalInvestorProfit: number;
    pendingDistributionsCount: number;
  };
  pendingSales: Array<{
    id: string;
    vehicleId: string;
    vehiclePlate: string;
    vehicleName: string;
    sellingPrice: number;
    paidAmount: number;
    hpp: number;
    grossProfit: number;
    buyerName: string;
  }>;
  totalInvestorsCount: number;
  totalHistoryCount: number;
}

export function InvestorPendingPageClient({
  summary,
  pendingSales,
  totalInvestorsCount,
  totalHistoryCount,
}: InvestorPendingProps) {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showNotification = (message: string, type: "success" | "error") => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleExecuteDistribution = async (saleId: string) => {
    if (!confirm("Eksekusi pembagian laba untuk transaksi penjualan ini? Snapshot aturan & mutasi ledger akan dicatat secara permanen.")) {
      return;
    }

    setLoading(true);
    const res = await executeProfitDistribution(saleId);
    setLoading(false);

    if (res.success) {
      showNotification("Distribusi laba berhasil dieksekusi secara deterministik!", "success");
    } else {
      showNotification(res.error || "Gagal mengeksekusi distribusi laba", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {feedback && (
        <div
          className={cn(
            "p-4 rounded-xl text-sm font-medium flex items-center justify-between border shadow-sm transition-all",
            feedback.type === "success"
              ? "bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]"
              : "bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]"
          )}
        >
          <span>{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs underline hover:opacity-80 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Sub-Navigation Pills */}
      <InvestorSubNav
        pendingCount={pendingSales.length}
        investorsCount={totalInvestorsCount}
        historyCount={totalHistoryCount}
      />

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#D9D4CB] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#6B6560]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Unit Siap Dibagi Laba</span>
            <HeartHandshake className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-[#1C1917] tracking-tight">
            {pendingSales.length} <span className="text-xs font-semibold text-[#6B6560]">Unit</span>
          </div>
          <p className="text-xs text-amber-700 font-medium">Lunas 100% & menunggu eksekusi</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#D9D4CB] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#6B6560]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Modal Investor Terikat</span>
            <Coins className="w-4 h-4 text-[#D97706]" />
          </div>
          <div className="text-2xl font-black text-[#1C1917] tracking-tight">
            {formatRupiah(summary.activeAllocatedCapital)}
          </div>
          <p className="text-xs text-[#6B6560]">Dana berputar di unit mobil aktif</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#D9D4CB] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#6B6560]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Laba Investor</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 tracking-tight">
            {formatRupiah(summary.totalInvestorProfit)}
          </div>
          <p className="text-xs text-[#6B6560]">Total dibagikan ke mitra & keluarga</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#D9D4CB] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#6B6560]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Laba Owner</span>
            <Building className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-700 tracking-tight">
            {formatRupiah(summary.totalOwnerProfit)}
          </div>
          <p className="text-xs text-[#6B6560]">Bagian hasil bersih pengelola showroom</p>
        </div>
      </div>

      {/* Tabel Unit Siap Bagi Hasil */}
      <div className="bg-white rounded-2xl border border-[#D9D4CB] overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-[#D9D4CB] flex items-center justify-between bg-[#F7F5F2]">
          <div>
            <h3 className="font-bold text-sm text-[#1C1917]">
              Daftar Penjualan Mobil Lunas — Menunggu Distribusi Laba
            </h3>
            <p className="text-xs text-[#6B6560] mt-0.5">
              Sesuai SOP, bagi hasil hanya dieksekusi setelah pembayaran pembeli <strong>lunas 100%</strong>.
            </p>
          </div>
          <span className="bg-amber-100 text-amber-800 text-xs px-3 py-1 rounded-full font-bold">
            {pendingSales.length} Unit Siap
          </span>
        </div>

        {pendingSales.length === 0 ? (
          <div className="p-12 text-center text-[#6B6560] space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto opacity-80" />
            <p className="text-sm font-bold text-[#1C1917]">Semua unit terjual sudah didistribusikan labanya</p>
            <p className="text-xs text-[#6B6560]">Tidak ada antrean pembagian laba yang tertunda saat ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#EFECE8] text-[#6B6560] uppercase text-[10px] sm:text-[11px] font-bold tracking-wider border-b border-[#D9D4CB]">
                <tr>
                  <th className="py-3 px-4">Unit Mobil & Plat</th>
                  <th className="py-3 px-4">Pembeli</th>
                  <th className="py-3 px-4 text-right">Harga Jual</th>
                  <th className="py-3 px-4 text-right">HPP Berjalan</th>
                  <th className="py-3 px-4 text-right">Laba Kotor</th>
                  <th className="py-3 px-4 text-center">Aksi Distribusi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9D4CB]">
                {pendingSales.map((s) => (
                  <tr key={s.id} className="hover:bg-[#F7F5F2] transition-colors">
                    <td className="py-4 px-4">
                      <span className="font-bold text-sm text-[#1C1917] block">{s.vehiclePlate}</span>
                      <span className="text-xs text-[#6B6560]">{s.vehicleName}</span>
                    </td>
                    <td className="py-4 px-4 text-[#1C1917] font-medium">{s.buyerName}</td>
                    <td className="py-4 px-4 text-right font-semibold text-[#1C1917]">
                      {formatRupiah(s.sellingPrice)}
                    </td>
                    <td className="py-4 px-4 text-right text-[#6B6560]">
                      {formatRupiah(s.hpp)}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span
                        className={cn(
                          "font-bold",
                          s.grossProfit >= 0 ? "text-emerald-700" : "text-rose-700"
                        )}
                      >
                        {formatRupiah(s.grossProfit)}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        disabled={loading}
                        onClick={() => handleExecuteDistribution(s.id)}
                        className="bg-[#D97706] hover:bg-[#B45309] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {loading ? "Memproses..." : "Eksekusi Bagi Hasil"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

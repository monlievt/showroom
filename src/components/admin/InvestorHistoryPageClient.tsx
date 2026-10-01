"use client";

import React, { useState } from "react";
import {
  Clock,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Search,
  TrendingUp,
  Coins,
  ShieldAlert,
  Car
} from "lucide-react";
import { formatRupiah, formatDate, cn } from "@/lib/utils";
import { reverseDistribution } from "@/app/actions/finance";
import { InvestorSubNav } from "./InvestorSubNav";

interface InvestorHistoryProps {
  distributions: Array<{
    id: string;
    saleId: string;
    vehiclePlate: string;
    vehicleName: string;
    calculatedAt: string | Date;
    grossProfitAtCalc: number;
    beneficiaryName: string;
    beneficiaryType: string;
    calculatedAmount: number;
    notes?: string | null;
  }>;
  pendingCount: number;
  totalInvestorsCount: number;
}

export function InvestorHistoryPageClient({
  distributions,
  pendingCount,
  totalInvestorsCount,
}: InvestorHistoryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showNotification = (message: string, type: "success" | "error") => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleReverseDistribution = async (saleId: string) => {
    if (!confirm("Batalkan (Reverse) pembagian laba ini? Saldo modal dan kas akan dikembalikan ke kondisi sebelum bagi hasil dieksekusi.")) {
      return;
    }

    setLoading(true);
    const res = await reverseDistribution(saleId, "Reversal manual oleh Admin");
    setLoading(false);

    if (res.success) {
      showNotification("Distribusi berhasil di-reverse secara akuntansi!", "success");
    } else {
      showNotification(res.error || "Gagal melakukan reversal", "error");
    }
  };

  const filteredDistributions = distributions.filter((d) => {
    return (
      d.vehiclePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.vehicleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.beneficiaryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.notes || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const totalDistributed = distributions
    .filter((d) => !d.notes?.includes("[REVERSED]"))
    .reduce((sum, d) => sum + Number(d.calculatedAmount), 0);

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
        pendingCount={pendingCount}
        investorsCount={totalInvestorsCount}
        historyCount={distributions.length}
      />

      {/* 3 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#D9D4CB] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#6B6560]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Eksekusi Bagi Hasil</span>
            <Clock className="w-5 h-5 text-[#D97706]" />
          </div>
          <div className="text-2xl font-black text-[#1C1917] tracking-tight">
            {distributions.length} <span className="text-xs font-semibold text-[#6B6560]">Transaksi</span>
          </div>
          <p className="text-xs text-[#6B6560]">Riwayat snapshot permanen bagi hasil</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#D9D4CB] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#6B6560]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Dana Dibagikan</span>
            <Coins className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 tracking-tight">
            {formatRupiah(totalDistributed)}
          </div>
          <p className="text-xs text-[#6B6560]">Total transfer bagi hasil yang valid</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#D9D4CB] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#6B6560]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Integritas Ledger</span>
            <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />
          </div>
          <div className="text-2xl font-black text-[#1C1917] tracking-tight">
            100% Audit Trail
          </div>
          <p className="text-xs text-[#16A34A] font-semibold">Tercatat permanen & reversible</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#D9D4CB] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#6B6560] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari plat nomor, nama penerima, atau tipe investor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[#D9D4CB] rounded-xl text-xs sm:text-sm bg-[#F7F5F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D97706]/20 transition-all"
          />
        </div>
        <span className="text-xs font-semibold text-[#6B6560]">
          Menampilkan {filteredDistributions.length} dari {distributions.length} riwayat
        </span>
      </div>

      {/* Tabel Riwayat Distribusi */}
      <div className="bg-white rounded-2xl border border-[#D9D4CB] overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-[#D9D4CB] flex items-center justify-between bg-[#F7F5F2]">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#D97706]" />
            <h3 className="font-bold text-sm text-[#1C1917]">
              Riwayat Pembagian Laba Penjualan Unit
            </h3>
          </div>
        </div>

        {distributions.length === 0 ? (
          <div className="p-12 text-center text-[#6B6560]">
            Belum ada riwayat pembagian laba yang dicatat.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#EFECE8] text-[#6B6560] uppercase text-[10px] sm:text-[11px] font-bold tracking-wider border-b border-[#D9D4CB]">
                <tr>
                  <th className="py-3 px-4">Tanggal Eksekusi</th>
                  <th className="py-3 px-4">Unit Mobil</th>
                  <th className="py-3 px-4">Penerima Manfaat</th>
                  <th className="py-3 px-4 text-right">Laba Kotor Unit</th>
                  <th className="py-3 px-4 text-right">Nominal Bagian</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9D4CB]">
                {filteredDistributions.map((d) => {
                  const isReversed = d.notes?.includes("[REVERSED]");
                  return (
                    <tr key={d.id} className={cn("hover:bg-[#F7F5F2] transition-colors", isReversed && "opacity-60 bg-red-50/30")}>
                      <td className="py-3.5 px-4 whitespace-nowrap text-[#6B6560]">
                        {formatDate(d.calculatedAt)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-sm text-[#1C1917] block">{d.vehiclePlate}</span>
                        <span className="text-xs text-[#6B6560]">{d.vehicleName}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-[#1C1917] block">{d.beneficiaryName}</span>
                        <span className="text-[11px] text-[#6B6560]">({d.beneficiaryType})</span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-[#6B6560]">
                        {formatRupiah(d.grossProfitAtCalc)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black">
                        <span className={isReversed ? "text-red-600 line-through" : "text-emerald-700"}>
                          {formatRupiah(d.calculatedAmount)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {isReversed ? (
                          <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-200">
                            DIBATALKAN
                          </span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                            LUNAS
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {!isReversed && (
                          <button
                            disabled={loading}
                            onClick={() => handleReverseDistribution(d.saleId)}
                            className="inline-flex items-center gap-1 text-[11px] text-[#6B6560] hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                            title="Reversal akuntansi jika ada koreksi data penjualan"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-red-500" />
                            <span>Reversal</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

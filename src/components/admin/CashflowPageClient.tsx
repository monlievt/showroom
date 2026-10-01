"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Wallet,
  Receipt,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Building,
  Car,
  ShoppingBag
} from "lucide-react";
import { formatRupiah, formatDate, cn } from "@/lib/utils";
import { recordManualCashTransaction } from "@/app/actions/cash-transaction";
import { FinanceSubNav } from "./FinanceSubNav";

interface CashflowPageProps {
  summary: {
    cashBalance: number;
    activeAllocatedCapital: number;
    totalProfitPaid: number;
    totalOwnerProfit: number;
    totalInvestorProfit: number;
    totalInventoryValue?: number;
    totalAssetValue?: number;
    totalOperationalExpenses?: number;
    totalOwnerDraw?: number;
    totalOwnerEquity?: number;
    activeVehiclesCount?: number;
    assetsCount?: number;
  };
  cashTransactions: Array<{
    id: string;
    type: string;
    amount: number;
    runningBalance: number;
    notes?: string | null;
    createdAt: string | Date;
    createdBy: string;
    vehiclePlate?: string;
    vehicleName?: string;
    expenseCategory?: string;
  }>;
}

const CASH_TYPE_LABELS: Record<string, string> = {
  IN_CAPITAL_DEPOSIT: "Setor Modal",
  IN_OWNER_EQUITY: "Setor Modal Pribadi",
  IN_CAR_SALE_FULL: "Pelunasan Penjualan Mobil",
  IN_CAR_SALE_DP: "DP / Titipan Penjualan",
  IN_OTHER: "Pemasukan Lainnya",
  OUT_CAR_PURCHASE: "Pembelian Unit Mobil (Kulakan)",
  OUT_CAR_EXPENSE: "Biaya Perbaikan / Salon Unit",
  OUT_OPERATIONAL: "Beban Operasional Showroom",
  OUT_OWNER_DRAW: "Prive Pribadi (Keluarga)",
  OUT_ASSET_PURCHASE: "Pembelian Aset Peralatan",
  OUT_PROFIT_DISTRIBUTION: "Pencairan Bagi Hasil",
  OUT_CAPITAL_WITHDRAWAL: "Tarik Modal",
  OUT_OTHER: "Pengeluaran Lainnya",
};

export function CashflowPageClient({ summary, cashTransactions }: CashflowPageProps) {
  const [showManualCashModal, setShowManualCashModal] = useState(false);
  const [cashType, setCashType] = useState("IN_CAPITAL_DEPOSIT");
  const [cashAmount, setCashAmount] = useState("");
  const [cashNotes, setCashNotes] = useState("");
  const [cashFilter, setCashFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showNotification = (message: string, type: "success" | "error") => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleManualCashSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cashAmount) return;

    setLoading(true);
    const res = await recordManualCashTransaction({
      type: cashType as any,
      amount: Number(cashAmount),
      notes: cashNotes,
    });
    setLoading(false);

    if (res.success) {
      showNotification("Transaksi kas berhasil dicatat di buku kas rekening!", "success");
      setShowManualCashModal(false);
      setCashAmount("");
      setCashNotes("");
    } else {
      showNotification(res.error || "Gagal mencatat transaksi kas", "error");
    }
  };

  // Filter Mutasi Kas
  const filteredCashList = cashTransactions.filter((item) => {
    const matchesFilter =
      cashFilter === "ALL"
        ? true
        : cashFilter === "IN"
        ? item.type.startsWith("IN_")
        : cashFilter === "OUT"
        ? item.type.startsWith("OUT_")
        : item.type === cashFilter;

    const matchesSearch =
      (item.notes || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.vehiclePlate || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (CASH_TYPE_LABELS[item.type] || item.type).toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const totalIn = cashTransactions
    .filter((t) => t.type.startsWith("IN_"))
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalOut = cashTransactions
    .filter((t) => t.type.startsWith("OUT_"))
    .reduce((sum, t) => sum + Number(t.amount), 0);

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
      <FinanceSubNav assetsCount={summary.assetsCount} />

      {/* KPI Cards Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saldo Kas BCA */}
        <div className="bg-white p-5 rounded-2xl border border-[#D9D4CB] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#6B6560]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Kas Rekening BCA</span>
            <Wallet className="w-4 h-4 text-[#D97706]" />
          </div>
          <div className="text-2xl font-black text-[#1C1917] tracking-tight">
            {formatRupiah(summary.cashBalance)}
          </div>
          <p className="text-xs text-[#6B6560]">Saldo berjalan on-hand di rekening</p>
        </div>

        {/* Total Kas Masuk */}
        <div className="bg-white p-5 rounded-2xl border border-[#D9D4CB] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#6B6560]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Kas Masuk</span>
            <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 tracking-tight">
            {formatRupiah(totalIn)}
          </div>
          <p className="text-xs text-[#6B6560]">Penjualan mobil & setoran modal</p>
        </div>

        {/* Total Kas Keluar */}
        <div className="bg-white p-5 rounded-2xl border border-[#D9D4CB] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#6B6560]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Kas Keluar</span>
            <ArrowUpRight className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-700 tracking-tight">
            {formatRupiah(totalOut)}
          </div>
          <p className="text-xs text-[#6B6560]">Kulakan, perbaikan, OPEX & prive</p>
        </div>

        {/* Rekonsiliasi Bank */}
        <div className="bg-white p-5 rounded-2xl border border-[#D9D4CB] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#6B6560]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Status Mutasi</span>
            <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
          </div>
          <div className="text-2xl font-black text-[#1C1917] tracking-tight">
            {cashTransactions.length} <span className="text-xs font-semibold text-[#6B6560]">Mutasi</span>
          </div>
          <p className="text-xs text-[#16A34A] font-semibold">Tersinkronisasi dengan Buku Kas</p>
        </div>
      </div>

      {/* Action Bar & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-[#D9D4CB] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#6B6560] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari keterangan, plat nomor, atau tipe kas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[#D9D4CB] rounded-xl text-xs sm:text-sm bg-[#F7F5F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D97706]/20 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Filter Buttons */}
          <div className="flex items-center gap-1 bg-[#F7F5F2] p-1 rounded-xl border border-[#D9D4CB]">
            <button
              onClick={() => setCashFilter("ALL")}
              className={cn(
                "px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all",
                cashFilter === "ALL" ? "bg-white text-[#1C1917] shadow-xs" : "text-[#6B6560] hover:text-[#1C1917]"
              )}
            >
              Semua
            </button>
            <button
              onClick={() => setCashFilter("IN")}
              className={cn(
                "px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all",
                cashFilter === "IN" ? "bg-emerald-600 text-white shadow-xs" : "text-[#6B6560] hover:text-emerald-700"
              )}
            >
              Kas Masuk
            </button>
            <button
              onClick={() => setCashFilter("OUT")}
              className={cn(
                "px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all",
                cashFilter === "OUT" ? "bg-rose-600 text-white shadow-xs" : "text-[#6B6560] hover:text-rose-700"
              )}
            >
              Kas Keluar
            </button>
          </div>

          {/* Add Manual Cash Button */}
          <Link
            href="/admin/finance/cash/new"
            className="flex items-center gap-1.5 bg-[#D97706] hover:bg-[#B45309] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ Kas Masuk / Keluar Manual</span>
          </Link>
        </div>
      </div>

      {/* Tabel Mutasi Kas Rekening BCA */}
      <div className="bg-white rounded-2xl border border-[#D9D4CB] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#D9D4CB] flex items-center justify-between bg-[#F7F5F2]">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-[#D97706]" />
            <h3 className="font-bold text-sm text-[#1C1917]">
              Buku Mutasi Kas Rekening BCA
            </h3>
          </div>
          <span className="text-xs font-semibold text-[#6B6560]">
            Menampilkan {filteredCashList.length} dari {cashTransactions.length} transaksi
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#EFECE8] text-[#6B6560] uppercase text-[10px] sm:text-[11px] font-bold tracking-wider border-b border-[#D9D4CB]">
              <tr>
                <th className="py-3 px-4">Tanggal & Waktu</th>
                <th className="py-3 px-4">Jenis Transaksi</th>
                <th className="py-3 px-4">Keterangan / Terkait Unit</th>
                <th className="py-3 px-4 text-right">Nominal (Rp)</th>
                <th className="py-3 px-4 text-right">Saldo Berjalan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9D4CB]">
              {filteredCashList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#6B6560]">
                    Tidak ada mutasi kas yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredCashList.map((tx) => {
                  const isIncoming = tx.type.startsWith("IN_");
                  return (
                    <tr key={tx.id} className="hover:bg-[#F7F5F2] transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap text-[#6B6560]">
                        <div className="font-medium text-[#1C1917]">{formatDate(tx.createdAt)}</div>
                        <div className="text-[10px] text-[#A8A29E]">Oleh {tx.createdBy}</div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border",
                            isIncoming
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-rose-50 text-rose-800 border-rose-200"
                          )}
                        >
                          {isIncoming ? (
                            <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3 text-rose-600" />
                          )}
                          {CASH_TYPE_LABELS[tx.type] || tx.type}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-[#1C1917]">
                          {tx.notes || "-"}
                        </div>
                        {tx.vehiclePlate && (
                          <div className="text-[11px] text-[#6B6560] flex items-center gap-1 mt-0.5">
                            <Car className="w-3 h-3 text-[#D97706]" />
                            <span className="font-bold text-[#D97706]">{tx.vehiclePlate}</span>
                            {tx.vehicleName && <span>({tx.vehicleName})</span>}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-bold">
                        <span className={isIncoming ? "text-emerald-700" : "text-rose-700"}>
                          {isIncoming ? "+" : "-"} {formatRupiah(tx.amount)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-black text-[#1C1917]">
                        {formatRupiah(tx.runningBalance)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Tambah Transaksi Kas Manual */}
      {showManualCashModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#D9D4CB] shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#D9D4CB] pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#D97706]" />
                <h3 className="font-bold text-base text-[#1C1917]">
                  Catat Kas Masuk / Keluar
                </h3>
              </div>
              <button
                onClick={() => setShowManualCashModal(false)}
                className="text-[#6B6560] hover:text-[#1C1917] text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleManualCashSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1C1917] uppercase tracking-wider mb-1.5">
                  Tipe Transaksi
                </label>
                <select
                  value={cashType}
                  onChange={(e) => setCashType(e.target.value)}
                  className="w-full p-3 border border-[#D9D4CB] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#D97706]/20 font-medium"
                >
                  <optgroup label="Kas Masuk (Uang Masuk ke BCA)">
                    <option value="IN_CAPITAL_DEPOSIT">Setor Modal Umum</option>
                    <option value="IN_OWNER_EQUITY">Setor Modal Tambahan Pribadi</option>
                    <option value="IN_OTHER">Pemasukan Kas Lainnya</option>
                  </optgroup>
                  <optgroup label="Kas Keluar (Uang Keluar dari BCA)">
                    <option value="OUT_CAPITAL_WITHDRAWAL">Penarikan Modal</option>
                    <option value="OUT_OTHER">Pengeluaran Kas Lainnya</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C1917] uppercase tracking-wider mb-1.5">
                  Nominal (Rp)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="Contoh: 5000000"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  className="w-full p-3 border border-[#D9D4CB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]/20 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C1917] uppercase tracking-wider mb-1.5">
                  Keterangan Transaksi
                </label>
                <textarea
                  rows={2}
                  placeholder="Keterangan transaksi untuk buku kas..."
                  value={cashNotes}
                  onChange={(e) => setCashNotes(e.target.value)}
                  className="w-full p-3 border border-[#D9D4CB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]/20"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManualCashModal(false)}
                  className="px-4 py-2 border border-[#D9D4CB] rounded-xl text-xs font-semibold text-[#6B6560] hover:bg-[#F7F5F2] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-[#D97706] hover:bg-[#B45309] text-white rounded-xl text-xs font-bold transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Menyimpan..." : "Simpan Transaksi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

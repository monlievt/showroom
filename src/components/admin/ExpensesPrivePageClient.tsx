"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Building,
  ShoppingBag,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  Wallet,
  AlertTriangle,
  Receipt
} from "lucide-react";
import { formatRupiah, formatDate, cn } from "@/lib/utils";
import {
  recordOperationalExpense,
  recordOwnerDraw,
  recordOwnerEquity,
} from "@/app/actions/operational-expense";
import { FinanceSubNav } from "./FinanceSubNav";

interface ExpensesPriveProps {
  summary: {
    cashBalance: number;
    totalOperationalExpenses?: number;
    totalOwnerDraw?: number;
    totalOwnerEquity?: number;
    assetsCount?: number;
  };
  operationalData: {
    operationalExpenses: Array<{
      id: string;
      category: string;
      recipient?: string | null;
      amount: number;
      date: string | Date;
      notes?: string | null;
      receiptUrl?: string | null;
    }>;
    ownerDraws: Array<{
      id: string;
      amount: number;
      createdAt: string | Date;
      notes?: string | null;
      runningBalance?: number;
      createdBy?: string;
    }>;
    ownerEquities: Array<{
      id: string;
      amount: number;
      createdAt: string | Date;
      notes?: string | null;
      runningBalance?: number;
      createdBy?: string;
    }>;
    totalOperational: number;
    totalOwnerDraw: number;
    totalOwnerEquity: number;
  };
}

const OPEX_CATEGORY_LABELS: Record<string, string> = {
  RENT_SHOWROOM: "Sewa Lahan & Garasi",
  UTILITIES_WIFI: "Listrik, Air & WiFi",
  MARKETING_ADS: "Iklan FB/IG & OLX",
  SALARY_WAGES: "Gaji & Upah Karyawan",
  OFFICE_SUPPLIES: "Kertas, ATK & Materai",
  CONSUMPTION_GUEST: "Kopi & Konsumsi Tamu",
  MAINTENANCE: "Perawatan Garasi/Fasilitas",
  OTHER: "Operasional Lainnya",
};

export function ExpensesPrivePageClient({ summary, operationalData }: ExpensesPriveProps) {
  // Modals state
  const [showOpExModal, setShowOpExModal] = useState(false);
  const [showOwnerDrawModal, setShowOwnerDrawModal] = useState(false);
  const [showOwnerEquityModal, setShowOwnerEquityModal] = useState(false);

  // Operational Expense Form State
  const [opExCategory, setOpExCategory] = useState<
    "RENT_SHOWROOM" | "UTILITIES_WIFI" | "MARKETING_ADS" | "SALARY_WAGES" | "OFFICE_SUPPLIES" | "CONSUMPTION_GUEST" | "MAINTENANCE" | "OTHER"
  >("RENT_SHOWROOM");
  const [opExRecipient, setOpExRecipient] = useState("");
  const [opExAmount, setOpExAmount] = useState("");
  const [opExDate, setOpExDate] = useState(new Date().toISOString().split("T")[0]);
  const [opExNotes, setOpExNotes] = useState("");

  // Owner Draw (Prive) Form State
  const [drawAmount, setDrawAmount] = useState("");
  const [drawDate, setDrawDate] = useState(new Date().toISOString().split("T")[0]);
  const [drawNotes, setDrawNotes] = useState("");

  // Owner Equity Form State
  const [equityAmount, setEquityAmount] = useState("");
  const [equityDate, setEquityDate] = useState(new Date().toISOString().split("T")[0]);
  const [equityNotes, setEquityNotes] = useState("");

  // Filter State
  const [expenseFilter, setExpenseFilter] = useState<"ALL" | "OPERATIONAL" | "OWNER_DRAW" | "OWNER_EQUITY">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showNotification = (message: string, type: "success" | "error") => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  // Handler: Catat Beban Operasional Showroom
  const handleOpExSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opExAmount) return;

    setLoading(true);
    const res = await recordOperationalExpense({
      category: opExCategory,
      recipient: opExRecipient || undefined,
      amount: Number(opExAmount),
      date: new Date(opExDate),
      notes: opExNotes || undefined,
    });
    setLoading(false);

    if (res.success) {
      showNotification("Beban operasional showroom berhasil dicatat & memotong kas BCA!", "success");
      setShowOpExModal(false);
      setOpExAmount("");
      setOpExRecipient("");
      setOpExNotes("");
    } else {
      showNotification(res.error || "Gagal mencatat beban operasional", "error");
    }
  };

  // Handler: Catat Prive (Pengeluaran Pribadi)
  const handleOwnerDrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!drawAmount) return;

    setLoading(true);
    const res = await recordOwnerDraw({
      amount: Number(drawAmount),
      date: new Date(drawDate),
      notes: drawNotes,
    });
    setLoading(false);

    if (res.success) {
      showNotification("Prive kebutuhan pribadi berhasil dicatat (saldo kas riil berkurang, HPP mobil tetap aman)!", "success");
      setShowOwnerDrawModal(false);
      setDrawAmount("");
      setDrawNotes("");
    } else {
      showNotification(res.error || "Gagal mencatat prive pribadi", "error");
    }
  };

  // Handler: Catat Setoran Modal Pribadi
  const handleOwnerEquitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!equityAmount) return;

    setLoading(true);
    const res = await recordOwnerEquity({
      amount: Number(equityAmount),
      date: new Date(equityDate),
      notes: equityNotes,
    });
    setLoading(false);

    if (res.success) {
      showNotification("Setoran modal tambahan pribadi berhasil dicatat di kas BCA!", "success");
      setShowOwnerEquityModal(false);
      setEquityAmount("");
      setEquityNotes("");
    } else {
      showNotification(res.error || "Gagal mencatat setoran modal pribadi", "error");
    }
  };

  // Gabungkan riwayat mutasi
  const combinedExpensesPriveList = [
    ...operationalData.operationalExpenses.map((e) => ({
      id: e.id,
      type: "OPERATIONAL",
      title: OPEX_CATEGORY_LABELS[e.category] || e.category,
      categoryBadge: "Beban Operasional",
      badgeColor: "bg-[var(--bg)] text-[var(--ink)] border-[var(--line)]",
      recipient: e.recipient || "-",
      amount: e.amount,
      isOutgoing: true,
      date: e.date,
      notes: e.notes || "-",
      impactText: "Mengurangi laba operasional showroom",
    })),
    ...operationalData.ownerDraws.map((d) => ({
      id: d.id,
      type: "OWNER_DRAW",
      title: "Prive Pribadi (Belanja / Keluarga)",
      categoryBadge: "Prive (Non-HPP)",
      badgeColor: "bg-[var(--bg)] text-[var(--ink)] border-[var(--line)]",
      recipient: "Owner Pribadi",
      amount: d.amount,
      isOutgoing: true,
      date: d.createdAt,
      notes: d.notes || "Kebutuhan pribadi / rumah tangga",
      impactText: "Memotong saldo kas bank BCA, BUKAN beban mobil",
    })),
    ...operationalData.ownerEquities.map((eq) => ({
      id: eq.id,
      type: "OWNER_EQUITY",
      title: "Setoran Modal Pribadi ke Kas",
      categoryBadge: "Setor Modal",
      badgeColor: "bg-[var(--bg)] text-[var(--ink)] border-[var(--line)]",
      recipient: "Showroom (BCA)",
      amount: eq.amount,
      isOutgoing: false,
      date: eq.createdAt,
      notes: eq.notes || "Setoran modal kas pribadi",
      impactText: "Menambah kas BCA showroom",
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredExpensesList = combinedExpensesPriveList.filter((item) => {
    const matchesFilter = expenseFilter === "ALL" ? true : item.type === expenseFilter;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.recipient.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {feedback && (
        <div
          className={cn(
            "p-4 rounded-xl text-sm font-medium flex items-center justify-between border shadow-sm transition-all",
            feedback.type === "success"
              ? "bg-[var(--bg)] border-[var(--line)] text-[var(--ok)]"
              : "bg-[var(--bg)] border-[var(--bad)]/30 text-[var(--bad)]"
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
      <FinanceSubNav />

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Beban Operasional Showroom */}
        <div className="bg-white p-5 rounded-2xl border border-[var(--line)] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[var(--muted)]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Beban Operasional</span>
            <Building className="w-4 h-4 text-[var(--accent)]" />
          </div>
          <div className="text-2xl font-black text-[var(--ink)] tracking-tight">
            {formatRupiah(summary.totalOperationalExpenses || operationalData.totalOperational)}
          </div>
          <p className="text-xs text-[var(--muted)]">Sewa garasi, listrik, WiFi, gaji &amp; iklan</p>
        </div>

        {/* Prive Pribadi */}
        <div className="bg-white p-5 rounded-2xl border border-[var(--line)] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[var(--muted)]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Prive (Pribadi Owner)</span>
            <ShoppingBag className="w-4 h-4 text-[var(--accent)]" />
          </div>
          <div className="text-2xl font-black text-[var(--ink)] tracking-tight">
            {formatRupiah(summary.totalOwnerDraw || operationalData.totalOwnerDraw)}
          </div>
          <p className="text-xs text-[var(--muted)]">Belanja dapur, SPP anak (Non-HPP)</p>
        </div>

        {/* Setor Modal Pribadi */}
        <div className="bg-white p-5 rounded-2xl border border-[var(--line)] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[var(--muted)]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Setor Modal Pribadi</span>
            <ArrowDownLeft className="w-4 h-4 text-[var(--accent)]" />
          </div>
          <div className="text-2xl font-black text-[var(--ink)] tracking-tight">
            {formatRupiah(summary.totalOwnerEquity || operationalData.totalOwnerEquity)}
          </div>
          <p className="text-xs text-[var(--muted)]">Uang pribadi masuk ke kas showroom</p>
        </div>

        {/* Saldo Kas BCA Riil */}
        <div className="bg-white p-5 rounded-2xl border border-[var(--line)] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[var(--muted)]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Saldo Kas BCA</span>
            <Wallet className="w-4 h-4 text-[var(--accent)]" />
          </div>
          <div className="text-2xl font-black text-[var(--ink)] tracking-tight">
            {formatRupiah(summary.cashBalance)}
          </div>
          <p className="text-xs text-[var(--muted)] font-medium">Tersinkronisasi Rekening Koran</p>
        </div>
      </div>

      {/* Edukasi Solusi Rekening Campur BCA */}
      <div className="bg-white border border-[var(--line)] p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-[var(--muted)] shadow-xs">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold text-[var(--ink)]">Solusi Rekening Campur (Showroom + Pribadi):</strong>
            <p className="mt-0.5 text-[var(--muted)] leading-relaxed">
              Semua transaksi belanja pribadi owner dicatat sebagai <strong>Prive</strong>. Saldo kas bank BCA akan tetap cocok persis dengan mutasi M-Banking, namun laba unit mobil dan bagi hasil investor <strong>100% aman dan tidak tercemar</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Action Bar & Quick Buttons */}
      <div className="bg-white p-4 rounded-2xl border border-[var(--line)] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[var(--muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari penerima, keterangan beban atau prive..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[var(--line)] rounded-xl text-xs sm:text-sm bg-[var(--bg)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 transition-all"
          />
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/finance/prive/new"
            className="flex items-center gap-1.5 bg-white hover:bg-[var(--bg)] border border-[var(--line-input)] text-[var(--ink)] px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>+ Catat Prive (Pribadi)</span>
          </Link>

          <Link
            href="/admin/finance/expenses/new"
            className="flex items-center gap-1.5 bg-white hover:bg-[var(--bg)] border border-[var(--line-input)] text-[var(--ink)] px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Building className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>+ Beban Operasional</span>
          </Link>

          <Link
            href="/admin/finance/equity/new"
            className="flex items-center gap-1.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>+ Setor Modal Pribadi</span>
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setExpenseFilter("ALL")}
          className={cn(
            "px-3 py-1.5 rounded-xl font-bold transition-all border shrink-0",
            expenseFilter === "ALL"
              ? "bg-[var(--ink)] text-white border-[var(--ink)] shadow-xs"
              : "bg-white text-[var(--muted)] border-[var(--line)] hover:bg-[var(--bg)]"
          )}
        >
          Semua Mutasi ({combinedExpensesPriveList.length})
        </button>
        <button
          onClick={() => setExpenseFilter("OPERATIONAL")}
          className={cn(
            "px-3 py-1.5 rounded-xl font-bold transition-all border shrink-0 flex items-center gap-1.5",
            expenseFilter === "OPERATIONAL"
              ? "bg-[var(--ink)] text-white border-[var(--ink)] shadow-xs"
              : "bg-white text-[var(--muted)] border-[var(--line)] hover:bg-[var(--bg)]"
          )}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Beban Operasional ({operationalData.operationalExpenses.length})</span>
        </button>
        <button
          onClick={() => setExpenseFilter("OWNER_DRAW")}
          className={cn(
            "px-3 py-1.5 rounded-xl font-bold transition-all border shrink-0 flex items-center gap-1.5",
            expenseFilter === "OWNER_DRAW"
              ? "bg-[var(--ink)] text-white border-[var(--ink)] shadow-xs"
              : "bg-white text-[var(--muted)] border-[var(--line)] hover:bg-[var(--bg)]"
          )}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Prive Pribadi ({operationalData.ownerDraws.length})</span>
        </button>
        <button
          onClick={() => setExpenseFilter("OWNER_EQUITY")}
          className={cn(
            "px-3 py-1.5 rounded-xl font-bold transition-all border shrink-0 flex items-center gap-1.5",
            expenseFilter === "OWNER_EQUITY"
              ? "bg-[var(--ink)] text-white border-[var(--ink)] shadow-xs"
              : "bg-white text-[var(--muted)] border-[var(--line)] hover:bg-[var(--bg)]"
          )}
        >
          <ArrowDownLeft className="w-3.5 h-3.5" />
          <span>Setor Modal Pribadi ({operationalData.ownerEquities.length})</span>
        </button>
      </div>

      {/* Tabel Mutasi Pemisahan Beban & Prive */}
      <div className="bg-white rounded-2xl border border-[var(--line)] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[var(--line)] flex items-center justify-between bg-[var(--bg)]">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[var(--accent)]" />
            <h3 className="font-bold text-sm text-[var(--ink)]">
              Rincian Pemisahan Beban Showroom vs Prive Pribadi (Rekening BCA)
            </h3>
          </div>
          <span className="text-xs font-semibold text-[var(--muted)]">
            Menampilkan {filteredExpensesList.length} transaksi
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[var(--bg)] text-[var(--muted)] uppercase text-[10px] sm:text-[11px] font-bold tracking-wider border-b border-[var(--line)]">
              <tr>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Kategori & Klasifikasi</th>
                <th className="py-3 px-4">Penerima & Keterangan</th>
                <th className="py-3 px-4">Dampak ke Pembukuan</th>
                <th className="py-3 px-4 text-right">Nominal (Rp)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {filteredExpensesList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[var(--muted)]">
                    Belum ada catatan pengeluaran/prive yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredExpensesList.map((item) => (
                  <tr key={item.id} className="hover:bg-[var(--bg)] transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap text-[var(--muted)]">
                      <div className="font-medium text-[var(--ink)]">{formatDate(item.date)}</div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-[var(--ink)]">{item.title}</div>
                      <span className={cn("inline-block mt-0.5 text-[10px] px-2 py-0.5 rounded-full font-bold border", item.badgeColor)}>
                        {item.categoryBadge}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-[var(--ink)]">{item.notes}</div>
                      <div className="text-[11px] text-[var(--muted)]">Penerima: {item.recipient}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-[11px] text-[var(--muted)] block font-medium">
                        {item.impactText}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap font-black">
                      <span className={item.isOutgoing ? "text-[var(--bad)]" : "text-[var(--ink)]"}>
                        {item.isOutgoing ? "-" : "+"} {formatRupiah(item.amount)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Catat Beban Operasional Showroom */}
      {showOpExModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[var(--line)] shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-[var(--accent)]" />
                <h3 className="font-bold text-base text-[var(--ink)]">
                  Catat Beban Operasional Showroom
                </h3>
              </div>
              <button
                onClick={() => setShowOpExModal(false)}
                className="text-[var(--muted)] hover:text-[var(--ink)] text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleOpExSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider mb-1">
                  Kategori Pengeluaran
                </label>
                <select
                  value={opExCategory}
                  onChange={(e: any) => setOpExCategory(e.target.value)}
                  className="w-full p-2.5 border border-[var(--line)] rounded-xl text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
                >
                  <option value="RENT_SHOWROOM">Sewa Lahan &amp; Garasi Showroom</option>
                  <option value="UTILITIES_WIFI">Listrik, Air &amp; WiFi Internet</option>
                  <option value="MARKETING_ADS">Iklan Berbayar FB/IG &amp; OLX</option>
                  <option value="SALARY_WAGES">Gaji &amp; Upah Karyawan Showroom</option>
                  <option value="OFFICE_SUPPLIES">Kertas, ATK, Kwitansi &amp; Materai</option>
                  <option value="CONSUMPTION_GUEST">Kopi, Air Mineral &amp; Jamuan Tamu</option>
                  <option value="MAINTENANCE">Perawatan Fasilitas Garasi</option>
                  <option value="OTHER">Beban Operasional Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider mb-1">
                  Nominal (Rp)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="Contoh: 1500000"
                  value={opExAmount}
                  onChange={(e) => setOpExAmount(e.target.value)}
                  className="w-full p-2.5 border border-[var(--line)] rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider mb-1">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    required
                    value={opExDate}
                    onChange={(e) => setOpExDate(e.target.value)}
                    className="w-full p-2.5 border border-[var(--line)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider mb-1">
                    Penerima / Vendor
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: PLN / Pemilik Ruko"
                    value={opExRecipient}
                    onChange={(e) => setOpExRecipient(e.target.value)}
                    className="w-full p-2.5 border border-[var(--line)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider mb-1">
                  Catatan / Keterangan
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Token listrik showroom 1 bulan..."
                  value={opExNotes}
                  onChange={(e) => setOpExNotes(e.target.value)}
                  className="w-full p-2.5 border border-[var(--line)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOpExModal(false)}
                  className="px-4 py-2 border border-[var(--line)] rounded-xl text-xs font-semibold text-[var(--muted)] hover:bg-[var(--bg)] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-xl text-xs font-bold transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Menyimpan..." : "Simpan Beban"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Catat Prive (Pribadi Owner) */}
      {showOwnerDrawModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[var(--line)] shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[var(--accent)]" />
                <h3 className="font-bold text-base text-[var(--ink)]">
                  Catat Prive (Kebutuhan Pribadi Owner)
                </h3>
              </div>
              <button
                onClick={() => setShowOwnerDrawModal(false)}
                className="text-[var(--muted)] hover:text-[var(--ink)] text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[var(--muted)] bg-[var(--bg)] p-3 rounded-xl border border-[var(--line)] leading-relaxed">
              Uang kas rekening BCA berkurang untuk keperluan keluarga, namun <strong>TIDAK dimasukkan ke biaya mobil</strong> sehingga laba unit &amp; investor tetap akurat.
            </p>

            <form onSubmit={handleOwnerDrawSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider mb-1">
                  Nominal Tarik / Transfer Pribadi (Rp)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="Contoh: 1500000"
                  value={drawAmount}
                  onChange={(e) => setDrawAmount(e.target.value)}
                  className="w-full p-2.5 border border-[var(--line)] rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider mb-1">
                  Tanggal Penarikan
                </label>
                <input
                  type="date"
                  required
                  value={drawDate}
                  onChange={(e) => setDrawDate(e.target.value)}
                  className="w-full p-2.5 border border-[var(--line)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider mb-1">
                  Keterangan Kebutuhan
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Contoh: Belanja bulanan dapur, SPP anak sekolah, keperluan pribadi..."
                  value={drawNotes}
                  onChange={(e) => setDrawNotes(e.target.value)}
                  className="w-full p-2.5 border border-[var(--line)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOwnerDrawModal(false)}
                  className="px-4 py-2 border border-[var(--line)] rounded-xl text-xs font-semibold text-[var(--muted)] hover:bg-[var(--bg)] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-xl text-xs font-bold transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Menyimpan..." : "Simpan Prive"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Setor Modal Pribadi */}
      {showOwnerEquityModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[var(--line)] shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <div className="flex items-center gap-2">
                <ArrowDownLeft className="w-5 h-5 text-[var(--accent)]" />
                <h3 className="font-bold text-base text-[var(--ink)]">
                  Setor Modal Tambahan Pribadi
                </h3>
              </div>
              <button
                onClick={() => setShowOwnerEquityModal(false)}
                className="text-[var(--muted)] hover:text-[var(--ink)] text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[var(--muted)] bg-[var(--bg)] p-3 rounded-xl border border-[var(--line)] leading-relaxed">
              Gunakan form ini jika Anda mentransfer dana pribadi dari rekening luar ke kas rekening BCA showroom.
            </p>

            <form onSubmit={handleOwnerEquitySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider mb-1">
                  Nominal Setoran (Rp)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="Contoh: 10000000"
                  value={equityAmount}
                  onChange={(e) => setEquityAmount(e.target.value)}
                  className="w-full p-2.5 border border-[var(--line)] rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider mb-1">
                  Tanggal Setor
                </label>
                <input
                  type="date"
                  required
                  value={equityDate}
                  onChange={(e) => setEquityDate(e.target.value)}
                  className="w-full p-2.5 border border-[var(--line)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider mb-1">
                  Catatan / Keterangan Sumber Dana
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Tambahan modal pribadi untuk perputaran kas..."
                  value={equityNotes}
                  onChange={(e) => setEquityNotes(e.target.value)}
                  className="w-full p-2.5 border border-[var(--line)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOwnerEquityModal(false)}
                  className="px-4 py-2 border border-[var(--line)] rounded-xl text-xs font-semibold text-[var(--muted)] hover:bg-[var(--bg)] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-xl text-xs font-bold transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Menyimpan..." : "Simpan Setoran Modal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState } from "react";
import {
  Wallet,
  Car,
  TrendingUp,
  Receipt,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  ExternalLink,
  LogOut,
} from "lucide-react";
import { formatRupiah, formatDate, cn } from "@/lib/utils";
import { logoutAction } from "@/app/actions/auth";

interface InvestorData {
  id: string;
  name: string;
  phone?: string | null;
  type: "OWNER_EQUITY" | "MOTHER_SIBLING" | "THIRD_PARTY";
  currentBalance: number;
  activeAllocatedCapital: number;
  totalProfitReceived: number;
  investments: Array<{
    id: string;
    vehiclePlate: string;
    vehicleName: string;
    vehicleYear: number;
    vehicleStatus: string;
    capitalShare: number;
    profitSharePercent: number;
  }>;
  ledgerEntries: Array<{
    id: string;
    type: string;
    amount: number;
    runningBalance: number;
    notes?: string | null;
    createdAt: string | Date;
    vehiclePlate?: string;
  }>;
  distributions: Array<{
    id: string;
    vehiclePlate: string;
    vehicleName: string;
    calculatedAmount: number;
    isPaid: boolean;
    calculatedAt: string | Date;
    notes?: string | null;
  }>;
}

export function InvestorClient({
  investor,
  allInvestors,
  onSelectInvestor,
}: {
  investor: InvestorData | null;
  allInvestors?: Array<{ id: string; name: string }>;
  onSelectInvestor?: (id: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<"portfolio" | "ledger" | "distributions">("portfolio");

  if (!investor) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-[var(--line)] text-center max-w-md shadow-sm">
          <ShieldCheck className="w-12 h-12 text-[var(--accent)] mx-auto mb-3" />
          <h2 className="text-xl font-bold text-[var(--ink)]">Portal Investor Nur Mobil</h2>
          <p className="text-sm text-[var(--muted)] mt-2">
            Akun Anda belum ditautkan ke data investor manapun, atau belum ada data investor yang terdaftar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      {/* Top Navbar */}
      <header className="bg-white border-b border-[var(--line)] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--accent)] flex items-center justify-center text-white font-bold text-lg shadow-sm">
              N
            </div>
            <div>
              <span className="font-bold text-base text-[var(--ink)] tracking-tight block">
                Nur Mobil
              </span>
              <span className="text-[11px] text-[var(--muted)] font-medium block">
                Portal Transparansi Investor
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Switcher untuk keperluan simulasi/demo */}
            {allInvestors && allInvestors.length > 1 && onSelectInvestor && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[var(--muted)] hidden sm:inline">Lihat sebagai:</span>
                <select
                  value={investor.id}
                  onChange={(e) => onSelectInvestor(e.target.value)}
                  className="bg-[var(--bg)] border border-[var(--line)] rounded-lg px-2.5 py-1 text-xs font-semibold text-[var(--ink)]"
                >
                  {allInvestors.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={() => logoutAction()}
              title="Keluar (Logout)"
              className="p-1.5 rounded-lg text-[var(--muted)] hover:text-red-600 hover:bg-[var(--bg)] transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Welcome Banner */}
        <div className="bg-white rounded-2xl border border-[var(--line)] p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[var(--ink)] tracking-tight">
                Selamat Datang, {investor.name}
              </h1>
              <span
                className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                  investor.type === "MOTHER_SIBLING"
                    ? "bg-purple-100 text-purple-800"
                    : investor.type === "OWNER_EQUITY"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-blue-100 text-blue-800"
                )}
              >
                {investor.type === "MOTHER_SIBLING"
                  ? "Mitra Keluarga"
                  : investor.type === "OWNER_EQUITY"
                  ? "Owner Equity"
                  : "Investor Eksternal"}
              </span>
            </div>
            <p className="text-xs text-[var(--muted)] mt-1">
              Pantau alokasi perputaran modal, pokok investasi unit, dan rekonsiliasi bagi hasil secara realtime.
            </p>
          </div>

          <div className="bg-[var(--bg)] border border-[var(--line)] px-4 py-2.5 rounded-xl text-right">
            <span className="text-[11px] font-semibold text-[var(--muted)] uppercase block">
              Saldo Siap Alokasi
            </span>
            <span className="text-xl font-bold text-[var(--accent)]">
              {formatRupiah(investor.currentBalance)}
            </span>
          </div>
        </div>

        {/* 3 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-[var(--line)] shadow-sm">
            <div className="flex items-center justify-between text-[var(--muted)] mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Modal Aktif di Mobil
              </span>
              <Car className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-[var(--ink)]">
              {formatRupiah(investor.activeAllocatedCapital)}
            </div>
            <div className="text-xs text-[var(--muted)] mt-1">
              Tertanam pada {investor.investments.length} unit kendaraan
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[var(--line)] shadow-sm">
            <div className="flex items-center justify-between text-[var(--muted)] mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Total Bagi Hasil Diterima
              </span>
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-600">
              {formatRupiah(investor.totalProfitReceived)}
            </div>
            <div className="text-xs text-[var(--muted)] mt-1">
              Akumulasi profit dari unit yang telah lunas
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[var(--line)] shadow-sm">
            <div className="flex items-center justify-between text-[var(--muted)] mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Total Pokok & Saldo
              </span>
              <Wallet className="w-5 h-5 text-[var(--accent)]" />
            </div>
            <div className="text-2xl font-bold text-[var(--ink)]">
              {formatRupiah(investor.currentBalance + investor.activeAllocatedCapital)}
            </div>
            <div className="text-xs text-[var(--muted)] mt-1">
              Total aset modal Anda di Nur Mobil
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--line)] gap-6 text-sm font-medium">
          <button
            onClick={() => setActiveTab("portfolio")}
            className={cn(
              "pb-3 -mb-px transition-colors cursor-pointer",
              activeTab === "portfolio"
                ? "border-b-2 border-[var(--accent)] text-[var(--accent)] font-semibold"
                : "text-[var(--muted)] hover:text-[var(--ink)]"
            )}
          >
            Portofolio Unit ({investor.investments.length})
          </button>
          <button
            onClick={() => setActiveTab("ledger")}
            className={cn(
              "pb-3 -mb-px transition-colors cursor-pointer",
              activeTab === "ledger"
                ? "border-b-2 border-[var(--accent)] text-[var(--accent)] font-semibold"
                : "text-[var(--muted)] hover:text-[var(--ink)]"
            )}
          >
            Buku Rekening Modal (Capital Ledger)
          </button>
          <button
            onClick={() => setActiveTab("distributions")}
            className={cn(
              "pb-3 -mb-px transition-colors cursor-pointer",
              activeTab === "distributions"
                ? "border-b-2 border-[var(--accent)] text-[var(--accent)] font-semibold"
                : "text-[var(--muted)] hover:text-[var(--ink)]"
            )}
          >
            Riwayat Bagi Hasil ({investor.distributions.length})
          </button>
        </div>

        {/* TAB: PORTOFOLIO */}
        {activeTab === "portfolio" && (
          <div className="bg-white rounded-2xl border border-[var(--line)] overflow-hidden shadow-sm">
            <div className="p-5 border-b border-[var(--line)] bg-[#FBF9F6]">
              <h3 className="font-bold text-[var(--ink)]">Unit Mobil yang Anda Danai</h3>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                Status operasional dan porsi modal Anda pada setiap unit.
              </p>
            </div>

            {investor.investments.length === 0 ? (
              <div className="p-8 text-center text-[var(--muted)]">
                Belum ada unit mobil yang dialokasikan saat ini.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[var(--bg)] text-xs uppercase text-[var(--muted)] font-semibold">
                    <tr>
                      <th className="py-3 px-4">Unit Kendaraan</th>
                      <th className="py-3 px-4">Status Mobil</th>
                      <th className="py-3 px-4 text-right">Modal Tertanam</th>
                      <th className="py-3 px-4 text-right">Akad Bagi Hasil</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line)]">
                    {investor.investments.map((inv) => (
                      <tr key={inv.id} className="hover:bg-[var(--bg)]">
                        <td className="py-4 px-4">
                          <span className="font-bold text-[var(--ink)] block">
                            {inv.vehiclePlate}
                          </span>
                          <span className="text-xs text-[var(--muted)]">
                            {inv.vehicleName} ({inv.vehicleYear})
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)]">
                            {inv.vehicleStatus.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right font-bold text-[var(--ink)]">
                          {formatRupiah(inv.capitalShare)}
                        </td>
                        <td className="py-4 px-4 text-right text-xs font-semibold text-[var(--accent)]">
                          {inv.profitSharePercent > 0
                            ? `${inv.profitSharePercent}% dari Laba`
                            : "Aturan Bertingkat Ibu"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB: LEDGER */}
        {activeTab === "ledger" && (
          <div className="bg-white rounded-2xl border border-[var(--line)] overflow-hidden shadow-sm">
            <div className="p-5 border-b border-[var(--line)] bg-[#FBF9F6]">
              <h3 className="font-bold text-[var(--ink)]">Mutasi Saldo Rekening Modal</h3>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                Riwayat setoran, alokasi unit, pengembalian pokok modal, dan pembayaran profit.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[var(--bg)] text-xs uppercase text-[var(--muted)] font-semibold">
                  <tr>
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Tipe Mutasi</th>
                    <th className="py-3 px-4">Keterangan</th>
                    <th className="py-3 px-4 text-right">Nominal</th>
                    <th className="py-3 px-4 text-right">Saldo Berjalan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {investor.ledgerEntries.map((entry) => {
                    const isIncrease =
                      entry.type === "DEPOSIT" ||
                      entry.type === "RETURNED" ||
                      entry.type === "PROFIT_PAID";

                    return (
                      <tr key={entry.id} className="hover:bg-[var(--bg)]">
                        <td className="py-3 px-4 text-xs text-[var(--muted)] whitespace-nowrap">
                          {formatDate(entry.createdAt)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={cn(
                              "text-[11px] font-bold px-2 py-0.5 rounded-full uppercase",
                              isIncrease
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            )}
                          >
                            {entry.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-[var(--ink)]">
                          {entry.notes || "-"}
                        </td>
                        <td
                          className={cn(
                            "py-3 px-4 text-right font-bold text-xs whitespace-nowrap",
                            isIncrease ? "text-emerald-600" : "text-amber-700"
                          )}
                        >
                          {isIncrease ? "+" : "-"} {formatRupiah(entry.amount)}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-xs text-[var(--ink)] whitespace-nowrap">
                          {formatRupiah(entry.runningBalance)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: DISTRIBUTIONS */}
        {activeTab === "distributions" && (
          <div className="bg-white rounded-2xl border border-[var(--line)] overflow-hidden shadow-sm">
            <div className="p-5 border-b border-[var(--line)] bg-[#FBF9F6]">
              <h3 className="font-bold text-[var(--ink)]">Riwayat Bagi Hasil yang Diterima</h3>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                Bagi hasil hanya dibayarkan setelah transaksi penjualan mobil lunas 100%.
              </p>
            </div>

            {investor.distributions.length === 0 ? (
              <div className="p-8 text-center text-[var(--muted)]">
                Belum ada bagi hasil yang dibagikan.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[var(--bg)] text-xs uppercase text-[var(--muted)] font-semibold">
                    <tr>
                      <th className="py-3 px-4">Tanggal Pembagian</th>
                      <th className="py-3 px-4">Unit Mobil</th>
                      <th className="py-3 px-4">Catatan / Detail</th>
                      <th className="py-3 px-4 text-right">Bagi Hasil (Rp)</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line)]">
                    {investor.distributions.map((d) => (
                      <tr key={d.id} className="hover:bg-[var(--bg)]">
                        <td className="py-3 px-4 text-xs text-[var(--muted)]">
                          {formatDate(d.calculatedAt)}
                        </td>
                        <td className="py-3 px-4 font-bold text-xs text-[var(--ink)]">
                          {d.vehiclePlate} ({d.vehicleName})
                        </td>
                        <td className="py-3 px-4 text-xs text-[var(--muted)]">{d.notes || "-"}</td>
                        <td className="py-3 px-4 text-right font-bold text-xs text-emerald-600">
                          {formatRupiah(d.calculatedAmount)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            {d.isPaid ? "Lunas" : "Tercatat"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

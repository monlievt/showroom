"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  DollarSign, 
  Receipt, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Search, 
  Printer, 
  MessageCircle, 
  UserCheck,
  Building2,
  FileText,
  ClipboardCheck,
  HeartHandshake,
  Coins,
} from "lucide-react";
import { formatRupiah, formatDate, cn } from "@/lib/utils";
import { generateReceivableReminderLink } from "@/lib/utils/whatsapp";

interface SaleItem {
  id: string;
  saleDate: string | Date;
  saleType: string;
  sellingPrice: number;
  dueDate?: string | Date | null;
  paidAmount: number;
  remainingAmount: number;
  isFullyPaid: boolean;
  percentagePaid: number;
  dueStatus: {
    status: "OVERDUE" | "DUE_SOON" | "ON_SCHEDULE" | "NO_DUE_DATE";
    daysRemaining: number | null;
  };
  hpp: number;
  grossProfit: number;
  hasInvestor?: boolean;
  investorNames?: string[];
  profitDistributionStatus?: "NOT_SETTLED" | "READY_FOR_DISTRIBUTION" | "DISTRIBUTED" | "OWNER_ONLY";
  vehicle: {
    id: string;
    brand: string;
    model: string;
    year: number;
    plateNumber: string;
    color: string;
    status: string;
  };
  buyer: {
    id: string;
    name: string;
    phone?: string | null;
    isShowroom: boolean;
    address?: string | null;
  };
  payments: Array<{
    id: string;
    amount: number;
    paidAt: string | Date;
    method?: string | null;
    notes?: string | null;
    tradeInVehicle?: {
      id: string;
      brand: string;
      model: string;
      plateNumber: string;
    } | null;
  }>;
}

interface AvailableVehicle {
  id: string;
  plateNumber: string;
  brand: string;
  model: string;
  year: number;
  targetSellingPrice?: number | null;
  minSellingPrice?: number | null;
  totalHpp: number;
  status: string;
}

interface SalesClientProps {
  initialSales: SaleItem[];
  availableVehicles: AvailableVehicle[];
}

export function SalesClient({ initialSales }: SalesClientProps) {
  const [sales] = useState<SaleItem[]>(initialSales);
  const [selectedFilter, setSelectedFilter] = useState<"ALL" | "PENDING_RECEIVABLES" | "SETTLED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter logic
  const filteredSales = sales.filter((s) => {
    let matchFilter = true;
    if (selectedFilter === "PENDING_RECEIVABLES") matchFilter = !s.isFullyPaid;
    if (selectedFilter === "SETTLED") matchFilter = s.isFullyPaid;

    const q = searchQuery.toLowerCase();
    const matchSearch =
      s.vehicle.plateNumber.toLowerCase().includes(q) ||
      s.vehicle.brand.toLowerCase().includes(q) ||
      s.vehicle.model.toLowerCase().includes(q) ||
      s.buyer.name.toLowerCase().includes(q) ||
      (s.buyer.phone && s.buyer.phone.includes(q));

    return matchFilter && matchSearch;
  });

  // KPI Calculations
  const totalOmset = sales.reduce((acc, s) => acc + s.sellingPrice, 0);
  const totalDanaMasuk = sales.reduce((acc, s) => acc + s.paidAmount, 0);
  const totalSisaPiutang = sales.reduce((acc, s) => acc + s.remainingAmount, 0);
  const totalPendingUnits = sales.filter((s) => !s.isFullyPaid).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      {/* ── KPI SUMMARY CARDS ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
        <div className="bg-[var(--bg)] border border-[var(--line)] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-[var(--muted)]">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Omset Penjualan</span>
            <DollarSign className="w-5 h-5 text-[var(--accent)]" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-[var(--ink)]">{formatRupiah(totalOmset)}</span>
            <div className="text-[11px] text-[var(--muted)] mt-0.5">{sales.length} transaksi tercatat</div>
          </div>
        </div>

        <div className="bg-white border border-[var(--line)] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-[var(--muted)]">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Kas Masuk (Lunas/DP)</span>
            <CheckCircle2 className="w-5 h-5 text-[var(--accent)]" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-[var(--ink)]">{formatRupiah(totalDanaMasuk)}</span>
            <div className="text-[11px] text-[var(--muted)] mt-0.5">Sudah masuk buku kas</div>
          </div>
        </div>

        <div className="bg-white border border-[var(--line)] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-[var(--muted)]">
            <span className="text-xs font-semibold uppercase tracking-wider">Sisa Piutang Berjalan</span>
            <Clock className="w-5 h-5 text-[var(--accent)]" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-[var(--ink)]">{formatRupiah(totalSisaPiutang)}</span>
            <div className="text-[11px] text-[var(--muted)] font-medium mt-0.5">
              Dari {totalPendingUnits} unit belum lunas
            </div>
          </div>
        </div>

        <div className="bg-[var(--bg)] border border-[var(--line)] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-[var(--muted)]">
            <span className="text-xs font-semibold uppercase tracking-wider">Unit Lunas (Settled)</span>
            <Receipt className="w-5 h-5 text-[var(--ink)]" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[var(--ink)]">
              {sales.filter((s) => s.isFullyPaid).length}
            </span>
            <span className="text-xs text-[var(--muted)]">siap bagi hasil</span>
          </div>
        </div>
      </div>

      {/* ── TOOLBAR & ACTIONS ─────────────────────────────────── */}
      <div className="bg-[var(--bg)] border border-[var(--line)] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[var(--muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari plat nomor, nama pembeli, showroom rekanan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[var(--bg)] border border-[var(--line)] rounded-lg text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
          />
        </div>

        {/* Action Button: Input Penjualan */}
        <Link
          href="/admin/sales/new"
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[var(--accent)] hover:bg-[#92400E] text-white rounded-lg text-sm font-bold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Input Penjualan Unit Baru</span>
        </Link>
      </div>

      {/* ── FILTER TABS ───────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-[var(--line)] pb-2">
        <button
          onClick={() => setSelectedFilter("ALL")}
          className={cn(
            "px-4 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer",
            selectedFilter === "ALL"
              ? "bg-[var(--ink)] text-white shadow-sm"
              : "bg-[var(--bg)] text-[var(--muted)] border border-[var(--line)]"
          )}
        >
          Semua Penjualan ({sales.length})
        </button>
        <button
          onClick={() => setSelectedFilter("PENDING_RECEIVABLES")}
          className={cn(
            "px-4 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5",
            selectedFilter === "PENDING_RECEIVABLES"
              ? "bg-[var(--accent)] text-white shadow-xs"
              : "bg-[var(--bg)] text-[var(--muted)] border border-[var(--line)] hover:text-[var(--ink)]"
          )}
        >
          <span>Piutang Tempo / Belum Lunas</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
            {sales.filter((s) => !s.isFullyPaid).length}
          </span>
        </button>
        <button
          onClick={() => setSelectedFilter("SETTLED")}
          className={cn(
            "px-4 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer",
            selectedFilter === "SETTLED"
              ? "bg-[var(--ink)] text-white shadow-xs"
              : "bg-[var(--bg)] text-[var(--muted)] border border-[var(--line)] hover:text-[var(--ink)]"
          )}
        >
          Terjual Lunas ({sales.filter((s) => s.isFullyPaid).length})
        </button>
      </div>

      {/* ── SALES TABLE ───────────────────────────────────────── */}
      <div className="bg-white border border-[var(--line)] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-[var(--bg)] border-b border-[var(--line)] text-xs font-bold uppercase text-[var(--muted)]">
                <th className="py-3.5 px-4">Tanggal & Jalur</th>
                <th className="py-3.5 px-4">Unit Mobil</th>
                <th className="py-3.5 px-4">Pembeli / Showroom</th>
                <th className="py-3.5 px-4">Harga Kesepakatan</th>
                <th className="py-3.5 px-4 w-60">Status Pelunasan</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[var(--muted)]">
                    Tidak ada transaksi penjualan yang cocok dengan filter saat ini.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  return (
                    <tr key={sale.id} className="hover:bg-[var(--bg)]/50 transition-colors">
                      {/* Tanggal & Jalur */}
                      <td className="py-4 px-4 align-top text-xs">
                        <div className="font-bold text-[var(--ink)]">{formatDate(sale.saleDate)}</div>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--bg)] text-[var(--ink)] border border-[var(--line)]">
                          {sale.saleType === "SHOWROOM" ? "Showroom Rekanan" : "Konsumen Langsung"}
                        </span>
                      </td>

                      {/* Unit Mobil */}
                      <td className="py-4 px-4 align-top">
                        <div className="font-bold text-base text-[var(--ink)]">{sale.vehicle.plateNumber}</div>
                        <div className="text-xs text-[var(--muted)]">
                          {sale.vehicle.brand} {sale.vehicle.model} ({sale.vehicle.year})
                        </div>
                      </td>

                      {/* Pembeli */}
                      <td className="py-4 px-4 align-top text-xs">
                        <div className="font-bold text-[var(--ink)] flex items-center gap-1.5">
                          {sale.buyer.isShowroom ? <Building2 className="w-3.5 h-3.5 text-[var(--accent)]" /> : <UserCheck className="w-3.5 h-3.5 text-[var(--accent)]" />}
                          <span>{sale.buyer.name}</span>
                        </div>
                        {sale.buyer.phone && (
                          <div className="text-[var(--muted)] mt-0.5">{sale.buyer.phone}</div>
                        )}
                        {sale.buyer.address && (
                          <div className="text-[11px] text-[var(--muted)] truncate max-w-xs mt-0.5">{sale.buyer.address}</div>
                        )}
                      </td>

                      {/* Harga Jual & Estimasi Laba */}
                      <td className="py-4 px-4 align-top text-xs">
                        <div className="font-bold text-base text-[var(--ink)]">
                          {formatRupiah(sale.sellingPrice)}
                        </div>
                        <div className="text-[11px] text-[var(--muted)] font-semibold mt-0.5">
                          Laba Kotor: +{formatRupiah(sale.grossProfit)}
                        </div>
                      </td>

                      {/* Progress Pelunasan */}
                      <td className="py-4 px-4 align-top text-xs">
                        <div className="flex items-center justify-between font-bold mb-1">
                          <span className={sale.isFullyPaid ? "text-[var(--ink)]" : "text-[var(--accent)]"}>
                            {sale.isFullyPaid ? "Lunas 100%" : `Kurang ${formatRupiah(sale.remainingAmount)}`}
                          </span>
                          <span className="text-[11px] text-[var(--muted)]">{sale.percentagePaid}%</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-[var(--line)] h-2 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full transition-all duration-500",
                              sale.isFullyPaid ? "bg-[var(--ink)]" : "bg-[var(--accent)]"
                            )}
                            style={{ width: `${sale.percentagePaid}%` }}
                          />
                        </div>

                        {/* Due Date Indicator or Profit Distribution Status */}
                        {!sale.isFullyPaid ? (
                          <div className="mt-1.5 flex items-center gap-1">
                            <ReceivableBadge dueStatus={sale.dueStatus} dueDate={sale.dueDate} />
                          </div>
                        ) : (
                          <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                            {sale.profitDistributionStatus === "READY_FOR_DISTRIBUTION" && (
                              <Link
                                href="/admin/investors"
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[var(--accent)] text-white shadow-xs hover:bg-[var(--accent-hover)] transition-colors"
                                title="Unit didanai investor & belum dibagikan labanya. Klik untuk bagi hasil."
                              >
                                <Coins className="w-3 h-3" />
                                <span>Siap Bagi Hasil ({sale.investorNames?.join(", ") || "Investor"})</span>
                              </Link>
                            )}
                            {sale.profitDistributionStatus === "DISTRIBUTED" && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--bg)] text-[var(--ink)] border border-[var(--line)]">
                                <CheckCircle2 className="w-3 h-3 text-[var(--muted)]" />
                                <span>Bagi Hasil Selesai</span>
                              </span>
                            )}
                            {sale.profitDistributionStatus === "OWNER_ONLY" && (
                              <span className="text-[10px] text-[var(--muted)]">
                                100% Modal Showroom
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="py-4 px-4 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Tombol Cepat Bagi Hasil Investor jika Lunas & Siap Bagi Hasil */}
                          {sale.isFullyPaid && sale.profitDistributionStatus === "READY_FOR_DISTRIBUTION" && (
                            <Link
                              href="/admin/investors"
                              className="p-1.5 rounded-lg border border-[var(--line)] bg-white hover:bg-[var(--accent)] hover:text-white text-[var(--ink)] transition-colors shadow-xs"
                              title="Bagi Hasil ke Investor Sekarang"
                            >
                              <HeartHandshake className="w-4 h-4" />
                            </Link>
                          )}

                          {/* Tombol Catat Pembayaran */}
                          {!sale.isFullyPaid && (
                            <Link
                              href={`/admin/sales/${sale.id}/payment`}
                              className="p-1.5 rounded-lg border border-[var(--line)] bg-white hover:bg-[var(--accent)] hover:text-white text-[var(--ink)] transition-colors shadow-xs"
                              title="Catat Pembayaran Masuk / Angsuran"
                            >
                              <Plus className="w-4 h-4" />
                            </Link>
                          )}

                          {/* Tombol Unduh Kuitansi PDF */}
                          <a
                            href={`/api/pdf/invoice/${sale.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg border border-[var(--line)] bg-white hover:bg-[var(--accent)] hover:text-white text-[var(--ink)] transition-colors shadow-xs"
                            title="Cetak Kuitansi / Faktur Pembayaran (Meterai)"
                          >
                            <Printer className="w-4 h-4" />
                          </a>

                          {/* Tombol Unduh Surat Perjanjian Jual Beli (SPK & S&K) */}
                          <a
                            href={`/api/pdf/agreement/${sale.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg border border-[var(--line)] bg-white hover:bg-[var(--accent)] hover:text-white text-[var(--ink)] transition-colors shadow-xs"
                            title="Cetak Surat Perjanjian Jual Beli (SPK & Syarat Ketentuan)"
                          >
                            <FileText className="w-4 h-4" />
                          </a>

                          {/* Tombol Unduh BAST Serah Terima Kendaraan */}
                          <a
                            href={`/api/pdf/bast/${sale.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg border border-[var(--line)] bg-white hover:bg-[var(--accent)] hover:text-white text-[var(--ink)] transition-colors shadow-xs"
                            title="Cetak Berita Acara Serah Terima (BAST)"
                          >
                            <ClipboardCheck className="w-4 h-4" />
                          </a>

                          {/* Click-to-WA Reminder */}
                          {!sale.isFullyPaid && sale.buyer.phone && (
                            <a
                              href={generateReceivableReminderLink(sale.buyer.phone, {
                                buyerName: sale.buyer.name,
                                brand: sale.vehicle.brand,
                                model: sale.vehicle.model,
                                plateNumber: sale.vehicle.plateNumber,
                                remainingAmount: sale.remainingAmount,
                                dueDate: sale.dueDate ? formatDate(sale.dueDate) : null,
                              })}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg border border-[var(--line)] bg-white hover:bg-[var(--accent)] hover:text-white text-[var(--ink)] transition-colors shadow-xs"
                              title="Kirim Reminder WA Tagihan"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── BADGE RECEIVABLE DUE DATE ──────────────────────────────────
function ReceivableBadge({
  dueStatus,
  dueDate,
}: {
  dueStatus: { status: string; daysRemaining: number | null };
  dueDate?: string | Date | null;
}) {
  if (dueStatus.status === "OVERDUE") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--bad)] bg-[var(--bg)] px-2 py-0.5 rounded border border-[var(--bad)]/30 animate-pulse">
        <AlertTriangle className="w-3 h-3" />
        Lewat Jatuh Tempo ({Math.abs(dueStatus.daysRemaining || 0)} hari)
      </span>
    );
  }
  if (dueStatus.status === "DUE_SOON") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--warn)] bg-[var(--bg)] px-2 py-0.5 rounded border border-[var(--warn)]/30">
        <Clock className="w-3 h-3" />
        Jatuh Tempo H-{dueStatus.daysRemaining}
      </span>
    );
  }
  if (dueStatus.status === "ON_SCHEDULE" && dueDate) {
    return (
      <span className="text-[10px] text-[var(--muted)]">
        Jatuh Tempo: {formatDate(dueDate)}
      </span>
    );
  }
  return null;
}

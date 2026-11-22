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
  Coins,
  Pencil,
} from "lucide-react";
import {
  formatRupiah,
  formatDate,
  cn,
  normalizePlateNumber,
  stripPlateSpaces,
  formatVehicleTitle,
} from "@/lib/utils";
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

  const filteredSales = sales.filter((s) => {
    let matchFilter = true;
    if (selectedFilter === "PENDING_RECEIVABLES") matchFilter = !s.isFullyPaid;
    if (selectedFilter === "SETTLED") matchFilter = s.isFullyPaid;

    const q = searchQuery.trim().toLowerCase();
    if (!q) return matchFilter;

    const compactQ = stripPlateSpaces(searchQuery);
    const matchSearch =
      s.vehicle.plateNumber.toLowerCase().includes(q) ||
      (compactQ && stripPlateSpaces(s.vehicle.plateNumber).includes(compactQ)) ||
      s.vehicle.brand.toLowerCase().includes(q) ||
      s.vehicle.model.toLowerCase().includes(q) ||
      s.buyer.name.toLowerCase().includes(q) ||
      Boolean(s.buyer.phone && s.buyer.phone.includes(q));

    return matchFilter && matchSearch;
  });

  const totalOmset = sales.reduce((acc, s) => acc + s.sellingPrice, 0);
  const totalDanaMasuk = sales.reduce((acc, s) => acc + s.paidAmount, 0);
  const totalSisaPiutang = sales.reduce((acc, s) => acc + s.remainingAmount, 0);
  const totalPendingUnits = sales.filter((s) => !s.isFullyPaid).length;
  const totalSettledUnits = sales.filter((s) => s.isFullyPaid).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-7xl mx-auto">
      {/* ── RINGKASAN 4 ANGKA ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-4">
          <div className="flex items-center justify-between text-[var(--muted)]">
            <span className="text-xs font-semibold">Total Penjualan</span>
            <DollarSign className="w-4 h-4 text-[var(--accent)] shrink-0" />
          </div>
          <div className="mt-2 text-base sm:text-xl font-extrabold text-[var(--ink)] truncate">
            {formatRupiah(totalOmset)}
          </div>
          <div className="text-[11px] text-[var(--muted)] mt-0.5">
            {sales.length} unit terjual
          </div>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-4">
          <div className="flex items-center justify-between text-[var(--muted)]">
            <span className="text-xs font-semibold">Uang Masuk</span>
            <CheckCircle2 className="w-4 h-4 text-[var(--ok)] shrink-0" />
          </div>
          <div className="mt-2 text-base sm:text-xl font-extrabold text-[var(--ink)] truncate">
            {formatRupiah(totalDanaMasuk)}
          </div>
          <div className="text-[11px] text-[var(--muted)] mt-0.5">Sudah diterima</div>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-4">
          <div className="flex items-center justify-between text-[var(--muted)]">
            <span className="text-xs font-semibold">Belum Lunas</span>
            <Clock className="w-4 h-4 text-[var(--warn)] shrink-0" />
          </div>
          <div className="mt-2 text-base sm:text-xl font-extrabold text-[var(--bad)] truncate">
            {formatRupiah(totalSisaPiutang)}
          </div>
          <div className="text-[11px] text-[var(--muted)] mt-0.5">
            {totalPendingUnits} unit tempo
          </div>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-4">
          <div className="flex items-center justify-between text-[var(--muted)]">
            <span className="text-xs font-semibold">Sudah Lunas</span>
            <Receipt className="w-4 h-4 text-[var(--ink)] shrink-0" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-[var(--ink)]">
            {totalSettledUnits}
          </div>
          <div className="text-[11px] text-[var(--muted)] mt-0.5">unit lunas 100%</div>
        </div>
      </div>

      {/* ── PENCARIAN & TOMBOL CATAT PENJUALAN ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[var(--muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari plat nomor, mobil, atau nama pembeli..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 min-h-[46px] bg-[var(--surface)] border border-[var(--line-input)] rounded-xl text-sm text-[var(--ink)]"
          />
        </div>

        <Link
          href="/admin/sales/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[46px] bg-[var(--ok)] hover:opacity-95 text-white rounded-xl text-sm font-bold shadow-xs transition-opacity shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Catat Penjualan Baru</span>
        </Link>
      </div>

      {/* ── TAB FILTER STATUS BAYAR ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { key: "ALL" as const, label: `Semua (${sales.length})` },
          { key: "PENDING_RECEIVABLES" as const, label: `Belum Lunas (${totalPendingUnits})` },
          { key: "SETTLED" as const, label: `Lunas (${totalSettledUnits})` },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setSelectedFilter(tab.key)}
            className={cn(
              "px-4 py-2 min-h-[40px] rounded-xl text-xs font-bold whitespace-nowrap border transition-colors cursor-pointer",
              selectedFilter === tab.key
                ? "bg-[var(--ink)] text-white border-[var(--ink)]"
                : "bg-[var(--surface)] text-[var(--muted)] border-[var(--line)] hover:text-[var(--ink)]"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAMPILAN KARTU DI HP (< md) ── */}
      <div className="md:hidden space-y-3">
        {filteredSales.length === 0 ? (
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-8 text-center text-sm text-[var(--muted)]">
            Belum ada data penjualan yang cocok.
          </div>
        ) : (
          filteredSales.map((sale) => {
            const plate = normalizePlateNumber(sale.vehicle.plateNumber);
            const title = formatVehicleTitle(
              sale.vehicle.brand,
              sale.vehicle.model,
              sale.vehicle.year
            );

            return (
              <div
                key={sale.id}
                className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-extrabold text-base text-[var(--ink)]">{plate}</div>
                    <div className="text-xs text-[var(--muted)] mt-0.5">{title}</div>
                  </div>
                  <span
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0",
                      sale.isFullyPaid
                        ? "bg-[var(--ok-light)] text-[var(--ok)]"
                        : "bg-[var(--warn-light)] text-amber-800"
                    )}
                  >
                    {sale.isFullyPaid ? "Lunas" : "Tempo / DP"}
                  </span>
                </div>

                <div className="text-xs text-[var(--muted)] flex items-center gap-1.5 flex-wrap">
                  {sale.buyer.isShowroom ? (
                    <Building2 className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                  ) : (
                    <UserCheck className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                  )}
                  <strong className="text-[var(--ink)]">{sale.buyer.name}</strong>
                  <span>• {formatDate(sale.saleDate)}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-[var(--bg)] border border-[var(--line)] text-xs">
                  <div>
                    <div className="text-[11px] text-[var(--muted)]">Harga Jual</div>
                    <div className="font-bold text-[var(--ink)] mt-0.5">
                      {formatRupiah(sale.sellingPrice)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[var(--muted)]">
                      {sale.isFullyPaid ? "Laba Kotor" : "Sisa Tagihan"}
                    </div>
                    <div
                      className={cn(
                        "font-bold mt-0.5",
                        sale.isFullyPaid
                          ? sale.grossProfit < 0
                            ? "text-[var(--bad)]"
                            : "text-[var(--ok)]"
                          : "text-[var(--bad)]"
                      )}
                    >
                      {sale.isFullyPaid
                        ? formatRupiah(sale.grossProfit)
                        : formatRupiah(sale.remainingAmount)}
                    </div>
                  </div>
                </div>

                {!sale.isFullyPaid && (
                  <div className="space-y-1.5">
                    <div className="w-full bg-[var(--line)] h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--accent)]"
                        style={{ width: `${sale.percentagePaid}%` }}
                      />
                    </div>
                    <ReceivableBadge dueStatus={sale.dueStatus} dueDate={sale.dueDate} />
                  </div>
                )}

                {sale.isFullyPaid && sale.profitDistributionStatus === "READY_FOR_DISTRIBUTION" && (
                  <Link
                    href="/admin/investors"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white text-xs font-bold"
                  >
                    <Coins className="w-3.5 h-3.5" />
                    <span>Siap Bagi Hasil Investor</span>
                  </Link>
                )}

                {/* Tombol Aksi Berlabel Jelas (Min 44px) */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {!sale.isFullyPaid ? (
                    <Link
                      href={`/admin/sales/${sale.id}/payment`}
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-xl bg-[var(--accent)] text-white text-xs font-bold"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Terima Bayar</span>
                    </Link>
                  ) : (
                    <a
                      href={`/api/pdf/invoice/${sale.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-xl bg-[var(--accent)] text-white text-xs font-bold"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Cetak Kuitansi</span>
                    </a>
                  )}

                  <Link
                    href={`/admin/sales/${sale.id}`}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-xl bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)] text-xs font-bold"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Detail / Edit</span>
                  </Link>

                  {!sale.isFullyPaid && sale.buyer.phone && (
                    <a
                      href={generateReceivableReminderLink(sale.buyer.phone, {
                        buyerName: sale.buyer.name,
                        brand: sale.vehicle.brand,
                        model: sale.vehicle.model,
                        plateNumber: plate,
                        remainingAmount: sale.remainingAmount,
                        dueDate: sale.dueDate ? formatDate(sale.dueDate) : null,
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="col-span-2 flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-xl bg-[var(--ok-light)] border border-[var(--ok)]/30 text-[var(--ok)] text-xs font-bold"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Kirim Pengingat WA</span>
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── TAMPILAN TABEL DI DESKTOP (>= md) ── */}
      <div className="hidden md:block bg-[var(--surface)] border border-[var(--line)] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-[var(--bg)] border-b border-[var(--line)] text-xs font-bold uppercase text-[var(--muted)]">
                <th className="py-3.5 px-4">Tanggal</th>
                <th className="py-3.5 px-4">Unit</th>
                <th className="py-3.5 px-4">Pembeli</th>
                <th className="py-3.5 px-4">Harga Jual</th>
                <th className="py-3.5 px-4 w-56">Status Bayar</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[var(--muted)]">
                    Belum ada transaksi penjualan yang cocok.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  const plate = normalizePlateNumber(sale.vehicle.plateNumber);
                  const title = formatVehicleTitle(
                    sale.vehicle.brand,
                    sale.vehicle.model,
                    sale.vehicle.year
                  );

                  return (
                    <tr key={sale.id} className="hover:bg-[var(--bg)]/50 transition-colors">
                      <td className="py-4 px-4 align-top text-xs">
                        <div className="font-bold text-[var(--ink)]">{formatDate(sale.saleDate)}</div>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded bg-[var(--bg)] text-[var(--muted)] border border-[var(--line)] text-[11px] font-medium">
                          {sale.saleType === "SHOWROOM" ? "Showroom" : "Pembeli Langsung"}
                        </span>
                      </td>

                      <td className="py-4 px-4 align-top">
                        <div className="font-bold text-sm text-[var(--ink)]">{plate}</div>
                        <div className="text-xs text-[var(--muted)]">{title}</div>
                      </td>

                      <td className="py-4 px-4 align-top text-xs">
                        <div className="font-bold text-[var(--ink)]">{sale.buyer.name}</div>
                        {sale.buyer.phone && (
                          <div className="text-[var(--muted)] mt-0.5">{sale.buyer.phone}</div>
                        )}
                      </td>

                      <td className="py-4 px-4 align-top text-xs">
                        <div className="font-bold text-sm text-[var(--ink)]">
                          {formatRupiah(sale.sellingPrice)}
                        </div>
                        <div
                          className={cn(
                            "text-[11px] font-semibold mt-0.5",
                            sale.grossProfit < 0 ? "text-[var(--bad)]" : "text-[var(--ok)]"
                          )}
                        >
                          Laba: {formatRupiah(sale.grossProfit)}
                        </div>
                      </td>

                      <td className="py-4 px-4 align-top text-xs">
                        <div className="flex items-center justify-between font-bold mb-1">
                          <span className={sale.isFullyPaid ? "text-[var(--ok)]" : "text-[var(--bad)]"}>
                            {sale.isFullyPaid
                              ? "Lunas 100%"
                              : `Kurang ${formatRupiah(sale.remainingAmount)}`}
                          </span>
                          <span className="text-[11px] text-[var(--muted)]">
                            {sale.percentagePaid}%
                          </span>
                        </div>
                        <div className="w-full bg-[var(--line)] h-2 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full",
                              sale.isFullyPaid ? "bg-[var(--ok)]" : "bg-[var(--accent)]"
                            )}
                            style={{ width: `${sale.percentagePaid}%` }}
                          />
                        </div>
                        {!sale.isFullyPaid ? (
                          <div className="mt-1.5">
                            <ReceivableBadge dueStatus={sale.dueStatus} dueDate={sale.dueDate} />
                          </div>
                        ) : (
                          sale.profitDistributionStatus === "READY_FOR_DISTRIBUTION" && (
                            <div className="mt-1.5">
                              <Link
                                href="/admin/investors"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--accent)] text-white text-[11px] font-bold"
                              >
                                <Coins className="w-3 h-3" />
                                <span>Siap Bagi Hasil</span>
                              </Link>
                            </div>
                          )
                        )}
                      </td>

                      <td className="py-4 px-4 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {!sale.isFullyPaid && (
                            <Link
                              href={`/admin/sales/${sale.id}/payment`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Bayar</span>
                            </Link>
                          )}

                          <Link
                            href={`/admin/sales/${sale.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--line)] bg-white hover:bg-[var(--bg)] text-[var(--ink)] text-xs font-semibold"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Detail</span>
                          </Link>

                          <a
                            href={`/api/pdf/invoice/${sale.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[var(--line)] bg-white hover:bg-[var(--bg)] text-[var(--ink)] text-xs font-semibold"
                            title="Cetak Kuitansi PDF"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Kuitansi</span>
                          </a>

                          {!sale.isFullyPaid && sale.buyer.phone && (
                            <a
                              href={generateReceivableReminderLink(sale.buyer.phone, {
                                buyerName: sale.buyer.name,
                                brand: sale.vehicle.brand,
                                model: sale.vehicle.model,
                                plateNumber: plate,
                                remainingAmount: sale.remainingAmount,
                                dueDate: sale.dueDate ? formatDate(sale.dueDate) : null,
                              })}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[var(--ok)]/30 bg-[var(--ok-light)] text-[var(--ok)] text-xs font-semibold"
                              title="Kirim pengingat lewat WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>WA</span>
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

function ReceivableBadge({
  dueStatus,
  dueDate,
}: {
  dueStatus: { status: string; daysRemaining: number | null };
  dueDate?: string | Date | null;
}) {
  if (dueStatus.status === "OVERDUE") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--bad)] bg-[var(--bad-light)] px-2 py-0.5 rounded">
        <AlertTriangle className="w-3 h-3" />
        Lewat tempo ({Math.abs(dueStatus.daysRemaining || 0)} hari)
      </span>
    );
  }
  if (dueStatus.status === "DUE_SOON") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-[var(--warn-light)] px-2 py-0.5 rounded">
        <Clock className="w-3 h-3" />
        Jatuh tempo {dueStatus.daysRemaining} hari lagi
      </span>
    );
  }
  if (dueStatus.status === "ON_SCHEDULE" && dueDate) {
    return (
      <span className="text-[11px] text-[var(--muted)]">
        Jatuh tempo: {formatDate(dueDate)}
      </span>
    );
  }
  return null;
}

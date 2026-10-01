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
  ArrowRight,
  UserCheck,
  Building2,
  Repeat,
  FileText,
  ClipboardCheck,
  HeartHandshake,
  Coins,
  Sparkles,
} from "lucide-react";
import { formatRupiah, formatDate, cn } from "@/lib/utils";
import { createSaleAction, addSalePaymentAction } from "@/app/actions/sale";
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

export function SalesClient({ initialSales, availableVehicles }: SalesClientProps) {
  const [sales, setSales] = useState<SaleItem[]>(initialSales);
  const [selectedFilter, setSelectedFilter] = useState<"ALL" | "PENDING_RECEIVABLES" | "SETTLED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [showAddSaleModal, setShowAddSaleModal] = useState(false);
  const [selectedSaleForPayment, setSelectedSaleForPayment] = useState<SaleItem | null>(null);

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
    <div className="p-8 space-y-8">
      {/* ── KPI SUMMARY CARDS ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-[#EFECE8] border border-[#D9D4CB] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#6B6560]">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Omset Penjualan</span>
            <DollarSign className="w-5 h-5 text-[#D97706]" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-[#1C1917]">{formatRupiah(totalOmset)}</span>
            <div className="text-[11px] text-[#6B6560] mt-0.5">{sales.length} transaksi tercatat</div>
          </div>
        </div>

        <div className="bg-[#EFECE8] border border-[#D9D4CB] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#6B6560]">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Kas Masuk (Lunas/DP)</span>
            <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-[#16A34A]">{formatRupiah(totalDanaMasuk)}</span>
            <div className="text-[11px] text-[#6B6560] mt-0.5">Sudah masuk buku kas</div>
          </div>
        </div>

        <div className={cn(
          "border rounded-xl p-5 shadow-sm transition-all",
          totalSisaPiutang > 0 ? "bg-[#FEF3C7] border-[#D97706]/40" : "bg-[#EFECE8] border-[#D9D4CB]"
        )}>
          <div className="flex items-center justify-between text-[#92400E]">
            <span className="text-xs font-semibold uppercase tracking-wider">Sisa Piutang Berjalan</span>
            <Clock className="w-5 h-5 text-[#D97706]" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-[#D97706]">{formatRupiah(totalSisaPiutang)}</span>
            <div className="text-[11px] text-[#92400E] font-medium mt-0.5">
              Dari {totalPendingUnits} unit belum lunas
            </div>
          </div>
        </div>

        <div className="bg-[#EFECE8] border border-[#D9D4CB] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#6B6560]">
            <span className="text-xs font-semibold uppercase tracking-wider">Unit Lunas (Settled)</span>
            <Receipt className="w-5 h-5 text-[#1C1917]" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[#1C1917]">
              {sales.filter((s) => s.isFullyPaid).length}
            </span>
            <span className="text-xs text-[#6B6560]">siap bagi hasil</span>
          </div>
        </div>
      </div>

      {/* ── TOOLBAR & ACTIONS ─────────────────────────────────── */}
      <div className="bg-[#EFECE8] border border-[#D9D4CB] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#6B6560] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari plat nomor, nama pembeli, showroom rekanan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#F7F5F2] border border-[#D9D4CB] rounded-lg text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
          />
        </div>

        {/* Action Button: Input Penjualan */}
        <Link
          href="/admin/sales/new"
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#D97706] hover:bg-[#92400E] text-white rounded-lg text-sm font-bold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Input Penjualan Unit Baru</span>
        </Link>
      </div>

      {/* ── FILTER TABS ───────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-[#D9D4CB] pb-2">
        <button
          onClick={() => setSelectedFilter("ALL")}
          className={cn(
            "px-4 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer",
            selectedFilter === "ALL"
              ? "bg-[#1C1917] text-white shadow-sm"
              : "bg-[#EFECE8] text-[#6B6560] border border-[#D9D4CB]"
          )}
        >
          Semua Penjualan ({sales.length})
        </button>
        <button
          onClick={() => setSelectedFilter("PENDING_RECEIVABLES")}
          className={cn(
            "px-4 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5",
            selectedFilter === "PENDING_RECEIVABLES"
              ? "bg-[#D97706] text-white shadow-sm"
              : "bg-[#EFECE8] text-[#92400E] border border-[#D9D4CB]"
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
              ? "bg-[#16A34A] text-white shadow-sm"
              : "bg-[#EFECE8] text-[#6B6560] border border-[#D9D4CB]"
          )}
        >
          Terjual Lunas ({sales.filter((s) => s.isFullyPaid).length})
        </button>
      </div>

      {/* ── SALES TABLE ───────────────────────────────────────── */}
      <div className="bg-[#F7F5F2] border border-[#D9D4CB] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-[#EFECE8] border-b border-[#D9D4CB] text-xs font-bold uppercase text-[#6B6560]">
                <th className="py-3.5 px-4">Tanggal & Jalur</th>
                <th className="py-3.5 px-4">Unit Mobil</th>
                <th className="py-3.5 px-4">Pembeli / Showroom</th>
                <th className="py-3.5 px-4">Harga Kesepakatan</th>
                <th className="py-3.5 px-4 w-60">Status Pelunasan</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9D4CB]">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#6B6560]">
                    Tidak ada transaksi penjualan yang cocok dengan filter saat ini.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  return (
                    <tr key={sale.id} className="hover:bg-[#EFECE8]/50 transition-colors">
                      {/* Tanggal & Jalur */}
                      <td className="py-4 px-4 align-top text-xs">
                        <div className="font-bold text-[#1C1917]">{formatDate(sale.saleDate)}</div>
                        <span className={cn(
                          "inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold border",
                          sale.saleType === "SHOWROOM"
                            ? "bg-[#FEF3C7] text-[#92400E] border-[#D97706]/30"
                            : "bg-[#DCFCE7] text-[#16A34A] border-[#16A34A]/30"
                        )}>
                          {sale.saleType === "SHOWROOM" ? "Showroom Rekanan" : "Konsumen Langsung"}
                        </span>
                      </td>

                      {/* Unit Mobil */}
                      <td className="py-4 px-4 align-top">
                        <div className="font-bold text-base text-[#1C1917]">{sale.vehicle.plateNumber}</div>
                        <div className="text-xs text-[#6B6560]">
                          {sale.vehicle.brand} {sale.vehicle.model} ({sale.vehicle.year})
                        </div>
                      </td>

                      {/* Pembeli */}
                      <td className="py-4 px-4 align-top text-xs">
                        <div className="font-bold text-[#1C1917] flex items-center gap-1.5">
                          {sale.buyer.isShowroom ? <Building2 className="w-3.5 h-3.5 text-[#D97706]" /> : <UserCheck className="w-3.5 h-3.5 text-[#16A34A]" />}
                          <span>{sale.buyer.name}</span>
                        </div>
                        {sale.buyer.phone && (
                          <div className="text-[#6B6560] mt-0.5">{sale.buyer.phone}</div>
                        )}
                        {sale.buyer.address && (
                          <div className="text-[11px] text-[#6B6560] truncate max-w-xs mt-0.5">{sale.buyer.address}</div>
                        )}
                      </td>

                      {/* Harga Jual & Estimasi Laba */}
                      <td className="py-4 px-4 align-top text-xs">
                        <div className="font-bold text-base text-[#1C1917]">
                          {formatRupiah(sale.sellingPrice)}
                        </div>
                        <div className="text-[11px] text-[#16A34A] font-semibold mt-0.5">
                          Laba Kotor: +{formatRupiah(sale.grossProfit)}
                        </div>
                      </td>

                      {/* Progress Pelunasan */}
                      <td className="py-4 px-4 align-top text-xs">
                        <div className="flex items-center justify-between font-bold mb-1">
                          <span className={sale.isFullyPaid ? "text-[#16A34A]" : "text-[#D97706]"}>
                            {sale.isFullyPaid ? "Lunas 100%" : `Kurang ${formatRupiah(sale.remainingAmount)}`}
                          </span>
                          <span className="text-[11px] text-[#6B6560]">{sale.percentagePaid}%</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-[#D9D4CB] h-2 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full transition-all duration-500",
                              sale.isFullyPaid ? "bg-[#16A34A]" : "bg-[#D97706]"
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
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs hover:opacity-95 transition-opacity"
                                title="Unit didanai investor & belum dibagikan labanya. Klik untuk bagi hasil."
                              >
                                <Coins className="w-3 h-3 animate-spin" />
                                <span>Siap Bagi Hasil ({sale.investorNames?.join(", ") || "Investor"})</span>
                              </Link>
                            )}
                            {sale.profitDistributionStatus === "DISTRIBUTED" && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Bagi Hasil Selesai</span>
                              </span>
                            )}
                            {sale.profitDistributionStatus === "OWNER_ONLY" && (
                              <span className="text-[10px] text-[#6B6560]">
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
                              className="p-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-600 hover:text-white text-amber-800 transition-colors shadow-xs"
                              title="Bagi Hasil ke Investor Sekarang"
                            >
                              <HeartHandshake className="w-4 h-4" />
                            </Link>
                          )}

                          {/* Tombol Catat Pembayaran */}
                          {!sale.isFullyPaid && (
                            <Link
                              href={`/admin/sales/${sale.id}/payment`}
                              className="p-1.5 rounded-lg border border-[#D9D4CB] bg-[#EFECE8] hover:bg-[#D97706] hover:text-white text-[#1C1917] transition-colors"
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
                            className="p-1.5 rounded-lg border border-[#D9D4CB] bg-[#EFECE8] hover:bg-[#1C1917] hover:text-white text-[#1C1917] transition-colors"
                            title="Cetak Kuitansi / Faktur Pembayaran (Meterai)"
                          >
                            <Printer className="w-4 h-4" />
                          </a>

                          {/* Tombol Unduh Surat Perjanjian Jual Beli (SPK & S&K) */}
                          <a
                            href={`/api/pdf/agreement/${sale.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg border border-[#D9D4CB] bg-[#EFECE8] hover:bg-[#2563EB] hover:text-white text-[#1C1917] transition-colors"
                            title="Cetak Surat Perjanjian Jual Beli (SPK & Syarat Ketentuan)"
                          >
                            <FileText className="w-4 h-4" />
                          </a>

                          {/* Tombol Unduh BAST Serah Terima Kendaraan */}
                          <a
                            href={`/api/pdf/bast/${sale.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg border border-[#D9D4CB] bg-[#EFECE8] hover:bg-[#059669] hover:text-white text-[#1C1917] transition-colors"
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
                              className="p-1.5 rounded-lg border border-[#16A34A]/30 bg-[#DCFCE7] hover:bg-[#16A34A] hover:text-white text-[#16A34A] transition-colors"
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

      {/* ── MODALS ────────────────────────────────────────────── */}
      {/* 1. Modal Input Penjualan */}
      {showAddSaleModal && (
        <CreateSaleModal
          availableVehicles={availableVehicles}
          onClose={() => setShowAddSaleModal(false)}
          onSuccess={() => {
            window.location.reload();
          }}
        />
      )}

      {/* 2. Modal Catat Pembayaran Masuk */}
      {selectedSaleForPayment && (
        <AddPaymentModal
          sale={selectedSaleForPayment}
          availableVehicles={availableVehicles}
          onClose={() => setSelectedSaleForPayment(null)}
          onSuccess={() => {
            window.location.reload();
          }}
        />
      )}
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
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#DC2626] bg-[#FEE2E2] px-2 py-0.5 rounded border border-[#DC2626]/30 animate-pulse">
        <AlertTriangle className="w-3 h-3" />
        Lewat Jatuh Tempo ({Math.abs(dueStatus.daysRemaining || 0)} hari)
      </span>
    );
  }
  if (dueStatus.status === "DUE_SOON") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#CA8A04] bg-[#FEF9C3] px-2 py-0.5 rounded border border-[#CA8A04]/30">
        <Clock className="w-3 h-3" />
        Jatuh Tempo H-{dueStatus.daysRemaining}
      </span>
    );
  }
  if (dueStatus.status === "ON_SCHEDULE" && dueDate) {
    return (
      <span className="text-[10px] text-[#6B6560]">
        Jatuh Tempo: {formatDate(dueDate)}
      </span>
    );
  }
  return null;
}

// ── MODAL INPUT PENJUALAN ──────────────────────────────────────
function CreateSaleModal({
  availableVehicles,
  onClose,
  onSuccess,
}: {
  availableVehicles: AvailableVehicle[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [vehicleId, setVehicleId] = useState(availableVehicles[0]?.id || "");
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split("T")[0]);
  const [saleType, setSaleType] = useState("DIRECT_CUSTOMER");
  const [sellingPrice, setSellingPrice] = useState<number | "">("");
  const [dueDate, setDueDate] = useState("");

  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerIsShowroom, setBuyerIsShowroom] = useState(false);
  const [buyerAddress, setBuyerAddress] = useState("");

  const [initialPaymentAmount, setInitialPaymentAmount] = useState<number | "">("");
  const [initialPaymentMethod, setInitialPaymentMethod] = useState("TRANSFER");
  const [tradeInVehicleId, setTradeInVehicleId] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const selectedUnit = availableVehicles.find((v) => v.id === vehicleId);

  const priceNum = Number(sellingPrice) || 0;
  const initialNum = Number(initialPaymentAmount) || 0;
  const isTempo = priceNum > 0 && initialNum < priceNum;
  const minDp70 = Math.ceil(priceNum * 0.7);
  const isDpValid = !isTempo || initialNum >= minDp70;
  const maxDueDate = new Date(new Date(saleDate).getTime() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId || !sellingPrice || Number(sellingPrice) <= 0) return;

    if (isTempo) {
      if (initialNum < minDp70) {
        setErrorMsg(
          `Kebijakan Nur Mobil: Pembelian Cash Tempo wajib DP minimal 70% (${formatRupiah(minDp70)}). Tidak melayani kredit leasing.`
        );
        return;
      }
      if (!dueDate) {
        setErrorMsg("Tanggal jatuh tempo pelunasan wajib diisi untuk transaksi tempo.");
        return;
      }
      const saleTime = new Date(saleDate).getTime();
      const dueTime = new Date(dueDate).getTime();
      const diffDays = Math.ceil((dueTime - saleTime) / (1000 * 60 * 60 * 24));
      if (diffDays > 30 || diffDays < 0) {
        setErrorMsg(
          "Kebijakan Nur Mobil: Batas jatuh tempo Cash Tempo maksimal 30 hari (1 bulan) dari tanggal transaksi."
        );
        return;
      }
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await createSaleAction({
        vehicleId,
        saleDate: new Date(saleDate),
        saleType: saleType as any,
        sellingPrice: Number(sellingPrice),
        dueDate: dueDate ? new Date(dueDate) : undefined,
        buyerName,
        buyerPhone: buyerPhone || undefined,
        buyerIsShowroom,
        buyerAddress: buyerAddress || undefined,
        initialPaymentAmount: initialPaymentAmount ? Number(initialPaymentAmount) : 0,
        initialPaymentMethod,
        tradeInVehicleId: tradeInVehicleId || undefined,
      });

      if (!res.success) {
        throw new Error(res.error);
      }

      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal mencatat penjualan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-[#F7F5F2] border border-[#D9D4CB] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6">
        <div className="flex items-center justify-between border-b border-[#D9D4CB] pb-4 mb-4">
          <h2 className="text-lg font-bold text-[#1C1917]">Pencatatan Penjualan Unit</h2>
          <button onClick={onClose} className="text-[#6B6560] hover:text-[#1C1917] font-bold text-xl cursor-pointer">
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-[#FEE2E2] border border-[#DC2626]/30 text-[#DC2626] text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Pilih Mobil */}
          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1">Pilih Unit Kendaraan</label>
            {availableVehicles.length === 0 ? (
              <div className="p-3 bg-[#EFECE8] rounded-lg text-xs text-[#DC2626] font-semibold">
                Tidak ada unit berstatus Ready Jual atau Booked di inventori.
              </div>
            ) : (
              <select
                required
                value={vehicleId}
                onChange={(e) => {
                  setVehicleId(e.target.value);
                  const found = availableVehicles.find((v) => v.id === e.target.value);
                  if (found?.targetSellingPrice) setSellingPrice(found.targetSellingPrice);
                }}
                className="w-full px-3 py-2 bg-white border border-[#D9D4CB] rounded-lg text-sm font-bold"
              >
                {availableVehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.plateNumber} — {v.brand} {v.model} ({v.year}) • HPP: {formatRupiah(v.totalHpp)}
                  </option>
                ))}
              </select>
            )}
            {selectedUnit && (
              <div className="flex items-center gap-3 text-xs text-[#6B6560] mt-1.5 font-medium">
                <span>HPP: <strong>{formatRupiah(selectedUnit.totalHpp)}</strong></span>
                {selectedUnit.minSellingPrice && (
                  <span>• Batas Bawah Nego: <strong>{formatRupiah(selectedUnit.minSellingPrice)}</strong></span>
                )}
              </div>
            )}
          </div>

          {/* Jalur & Harga Kesepakatan */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-[#D9D4CB] pt-4">
            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1">Jalur Penjualan</label>
              <select
                value={saleType}
                onChange={(e) => {
                  setSaleType(e.target.value);
                  setBuyerIsShowroom(e.target.value === "SHOWROOM");
                }}
                className="w-full px-3 py-2 bg-white border border-[#D9D4CB] rounded-lg text-sm"
              >
                <option value="DIRECT_CUSTOMER">Konsumen Langsung (Retail)</option>
                <option value="SHOWROOM">Showroom Rekanan (Wholesale / Tempo)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1">Harga Kesepakatan (Rp)</label>
              <input
                required
                type="number"
                placeholder="165000000"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-[#D9D4CB] rounded-lg text-sm font-bold text-[#1C1917]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1">Tanggal Transaksi</label>
              <input
                required
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#D9D4CB] rounded-lg text-sm"
              />
            </div>
          </div>

          {/* Data Pembeli */}
          <div className="border-t border-[#D9D4CB] pt-4 space-y-3">
            <h3 className="text-xs font-bold uppercase text-[#6B6560]">Identitas Pembeli</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1">Nama Pembeli / Showroom</label>
                <input
                  required
                  type="text"
                  placeholder="Contoh: Pak Bambang / Showroom Maju Jaya"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#D9D4CB] rounded-lg text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1">Nomor WhatsApp / HP</label>
                <input
                  type="text"
                  placeholder="Contoh: 08123456789"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#D9D4CB] rounded-lg text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1">Alamat Pembeli (Opsional)</label>
              <input
                type="text"
                placeholder="Alamat domisili atau alamat showroom rekanan"
                value={buyerAddress}
                onChange={(e) => setBuyerAddress(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#D9D4CB] rounded-lg text-sm"
              />
            </div>
          </div>

          {/* Pembayaran Awal / Tanda Jadi (DP) */}
          <div className="border-t border-[#D9D4CB] pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase text-[#6B6560]">Pembayaran Awal / DP Masuk</h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                100% Cash / Tempo Garasi (Non-Leasing)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1">Nominal Masuk (Rp)</label>
                <input
                  type="number"
                  placeholder="Contoh: 105000000"
                  value={initialPaymentAmount}
                  onChange={(e) => setInitialPaymentAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-[#D9D4CB] rounded-lg text-sm font-bold text-[#16A34A]"
                />
                {priceNum > 0 && isTempo && (
                  <span className="text-[10px] text-[#6B6560] mt-1 block">
                    Min. DP 70%: <strong>{formatRupiah(minDp70)}</strong>
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1">Metode Bayar</label>
                <select
                  value={initialPaymentMethod}
                  onChange={(e) => setInitialPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#D9D4CB] rounded-lg text-sm"
                >
                  <option value="TRANSFER">Transfer Bank</option>
                  <option value="CASH">Uang Tunai (Cash)</option>
                  <option value="TRADE_IN">Tukar Tambah (Trade-In Mobil)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                  Jatuh Tempo Pelunasan {isTempo && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="date"
                  min={saleDate}
                  max={maxDueDate}
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#D9D4CB] rounded-lg text-sm"
                />
                <span className="text-[10px] text-[#6B6560] mt-1 block">
                  Batas maks 30 hari (s/d {maxDueDate})
                </span>
              </div>
            </div>

            {/* Banner Kebijakan Cash Tempo Khusus Nur Mobil */}
            {isTempo && (
              <div className="mt-2 space-y-2">
                {!isDpValid ? (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs">
                    <strong className="block font-bold">DP Kurang dari Batas Minimal 70%!</strong>
                    Aturan Nur Mobil: Pembelian tempo wajib DP minimal 70% ({formatRupiah(minDp70)}). Sisa maksimal 30% ({formatRupiah(priceNum - minDp70)}) diselesaikan dalam 30 hari.
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-[#78350F] text-xs">
                    <strong className="block font-bold">Ketentuan Jaminan Dokumen:</strong>
                    Asli BPKB dan Asli STNK <strong>wajib ditahan di brankas showroom</strong> sampai sisa pelunasan 100% diterima. Konsumen hanya memegang Surat Jalan resmi sementara.
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#D9D4CB]">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-[#6B6560]">
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || availableVehicles.length === 0}
              className="px-6 py-2.5 bg-[#D97706] hover:bg-[#92400E] text-white rounded-lg text-sm font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? "Menyimpan Transaksi..." : "Simpan Penjualan & Terbitkan Kuitansi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── MODAL CATAT PEMBAYARAN ANGSURAN ────────────────────────────
function AddPaymentModal({
  sale,
  availableVehicles,
  onClose,
  onSuccess,
}: {
  sale: SaleItem;
  availableVehicles: AvailableVehicle[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState<number | "">(sale.remainingAmount);
  const [paidAt, setPaidAt] = useState(new Date().toISOString().split("T")[0]);
  const [method, setMethod] = useState("TRANSFER");
  const [tradeInVehicleId, setTradeInVehicleId] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;
    setLoading(true);

    try {
      const res = await addSalePaymentAction({
        saleId: sale.id,
        amount: Number(amount),
        paidAt: new Date(paidAt),
        method,
        tradeInVehicleId: method === "TRADE_IN" ? tradeInVehicleId : undefined,
        notes: notes || undefined,
      });

      if (!res.success) {
        throw new Error(res.error);
      }

      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal mencatat pembayaran");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-[#F7F5F2] border border-[#D9D4CB] rounded-2xl w-full max-w-md shadow-2xl p-6">
        <div className="flex items-center justify-between border-b border-[#D9D4CB] pb-4 mb-4">
          <div>
            <h2 className="text-base font-bold text-[#1C1917]">Catat Pembayaran Masuk</h2>
            <div className="text-xs text-[#6B6560]">
              {sale.vehicle.brand} {sale.vehicle.model} ({sale.vehicle.plateNumber}) • {sale.buyer.name}
            </div>
          </div>
          <button onClick={onClose} className="text-[#6B6560] hover:text-[#1C1917] font-bold text-xl cursor-pointer">
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-[#FEE2E2] border border-[#DC2626]/30 text-[#DC2626] text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <div className="mb-4 p-3 bg-[#EFECE8] rounded-xl text-xs flex justify-between items-center">
          <span className="text-[#6B6560]">Sisa Piutang Saat Ini:</span>
          <span className="font-bold text-sm text-[#D97706]">{formatRupiah(sale.remainingAmount)}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1">Nominal Pembayaran (Rp)</label>
            <input
              required
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-3 py-2 bg-white border border-[#D9D4CB] rounded-lg text-sm font-bold text-[#16A34A]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1">Metode</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#D9D4CB] rounded-lg text-sm"
              >
                <option value="TRANSFER">Transfer Bank</option>
                <option value="CASH">Uang Tunai</option>
                <option value="TRADE_IN">Tukar Tambah</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1">Tanggal</label>
              <input
                required
                type="date"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#D9D4CB] rounded-lg text-sm"
              />
            </div>
          </div>

          {method === "TRADE_IN" && (
            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1">Pilih Mobil Konsumen (Trade-In)</label>
              <select
                value={tradeInVehicleId}
                onChange={(e) => setTradeInVehicleId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#D9D4CB] rounded-lg text-xs"
              >
                <option value="">-- Pilih unit mobil lama yang di-intake --</option>
                {availableVehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.plateNumber} — {v.brand} {v.model} ({v.year})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1">Catatan / Bukti Transfer</label>
            <input
              type="text"
              placeholder="Contoh: Transfer BCA a/n Bambang / Pelunasan"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#D9D4CB] rounded-lg text-sm"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#D9D4CB]">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-[#6B6560]">
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-[#D97706] hover:bg-[#92400E] text-white rounded-lg text-sm font-bold shadow-sm transition-colors cursor-pointer"
            >
              {loading ? "Menyimpan..." : "Catat & Update Pelunasan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

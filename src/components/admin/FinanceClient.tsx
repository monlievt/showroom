"use client";

import React, { useState } from "react";
import {
  Wallet,
  Receipt,
  Plus,
  Car,
  Wrench,
  Building,
  ShoppingBag,
  Trash2,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import { formatRupiah, formatDate, cn } from "@/lib/utils";
import { recordManualCashTransaction } from "@/app/actions/cash-transaction";
import { createShowroomAsset, deleteShowroomAsset } from "@/app/actions/asset";
import {
  recordOperationalExpense,
  recordOwnerDraw,
  recordOwnerEquity,
} from "@/app/actions/operational-expense";

interface FinanceProps {
  summary: {
    cashBalance: number;
    activeAllocatedCapital: number;
    totalProfitPaid: number;
    totalOwnerProfit: number;
    totalInvestorProfit: number;
    pendingDistributionsCount: number;
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
  assets?: {
    items: Array<{
      id: string;
      name: string;
      category: string;
      purchaseDate: string | Date;
      purchaseCost: number;
      currentValue: number;
      condition: string;
      location?: string | null;
      notes?: string | null;
      createdAt: string | Date;
    }>;
    totalPurchaseCost: number;
    totalCurrentValue: number;
    totalItems: number;
  };
  operationalData?: {
    operationalExpenses: Array<{
      id: string;
      category: string;
      recipient?: string | null;
      amount: number;
      date: string | Date;
      notes?: string | null;
      receiptUrl?: string | null;
      createdAt: string | Date;
    }>;
    ownerDraws: Array<{
      id: string;
      amount: number;
      notes?: string | null;
      createdAt: string | Date;
      runningBalance: number;
    }>;
    ownerEquities: Array<{
      id: string;
      amount: number;
      notes?: string | null;
      createdAt: string | Date;
      runningBalance: number;
    }>;
    totalOperational: number;
    totalOwnerDraw: number;
    totalOwnerEquity: number;
  };
}

const ASSET_CATEGORY_LABELS: Record<string, string> = {
  INSPECTION_TOOLS: "Alat Inspeksi & Uji Fisik",
  WORKSHOP_EQUIPMENT: "Peralatan Salon & Bengkel",
  OFFICE_ELECTRONICS: "Elektronik & Kasir Kantor",
  FACILITY_FURNITURE: "Fasilitas & Plang Showroom",
  OPERATIONAL_VEHICLE: "Kendaraan Operasional",
  OTHER: "Lainnya",
};

const ASSET_CONDITION_LABELS: Record<string, { label: string; badge: string }> = {
  EXCELLENT: { label: "Sangat Baik / Baru", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  GOOD: { label: "Bagus / Normal", badge: "bg-blue-50 text-blue-700 border-blue-200" },
  FAIR: { label: "Perlu Servis Ringan", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  DAMAGED: { label: "Rusak / Butuh Ganti", badge: "bg-red-50 text-red-700 border-red-200" },
};

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

export function FinanceClient({
  summary,
  cashTransactions,
  assets = { items: [], totalPurchaseCost: 0, totalCurrentValue: 0, totalItems: 0 },
  operationalData = {
    operationalExpenses: [],
    ownerDraws: [],
    ownerEquities: [],
    totalOperational: 0,
    totalOwnerDraw: 0,
    totalOwnerEquity: 0,
  },
}: FinanceProps) {
  const [activeTab, setActiveTab] = useState<"cash" | "expenses_prive" | "assets_inventory">("cash");

  // Modals state
  const [showManualCashModal, setShowManualCashModal] = useState(false);
  const [showOpExModal, setShowOpExModal] = useState(false);
  const [showOwnerDrawModal, setShowOwnerDrawModal] = useState(false);
  const [showOwnerEquityModal, setShowOwnerEquityModal] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);

  // Cash Form State
  const [cashType, setCashType] = useState("IN_CAPITAL_DEPOSIT");
  const [cashAmount, setCashAmount] = useState("");
  const [cashNotes, setCashNotes] = useState("");

  // Asset Form State
  const [assetName, setAssetName] = useState("");
  const [assetCategory, setAssetCategory] = useState<
    "INSPECTION_TOOLS" | "WORKSHOP_EQUIPMENT" | "OFFICE_ELECTRONICS" | "FACILITY_FURNITURE" | "OPERATIONAL_VEHICLE" | "OTHER"
  >("INSPECTION_TOOLS");
  const [assetPurchaseDate, setAssetPurchaseDate] = useState(new Date().toISOString().split("T")[0]);
  const [assetPurchaseCost, setAssetPurchaseCost] = useState("");
  const [assetCurrentValue, setAssetCurrentValue] = useState("");
  const [assetCondition, setAssetCondition] = useState<"EXCELLENT" | "GOOD" | "FAIR" | "DAMAGED">("GOOD");
  const [assetLocation, setAssetLocation] = useState("");
  const [assetNotes, setAssetNotes] = useState("");
  const [assetDeductCash, setAssetDeductCash] = useState(false);

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

  // Filter for Expenses & Prive tab
  const [expenseFilter, setExpenseFilter] = useState<"ALL" | "OPERATIONAL" | "OWNER_DRAW" | "OWNER_EQUITY">("ALL");

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showNotification = (message: string, type: "success" | "error") => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 5000);
  };

  // Handler: Transaksi Kas Manual
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
      showNotification("Transaksi kas manual berhasil dicatat!", "success");
      setShowManualCashModal(false);
      setCashAmount("");
      setCashNotes("");
    } else {
      showNotification(res.error || "Gagal mencatat transaksi kas", "error");
    }
  };

  // Handler: Catat Beban Operasional Showroom
  const handleOpExSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opExAmount) return;

    setLoading(true);
    const res = await recordOperationalExpense({
      category: opExCategory,
      recipient: opExRecipient,
      amount: Number(opExAmount),
      date: new Date(opExDate),
      notes: opExNotes,
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

  // Handler: Catat Prive Owner
  const handleOwnerDrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!drawAmount || !drawNotes) return;

    setLoading(true);
    const res = await recordOwnerDraw({
      amount: Number(drawAmount),
      date: new Date(drawDate),
      notes: drawNotes,
    });
    setLoading(false);

    if (res.success) {
      showNotification("Penarikan pribadi (Prive) berhasil dicatat! Saldo kas BCA berkurang tanpa mengganggu laba showroom.", "success");
      setShowOwnerDrawModal(false);
      setDrawAmount("");
      setDrawNotes("");
    } else {
      showNotification(res.error || "Gagal mencatat penarikan pribadi", "error");
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

  // Handler: Tambah Aset Showroom Baru
  const handleAssetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName || !assetPurchaseCost) return;

    setLoading(true);
    const res = await createShowroomAsset(
      {
        name: assetName,
        category: assetCategory,
        purchaseDate: new Date(assetPurchaseDate),
        purchaseCost: Number(assetPurchaseCost),
        currentValue: assetCurrentValue ? Number(assetCurrentValue) : Number(assetPurchaseCost),
        condition: assetCondition,
        location: assetLocation,
        notes: assetNotes,
      },
      assetDeductCash
    );
    setLoading(false);

    if (res.success) {
      showNotification("Aset tetap showroom berhasil ditambahkan ke inventaris!", "success");
      setShowAssetModal(false);
      setAssetName("");
      setAssetPurchaseCost("");
      setAssetCurrentValue("");
      setAssetLocation("");
      setAssetNotes("");
      setAssetDeductCash(false);
    } else {
      showNotification(res.error || "Gagal menambah aset", "error");
    }
  };

  // Handler: Hapus Aset Showroom
  const handleDeleteAsset = async (id: string, name: string) => {
    if (!confirm(`Hapus aset "${name}" dari inventaris?`)) return;

    setLoading(true);
    const res = await deleteShowroomAsset(id);
    setLoading(false);

    if (res.success) {
      showNotification(`Aset "${name}" berhasil dihapus.`, "success");
    } else {
      showNotification(res.error || "Gagal menghapus aset", "error");
    }
  };

  // Gabungkan riwayat untuk tab expenses_prive
  const combinedExpensesPriveList = [
    ...operationalData.operationalExpenses.map((e) => ({
      id: e.id,
      type: "OPERATIONAL",
      title: OPEX_CATEGORY_LABELS[e.category] || e.category,
      categoryBadge: "Beban Operasional",
      badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
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
      title: "Prive Pribadi Owner",
      categoryBadge: "Prive (Pribadi)",
      badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
      recipient: "Owner (Keluarga)",
      amount: d.amount,
      isOutgoing: true,
      date: d.createdAt,
      notes: d.notes || "Penarikan kebutuhan pribadi",
      impactText: "Memotong kas BCA, TIDAK merusak laba mobil",
    })),
    ...operationalData.ownerEquities.map((eq) => ({
      id: eq.id,
      type: "OWNER_EQUITY",
      title: "Setoran Modal Pribadi",
      categoryBadge: "Injeksi Modal",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
      recipient: "Showroom (Rek BCA)",
      amount: eq.amount,
      isOutgoing: false,
      date: eq.createdAt,
      notes: eq.notes || "Setoran modal kas pribadi",
      impactText: "Menambah kas BCA showroom",
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredExpensesList = combinedExpensesPriveList.filter((item) => {
    if (expenseFilter === "ALL") return true;
    return item.type === expenseFilter;
  });

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

      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1C1917] tracking-tight">
            Keuangan & Buku Kas Showroom
          </h1>
          <p className="text-sm text-[#6B6560] mt-1">
            Buku kas BCA, pemisahan pengeluaran (operasional vs prive belanja rumah tangga), dan nilai stok vs aset peralatan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowOwnerDrawModal(true)}
            className="flex items-center gap-1.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-purple-600" />
            <span>+ Catat Prive (Pribadi)</span>
          </button>

          <button
            onClick={() => setShowOpExModal(true)}
            className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <Building className="w-3.5 h-3.5 text-blue-600" />
            <span>+ Beban Operasional</span>
          </button>

          <button
            onClick={() => setShowManualCashModal(true)}
            className="flex items-center gap-1.5 bg-white hover:bg-[#F7F5F2] border border-[#D9D4CB] text-[#1C1917] px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <Receipt className="w-3.5 h-3.5 text-[#D97706]" />
            <span>+ Kas Masuk/Keluar</span>
          </button>
        </div>
      </div>

      {/* 5 KARTU KPI KEUANGAN (KAS, STOK, ASET, OPEX, PRIVE) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#D9D4CB] shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[#6B6560]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Kas Rekening BCA</span>
            <Wallet className="w-4 h-4 text-[#D97706]" />
          </div>
          <div className="text-xl font-black text-[#1C1917] tracking-tight">
            {formatRupiah(summary.cashBalance)}
          </div>
          <p className="text-[10px] text-[#6B6560]">Total kas riil on-hand di rekening</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#D9D4CB] shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[#6B6560]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Stok Mobil (HPP)</span>
            <Car className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-700 tracking-tight">
            {formatRupiah(summary.totalInventoryValue || 0)}
          </div>
          <p className="text-[10px] text-[#6B6560]">
            {summary.activeVehiclesCount || 0} unit aktif (Aset Lancar)
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#D9D4CB] shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[#6B6560]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Aset Peralatan</span>
            <Wrench className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-black text-blue-700 tracking-tight">
            {formatRupiah(summary.totalAssetValue || assets.totalCurrentValue)}
          </div>
          <p className="text-[10px] text-[#6B6560]">
            {summary.assetsCount || assets.totalItems} alat kerja (Aset Tetap)
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#D9D4CB] shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[#6B6560]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Beban Operasional</span>
            <Building className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-black text-[#1C1917] tracking-tight">
            {formatRupiah(summary.totalOperationalExpenses || operationalData.totalOperational)}
          </div>
          <p className="text-[10px] text-[#6B6560]">Sewa, listrik, WiFi & iklan</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#D9D4CB] shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[#6B6560]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Prive Owner (BCA)</span>
            <ShoppingBag className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-black text-rose-700 tracking-tight">
            {formatRupiah(summary.totalOwnerDraw || operationalData.totalOwnerDraw)}
          </div>
          <p className="text-[10px] text-[#6B6560]">Pengeluaran pribadi (Non-HPP)</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-[#D9D4CB] gap-4 sm:gap-6 text-xs sm:text-sm font-semibold overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab("cash")}
          className={cn(
            "pb-3 -mb-px transition-colors cursor-pointer shrink-0",
            activeTab === "cash"
              ? "border-b-2 border-[#D97706] text-[#D97706] font-bold"
              : "text-[#6B6560] hover:text-[#1C1917]"
          )}
        >
          Buku Kas Rekening BCA & Mutasi
        </button>

        <button
          onClick={() => setActiveTab("expenses_prive")}
          className={cn(
            "pb-3 -mb-px transition-colors cursor-pointer shrink-0 flex items-center gap-1.5",
            activeTab === "expenses_prive"
              ? "border-b-2 border-[#D97706] text-[#D97706] font-bold"
              : "text-[#6B6560] hover:text-[#1C1917]"
          )}
        >
          <span>Pemisahan Beban & Prive (BCA)</span>
          <span className="bg-purple-100 text-purple-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
            Pemisah Kas
          </span>
        </button>

        <button
          onClick={() => setActiveTab("assets_inventory")}
          className={cn(
            "pb-3 -mb-px transition-colors cursor-pointer shrink-0 flex items-center gap-1.5",
            activeTab === "assets_inventory"
              ? "border-b-2 border-[#D97706] text-[#D97706] font-bold"
              : "text-[#6B6560] hover:text-[#1C1917]"
          )}
        >
          <span>Stok vs Aset Showroom</span>
          <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
            {assets.totalItems} Alat
          </span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: BUKU KAS REKENING BCA & MUTASI
          ========================================================================= */}
      {activeTab === "cash" && (
        <div className="bg-white rounded-2xl border border-[#D9D4CB] overflow-hidden shadow-sm">
          <div className="p-5 border-b border-[#D9D4CB] flex items-center justify-between bg-[#FBF9F6]">
            <div>
              <h3 className="font-bold text-[#1C1917]">Buku Kas Utama (Rekonsiliasi Mutasi Rekening BCA)</h3>
              <p className="text-xs text-[#6B6560] mt-0.5">
                Mencatat mutasi masuk & keluar kas bank: penjualan unit, perbaikan, operasional, dan penarikan prive.
              </p>
            </div>
            <button
              onClick={() => setShowManualCashModal(true)}
              className="bg-[#D97706] hover:bg-[#B45309] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              + Transaksi Kas
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F7F5F2] text-xs uppercase text-[#6B6560] font-semibold">
                <tr>
                  <th className="py-3 px-4">Tanggal & Waktu</th>
                  <th className="py-3 px-4">Tipe Transaksi</th>
                  <th className="py-3 px-4">Keterangan / Terkait Unit</th>
                  <th className="py-3 px-4 text-right">Mutasi (Rp)</th>
                  <th className="py-3 px-4 text-right">Saldo Berjalan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9D4CB]">
                {cashTransactions.map((tx) => {
                  const isIncoming =
                    tx.type === "IN_SALE_PAYMENT" ||
                    tx.type === "IN_CAPITAL_DEPOSIT" ||
                    tx.type === "IN_OWNER_EQUITY";

                  return (
                    <tr key={tx.id} className="hover:bg-[#FAF9F6]">
                      <td className="py-3 px-4 text-xs text-[#6B6560] whitespace-nowrap">
                        {formatDate(tx.createdAt)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider",
                            isIncoming
                              ? "bg-emerald-100 text-emerald-800"
                              : tx.type === "OUT_OWNER_DRAW"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-red-100 text-red-800"
                          )}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-[#1C1917]">
                        {tx.notes || (tx.vehiclePlate ? `Unit ${tx.vehiclePlate} (${tx.vehicleName})` : "-")}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-xs whitespace-nowrap">
                        <span className={isIncoming ? "text-emerald-600" : "text-red-600"}>
                          {isIncoming ? "+ " : "- "}
                          {formatRupiah(tx.amount)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-xs text-[#1C1917] whitespace-nowrap">
                        {formatRupiah(tx.runningBalance)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: PEMISAHAN BEBAN SHOWROOM VS PRIVE PRIBADI (REKENING BCA)
          ========================================================================= */}
      {activeTab === "expenses_prive" && (
        <div className="space-y-6">
          {/* EDUKASI & PENJELASAN 3 KANTONG PENGELUARAN */}
          <div className="bg-[#EFECE8] border border-[#D9D4CB] rounded-2xl p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base text-[#1C1917]">
                  Solusi Rekening BCA Campur: Pemisahan Pengeluaran 3 Kantong
                </h3>
                <p className="text-xs text-[#6B6560] leading-relaxed">
                  Jika transaksi showroom dan belanja rumah tangga masih menggunakan 1 rekening BCA yang sama,
                  catat setiap mutasi ke dalam kategori yang tepat agar <strong>saldo buku kas selalu cocok dengan mutasi bank</strong> tanpa merusak perhitungan laba mobil.
                </p>
              </div>
            </div>

            {/* 3 Kotak Pilar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 mt-4 border-t border-[#D9D4CB]">
              <div className="bg-white p-4 rounded-xl border border-[#D9D4CB] space-y-1.5">
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs uppercase">
                  <Car className="w-4 h-4" />
                  <span>1. Biaya Unit Mobil (HPP)</span>
                </div>
                <p className="text-[11px] text-[#6B6560] leading-relaxed">
                  Cat, salon, ganti oli, sparepart, aki, pajak unit. <em>Menempel ke mobil & modal kembali saat unit laku.</em>
                </p>
                <div className="text-xs font-bold text-[#1C1917] pt-1">
                  Dicatat via Menu Inventori Mobil
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#D9D4CB] space-y-1.5">
                <div className="flex items-center gap-1.5 text-blue-700 font-bold text-xs uppercase">
                  <Building className="w-4 h-4" />
                  <span>2. Beban Operasional Showroom</span>
                </div>
                <p className="text-[11px] text-[#6B6560] leading-relaxed">
                  Sewa garasi, listrik, WiFi, iklan FB/OLX, gaji admin, kopi tamu. <em>Mengurangi laba operasional bulanan showroom.</em>
                </p>
                <div className="text-xs font-bold text-blue-700 pt-1">
                  Total: {formatRupiah(operationalData.totalOperational)}
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-purple-200 bg-purple-50/30 space-y-1.5">
                <div className="flex items-center gap-1.5 text-purple-700 font-bold text-xs uppercase">
                  <ShoppingBag className="w-4 h-4" />
                  <span>3. Prive Pribadi Owner (BCA)</span>
                </div>
                <p className="text-[11px] text-[#6B6560] leading-relaxed">
                  Belanja dapur, sekolah anak, cicilan pribadi, transfer keluarga. <em>Memotong kas BCA tanpa merusak laba mobil!</em>
                </p>
                <div className="text-xs font-bold text-purple-700 pt-1">
                  Total: {formatRupiah(operationalData.totalOwnerDraw)}
                </div>
              </div>
            </div>
          </div>

          {/* AKSI CEPAT PENCATATAN & TABEL MUTASI */}
          <div className="bg-white rounded-2xl border border-[#D9D4CB] overflow-hidden shadow-sm space-y-4 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EBE7E1] pb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#6B6560]">Filter Riwayat:</span>
                <div className="flex gap-1.5 overflow-x-auto text-xs font-semibold">
                  <button
                    onClick={() => setExpenseFilter("ALL")}
                    className={cn(
                      "px-3 py-1.5 rounded-lg transition-colors cursor-pointer",
                      expenseFilter === "ALL"
                        ? "bg-[#1C1917] text-white"
                        : "bg-[#F7F5F2] text-[#6B6560] hover:bg-[#EFECE8]"
                    )}
                  >
                    Semua ({combinedExpensesPriveList.length})
                  </button>
                  <button
                    onClick={() => setExpenseFilter("OPERATIONAL")}
                    className={cn(
                      "px-3 py-1.5 rounded-lg transition-colors cursor-pointer",
                      expenseFilter === "OPERATIONAL"
                        ? "bg-blue-600 text-white"
                        : "bg-[#F7F5F2] text-[#6B6560] hover:bg-[#EFECE8]"
                    )}
                  >
                    Operasional ({operationalData.operationalExpenses.length})
                  </button>
                  <button
                    onClick={() => setExpenseFilter("OWNER_DRAW")}
                    className={cn(
                      "px-3 py-1.5 rounded-lg transition-colors cursor-pointer",
                      expenseFilter === "OWNER_DRAW"
                        ? "bg-purple-600 text-white"
                        : "bg-[#F7F5F2] text-[#6B6560] hover:bg-[#EFECE8]"
                    )}
                  >
                    Prive Pribadi ({operationalData.ownerDraws.length})
                  </button>
                  <button
                    onClick={() => setExpenseFilter("OWNER_EQUITY")}
                    className={cn(
                      "px-3 py-1.5 rounded-lg transition-colors cursor-pointer",
                      expenseFilter === "OWNER_EQUITY"
                        ? "bg-emerald-600 text-white"
                        : "bg-[#F7F5F2] text-[#6B6560] hover:bg-[#EFECE8]"
                    )}
                  >
                    Setoran Modal ({operationalData.ownerEquities.length})
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowOwnerDrawModal(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  + Tarik Prive (Pribadi)
                </button>
                <button
                  onClick={() => setShowOpExModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  + Beban Operasional
                </button>
                <button
                  onClick={() => setShowOwnerEquityModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  + Setor Modal
                </button>
              </div>
            </div>

            {filteredExpensesList.length === 0 ? (
              <div className="p-8 text-center text-[#6B6560]">
                Belum ada transaksi operasional atau prive yang dicatat.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#F7F5F2] text-xs uppercase text-[#6B6560] font-semibold">
                    <tr>
                      <th className="py-3 px-4">Tanggal</th>
                      <th className="py-3 px-4">Kategori & Dampak Akuntansi</th>
                      <th className="py-3 px-4">Penerima / Tujuan</th>
                      <th className="py-3 px-4">Keterangan / Notes</th>
                      <th className="py-3 px-4 text-right">Nominal (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D9D4CB]">
                    {filteredExpensesList.map((item) => (
                      <tr key={item.id} className="hover:bg-[#FAF9F6]">
                        <td className="py-3.5 px-4 text-xs text-[#6B6560] whitespace-nowrap">
                          {formatDate(item.date)}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded border", item.badgeColor)}>
                              {item.categoryBadge}
                            </span>
                            <span className="font-bold text-xs text-[#1C1917]">{item.title}</span>
                          </div>
                          <span className="text-[10px] text-[#6B6560] block mt-0.5">{item.impactText}</span>
                        </td>
                        <td className="py-3.5 px-4 text-xs font-medium text-[#1C1917]">
                          {item.recipient}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-[#6B6560]">
                          {item.notes}
                        </td>
                        <td className="py-3.5 px-4 text-right font-black">
                          <span className={item.isOutgoing ? "text-red-600" : "text-emerald-600"}>
                            {item.isOutgoing ? "- " : "+ "}
                            {formatRupiah(item.amount)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: STOK MOBIL (INVENTORY) VS ASET TETAP SHOWROOM (FIXED ASSETS)
          ========================================================================= */}
      {activeTab === "assets_inventory" && (
        <div className="space-y-6">
          {/* KOMPARASI PERBEDAAN: STOK VS ASET */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Box 1: Stok Mobil Dagang (Inventory) */}
            <div className="bg-white p-6 rounded-2xl border-2 border-emerald-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  <Car className="w-4 h-4 text-emerald-600" />
                  <span>1. Stok Mobil Dagangan (Aset Lancar)</span>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  {summary.activeVehiclesCount || 0} Unit Ready/Intake
                </span>
              </div>

              <div className="text-2xl font-black text-[#1C1917]">
                {formatRupiah(summary.totalInventoryValue || 0)}
              </div>

              <p className="text-xs text-[#6B6560] leading-relaxed">
                Nilai modal berjalan yang tertanam di seluruh unit mobil aktif (Harga Beli + Total Biaya Servis/Cat/Salon).
                <strong> Likuid, tidak disusutkan, dan modal akan kembali saat mobil terjual.</strong>
              </p>

              <div className="pt-2 border-t border-[#EBE7E1] text-[11px] text-[#6B6560] flex items-center justify-between">
                <span>Perputaran normal showroom:</span>
                <span className="font-bold text-[#1C1917]">&lt; 30 Hari per Unit</span>
              </div>
            </div>

            {/* Box 2: Aset Tetap Showroom (Fixed Assets) */}
            <div className="bg-white p-6 rounded-2xl border-2 border-blue-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  <Wrench className="w-4 h-4 text-blue-600" />
                  <span>2. Aset Tetap Showroom (Fixed Assets)</span>
                </div>
                <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                  {assets.totalItems} Alat & Fasilitas
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#1C1917]">
                  {formatRupiah(assets.totalCurrentValue)}
                </span>
                <span className="text-xs text-[#6B6560]">
                  (Beli Awal: {formatRupiah(assets.totalPurchaseCost)})
                </span>
              </div>

              <p className="text-xs text-[#6B6560] leading-relaxed">
                Peralatan kerja & fasilitas yang dibeli <strong>bukan untuk dijual</strong>, melainkan dipakai operasional jangka panjang (&gt; 1 tahun).
                Menambah nilai kekayaan showroom secara riil.
              </p>

              <div className="pt-2 border-t border-[#EBE7E1] text-[11px] text-[#6B6560] flex items-center justify-between">
                <span>Nilai buku saat ini:</span>
                <span className="font-bold text-blue-700">{formatRupiah(assets.totalCurrentValue)}</span>
              </div>
            </div>
          </div>

          {/* TABEL DAFTAR ASET TETAP SHOWROOM */}
          <div className="bg-white rounded-2xl border border-[#D9D4CB] overflow-hidden shadow-sm">
            <div className="p-5 border-b border-[#D9D4CB] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FBF9F6]">
              <div>
                <h3 className="font-bold text-[#1C1917] text-base">
                  Daftar Inventaris Aset Peralatan & Fasilitas Showroom
                </h3>
                <p className="text-xs text-[#6B6560] mt-0.5">
                  Daftar peralatan inspeksi mikron, mesin poles, dongkrak, neon box, laptop kasir, dan kendaraan operasional.
                </p>
              </div>

              <button
                onClick={() => setShowAssetModal(true)}
                className="flex items-center gap-1.5 bg-[#D97706] hover:bg-[#B45309] text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tambah Aset Peralatan</span>
              </button>
            </div>

            {assets.items.length === 0 ? (
              <div className="p-8 text-center text-[#6B6560]">
                Belum ada aset peralatan yang dicatat. Klik &quot;+ Tambah Aset Peralatan&quot; untuk mendaftarkan alat kerja Anda.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#F7F5F2] text-xs uppercase text-[#6B6560] font-semibold">
                    <tr>
                      <th className="py-3 px-4">Nama Aset / Peralatan</th>
                      <th className="py-3 px-4">Kategori</th>
                      <th className="py-3 px-4">Kondisi Fisik</th>
                      <th className="py-3 px-4">Lokasi</th>
                      <th className="py-3 px-4 text-right">Harga Beli</th>
                      <th className="py-3 px-4 text-right">Nilai Sekarang</th>
                      <th className="py-3 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D9D4CB]">
                    {assets.items.map((asset) => {
                      const cond = ASSET_CONDITION_LABELS[asset.condition] || ASSET_CONDITION_LABELS.GOOD;
                      return (
                        <tr key={asset.id} className="hover:bg-[#FAF9F6]">
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-[#1C1917] block">{asset.name}</span>
                            {asset.notes && (
                              <span className="text-[11px] text-[#6B6560] block line-clamp-1">{asset.notes}</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-[#1C1917] font-medium">
                            {ASSET_CATEGORY_LABELS[asset.category] || asset.category}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={cn("text-[10px] font-bold px-2.5 py-0.5 rounded-full border", cond.badge)}>
                              {cond.label}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-[#6B6560]">
                            {asset.location || "-"}
                          </td>
                          <td className="py-3.5 px-4 text-right text-xs text-[#6B6560]">
                            {formatRupiah(asset.purchaseCost)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-blue-700">
                            {formatRupiah(asset.currentValue)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => handleDeleteAsset(asset.id, asset.name)}
                              className="text-stone-400 hover:text-red-600 transition-colors p-1 rounded cursor-pointer"
                              title="Hapus Aset"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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
      )}

      {/* =========================================================================
          MODAL: TAMBAH ASET TETAP SHOWROOM
          ========================================================================= */}
      {showAssetModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-[#D9D4CB]">
            <div className="flex items-center justify-between border-b border-[#EBE7E1] pb-3">
              <h3 className="text-base font-bold text-[#1C1917]">Tambah Aset Peralatan Showroom Baru</h3>
              <button onClick={() => setShowAssetModal(false)} className="text-stone-400 hover:text-stone-700 cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleAssetSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-[#1C1917] block mb-1">
                  Nama Aset / Peralatan Kerja
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Thickness Gauge Digital, Mesin Poles Shinemate"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  className="w-full border border-[#D9D4CB] rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#1C1917] block mb-1">
                    Kategori Aset
                  </label>
                  <select
                    value={assetCategory}
                    onChange={(e) => setAssetCategory(e.target.value as any)}
                    className="w-full border border-[#D9D4CB] rounded-xl px-3 py-2 text-xs bg-white"
                  >
                    <option value="INSPECTION_TOOLS">Alat Inspeksi & Uji Mikron</option>
                    <option value="WORKSHOP_EQUIPMENT">Peralatan Salon & Bengkel</option>
                    <option value="OFFICE_ELECTRONICS">Elektronik & Kasir Kantor</option>
                    <option value="FACILITY_FURNITURE">Fasilitas / Plang Neon Box</option>
                    <option value="OPERATIONAL_VEHICLE">Kendaraan Operasional (Non-Jual)</option>
                    <option value="OTHER">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#1C1917] block mb-1">
                    Kondisi Fisik Saat Ini
                  </label>
                  <select
                    value={assetCondition}
                    onChange={(e) => setAssetCondition(e.target.value as any)}
                    className="w-full border border-[#D9D4CB] rounded-xl px-3 py-2 text-xs bg-white"
                  >
                    <option value="EXCELLENT">Sangat Baik / Baru</option>
                    <option value="GOOD">Bagus / Normal</option>
                    <option value="FAIR">Perlu Servis Ringan</option>
                    <option value="DAMAGED">Rusak / Butuh Ganti</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#1C1917] block mb-1">
                    Harga Pembelian Awal (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="Contoh: 3500000"
                    value={assetPurchaseCost}
                    onChange={(e) => setAssetPurchaseCost(e.target.value)}
                    className="w-full border border-[#D9D4CB] rounded-xl px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#1C1917] block mb-1">
                    Estimasi Nilai Sekarang (Rp)
                  </label>
                  <input
                    type="number"
                    placeholder="Kosongkan jika sama"
                    value={assetCurrentValue}
                    onChange={(e) => setAssetCurrentValue(e.target.value)}
                    className="w-full border border-[#D9D4CB] rounded-xl px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#1C1917] block mb-1">
                    Tanggal Beli
                  </label>
                  <input
                    type="date"
                    required
                    value={assetPurchaseDate}
                    onChange={(e) => setAssetPurchaseDate(e.target.value)}
                    className="w-full border border-[#D9D4CB] rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#1C1917] block mb-1">
                    Lokasi Penyimpanan
                  </label>
                  <input
                    type="text"
                    placeholder="Misal: Koper Inspeksi, Garasi Depan"
                    value={assetLocation}
                    onChange={(e) => setAssetLocation(e.target.value)}
                    className="w-full border border-[#D9D4CB] rounded-xl px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#1C1917] block mb-1">
                  Catatan / Spesifikasi
                </label>
                <textarea
                  rows={2}
                  placeholder="Keterangan kelengkapan alat, garansi, dsb..."
                  value={assetNotes}
                  onChange={(e) => setAssetNotes(e.target.value)}
                  className="w-full border border-[#D9D4CB] rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="deductCash"
                  checked={assetDeductCash}
                  onChange={(e) => setAssetDeductCash(e.target.checked)}
                  className="rounded text-[#D97706] focus:ring-[#D97706]"
                />
                <label htmlFor="deductCash" className="text-xs text-[#92400E] font-medium cursor-pointer">
                  Otomatis potong saldo Kas Rekening BCA saat ini? (Jika baru beli tunai)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#EBE7E1]">
                <button
                  type="button"
                  onClick={() => setShowAssetModal(false)}
                  className="px-4 py-2 border border-[#D9D4CB] rounded-xl text-xs font-semibold hover:bg-[#F7F5F2] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#D97706] hover:bg-[#B45309] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm cursor-pointer"
                >
                  Simpan Aset ke Inventaris
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CATAT BEBAN OPERASIONAL SHOWROOM (OPEX)
          ========================================================================= */}
      {showOpExModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-[#D9D4CB]">
            <div className="flex items-center justify-between border-b border-[#EBE7E1] pb-3">
              <h3 className="text-base font-bold text-[#1C1917]">Catat Beban Operasional Showroom</h3>
              <button onClick={() => setShowOpExModal(false)} className="text-stone-400 hover:text-stone-700 cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleOpExSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-[#1C1917] block mb-1">
                  Kategori Beban Operasional
                </label>
                <select
                  value={opExCategory}
                  onChange={(e) => setOpExCategory(e.target.value as any)}
                  className="w-full border border-[#D9D4CB] rounded-xl px-3 py-2 text-sm bg-white"
                >
                  <option value="RENT_SHOWROOM">Sewa Lahan & Garasi Showroom</option>
                  <option value="UTILITIES_WIFI">Listrik, Air & WiFi Garasi</option>
                  <option value="MARKETING_ADS">Iklan FB/IG Ads & OLX Autos</option>
                  <option value="SALARY_WAGES">Gaji & Upah Karyawan / Admin</option>
                  <option value="OFFICE_SUPPLIES">Kertas, ATK, Kuitansi & Materai</option>
                  <option value="CONSUMPTION_GUEST">Kopi, Teh & Air Mineral Tamu</option>
                  <option value="MAINTENANCE">Perawatan Fasilitas Garasi</option>
                  <option value="OTHER">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#1C1917] block mb-1">
                  Penerima / Vendor / Toko
                </label>
                <input
                  type="text"
                  placeholder="Misal: H. Ridwan, PLN, Toko Barokah"
                  value={opExRecipient}
                  onChange={(e) => setOpExRecipient(e.target.value)}
                  className="w-full border border-[#D9D4CB] rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#1C1917] block mb-1">
                    Nominal Beban (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="Contoh: 500000"
                    value={opExAmount}
                    onChange={(e) => setOpExAmount(e.target.value)}
                    className="w-full border border-[#D9D4CB] rounded-xl px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#1C1917] block mb-1">
                    Tanggal Pengeluaran
                  </label>
                  <input
                    type="date"
                    required
                    value={opExDate}
                    onChange={(e) => setOpExDate(e.target.value)}
                    className="w-full border border-[#D9D4CB] rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#1C1917] block mb-1">
                  Catatan Keterangan
                </label>
                <textarea
                  rows={2}
                  placeholder="Rincian pembayaran operasional..."
                  value={opExNotes}
                  onChange={(e) => setOpExNotes(e.target.value)}
                  className="w-full border border-[#D9D4CB] rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#EBE7E1]">
                <button
                  type="button"
                  onClick={() => setShowOpExModal(false)}
                  className="px-4 py-2 border border-[#D9D4CB] rounded-xl text-xs font-semibold hover:bg-[#F7F5F2] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm cursor-pointer"
                >
                  Catat Beban Operasional
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CATAT PRIVE PRIBADI OWNER (REKENING BCA)
          ========================================================================= */}
      {showOwnerDrawModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-purple-200">
            <div className="flex items-center justify-between border-b border-[#EBE7E1] pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-bold text-[#1C1917]">Catat Penarikan Pribadi (Prive Owner)</h3>
              </div>
              <button onClick={() => setShowOwnerDrawModal(false)} className="text-stone-400 hover:text-stone-700 cursor-pointer">
                ✕
              </button>
            </div>

            <p className="text-xs text-[#6B6560] leading-relaxed">
              Catat setiap uang yang Anda ambil dari rekening BCA untuk keperluan rumah tangga/keluarga.
              <strong> Saldo kas BCA berkurang, namun laba showroom & HPP mobil tetap terjaga 100% akurat.</strong>
            </p>

            <form onSubmit={handleOwnerDrawSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-[#1C1917] block mb-1">
                  Nominal Penarikan (Rp)
                </label>
                <input
                  type="number"
                  required
                  placeholder="Contoh: 3000000"
                  value={drawAmount}
                  onChange={(e) => setDrawAmount(e.target.value)}
                  className="w-full border border-[#D9D4CB] rounded-xl px-3 py-2 text-sm font-bold text-purple-900"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#1C1917] block mb-1">
                  Tanggal Penarikan dari BCA
                </label>
                <input
                  type="date"
                  required
                  value={drawDate}
                  onChange={(e) => setDrawDate(e.target.value)}
                  className="w-full border border-[#D9D4CB] rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#1C1917] block mb-1">
                  Keperluan Pribadi / Keterangan Wajib
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Misal: Belanja dapur bulanan keluarga, SPP sekolah, transfer cicilan rumah..."
                  value={drawNotes}
                  onChange={(e) => setDrawNotes(e.target.value)}
                  className="w-full border border-[#D9D4CB] rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#EBE7E1]">
                <button
                  type="button"
                  onClick={() => setShowOwnerDrawModal(false)}
                  className="px-4 py-2 border border-[#D9D4CB] rounded-xl text-xs font-semibold hover:bg-[#F7F5F2] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm cursor-pointer"
                >
                  Simpan Penarikan Prive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: SETOR MODAL PRIBADI TAMBAHAN
          ========================================================================= */}
      {showOwnerEquityModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-emerald-200">
            <div className="flex items-center justify-between border-b border-[#EBE7E1] pb-3">
              <h3 className="text-base font-bold text-[#1C1917]">Setor Modal Tambahan Pribadi ke Kas Showroom</h3>
              <button onClick={() => setShowOwnerEquityModal(false)} className="text-stone-400 hover:text-stone-700 cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleOwnerEquitySubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-[#1C1917] block mb-1">
                  Nominal Setoran Modal (Rp)
                </label>
                <input
                  type="number"
                  required
                  placeholder="Contoh: 10000000"
                  value={equityAmount}
                  onChange={(e) => setEquityAmount(e.target.value)}
                  className="w-full border border-[#D9D4CB] rounded-xl px-3 py-2 text-sm font-bold text-emerald-800"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#1C1917] block mb-1">
                  Tanggal Setoran
                </label>
                <input
                  type="date"
                  required
                  value={equityDate}
                  onChange={(e) => setEquityDate(e.target.value)}
                  className="w-full border border-[#D9D4CB] rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#1C1917] block mb-1">
                  Keterangan Asal Modal
                </label>
                <textarea
                  rows={2}
                  placeholder="Misal: Tambahan modal kulakan dari tabungan pribadi..."
                  value={equityNotes}
                  onChange={(e) => setEquityNotes(e.target.value)}
                  className="w-full border border-[#D9D4CB] rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#EBE7E1]">
                <button
                  type="button"
                  onClick={() => setShowOwnerEquityModal(false)}
                  className="px-4 py-2 border border-[#D9D4CB] rounded-xl text-xs font-semibold hover:bg-[#F7F5F2] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm cursor-pointer"
                >
                  Setor Modal ke Rekening BCA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: TRANSAKSI KAS MANUAL
          ========================================================================= */}
      {showManualCashModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-[#D9D4CB]">
            <h3 className="text-lg font-bold text-[#1C1917]">Pencatatan Transaksi Kas Manual</h3>

            <form onSubmit={handleManualCashSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#1C1917] block mb-1">
                  Jenis Transaksi
                </label>
                <select
                  value={cashType}
                  onChange={(e) => setCashType(e.target.value)}
                  className="w-full border border-[#D9D4CB] rounded-xl px-3 py-2 text-sm bg-white"
                >
                  <option value="IN_CAPITAL_DEPOSIT">Kas Masuk: Suntikan Modal Owner / Investor</option>
                  <option value="OUT_CAPITAL_RETURN">Kas Keluar: Pengembalian / Penarikan Modal</option>
                  <option value="CORRECTION">Koreksi Saldo (Penyesuaian)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#1C1917] block mb-1">
                  Nominal (Rp)
                </label>
                <input
                  type="number"
                  required
                  placeholder="Contoh: 10000000"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  className="w-full border border-[#D9D4CB] rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#1C1917] block mb-1">
                  Keterangan / Notes
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Alasan transaksi kas..."
                  value={cashNotes}
                  onChange={(e) => setCashNotes(e.target.value)}
                  className="w-full border border-[#D9D4CB] rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManualCashModal(false)}
                  className="px-4 py-2 border border-[#D9D4CB] rounded-xl text-sm font-medium hover:bg-[#F7F5F2] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#D97706] hover:bg-[#B45309] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm cursor-pointer"
                >
                  Simpan Transaksi Kas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

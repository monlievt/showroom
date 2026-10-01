"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Coins,
  Users,
  Plus,
  HeartHandshake,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sliders,
  Building,
  FileText,
  Clock,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import { formatRupiah, formatDate, cn } from "@/lib/utils";
import { depositInvestorCapital } from "@/app/actions/capital-ledger";
import { createInvestor } from "@/app/actions/investor";
import { executeProfitDistribution, reverseDistribution } from "@/app/actions/finance";
import { saveProfitShareRules } from "@/app/actions/profit-share-rule";

interface InvestorAdminProps {
  summary: {
    activeAllocatedCapital: number;
    totalProfitPaid: number;
    totalOwnerProfit: number;
    totalInvestorProfit: number;
    pendingDistributionsCount: number;
  };
  investors: Array<{
    id: string;
    name: string;
    phone?: string | null;
    type: "OWNER_EQUITY" | "MOTHER_SIBLING" | "THIRD_PARTY";
    currentBalance: number;
    investmentsCount: number;
    totalProfitDistributed: number;
    investments: Array<{
      id: string;
      vehicleId: string;
      vehiclePlate: string;
      vehicleName: string;
      vehicleStatus: string;
      capitalShare: number;
      profitSharePercent: number;
    }>;
  }>;
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
  distributions: Array<{
    id: string;
    saleId: string;
    vehiclePlate: string;
    vehicleName: string;
    buyerName: string;
    beneficiaryType: string;
    beneficiaryName: string;
    grossProfitAtCalc: number;
    calculatedAmount: number;
    isPaid: boolean;
    calculatedAt: string | Date;
    notes?: string | null;
  }>;
  profitRules: Array<{
    id?: string;
    name: string;
    beneficiaryGroup: string;
    minProfit: number;
    maxProfit: number | null;
    amountPerPerson: number;
    numberOfPeople: number;
    active: boolean;
  }>;
}

export function InvestorAdminClient({
  summary,
  investors,
  pendingSales,
  distributions,
  profitRules,
}: InvestorAdminProps) {
  const [activeTab, setActiveTab] = useState<"pending" | "accounts" | "history" | "rules">("pending");

  // Modals state
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showInvestorModal, setShowInvestorModal] = useState(false);
  const [showReverseModal, setShowReverseModal] = useState<string | null>(null);

  // Form state
  const [selectedInvestorId, setSelectedInvestorId] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositNotes, setDepositNotes] = useState("");

  const [newInvestorName, setNewInvestorName] = useState("");
  const [newInvestorPhone, setNewInvestorPhone] = useState("");
  const [newInvestorType, setNewInvestorType] = useState<"THIRD_PARTY" | "MOTHER_SIBLING" | "OWNER_EQUITY">("THIRD_PARTY");

  // Rule editor state
  const [editableRules, setEditableRules] = useState(profitRules);
  const [ruleError, setRuleError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showNotification = (message: string, type: "success" | "error") => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 5000);
  };

  // Handler: Setor Modal Investor
  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvestorId || !depositAmount) return;

    setLoading(true);
    const res = await depositInvestorCapital({
      investorId: selectedInvestorId,
      type: "DEPOSIT",
      amount: Number(depositAmount),
      notes: depositNotes,
    });
    setLoading(false);

    if (res.success) {
      showNotification("Setoran modal investor berhasil dicatat di kas umum & ledger!", "success");
      setShowDepositModal(false);
      setDepositAmount("");
      setDepositNotes("");
    } else {
      showNotification(res.error || "Gagal mencatat setoran modal", "error");
    }
  };

  // Handler: Tambah Investor Baru
  const handleCreateInvestor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvestorName) return;

    setLoading(true);
    const res = await createInvestor({
      name: newInvestorName,
      phone: newInvestorPhone,
      type: newInvestorType,
    });
    setLoading(false);

    if (res.success) {
      showNotification("Investor baru berhasil ditambahkan!", "success");
      setShowInvestorModal(false);
      setNewInvestorName("");
      setNewInvestorPhone("");
    } else {
      showNotification(res.error || "Gagal menambah investor", "error");
    }
  };

  // Handler: Eksekusi Distribusi Laba
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

  // Handler: Reversal Distribusi
  const handleReverseDistribution = async (saleId: string) => {
    setLoading(true);
    const res = await reverseDistribution(saleId, "Reversal manual oleh Admin");
    setLoading(false);

    if (res.success) {
      showNotification("Reversal distribusi berhasil dijalankan (AuditLog tercatat)!", "success");
      setShowReverseModal(null);
    } else {
      showNotification(res.error || "Gagal melakukan reversal", "error");
    }
  };

  // Handler: Simpan Perubahan Rule
  const handleSaveRules = async () => {
    setLoading(true);
    setRuleError(null);
    const res = await saveProfitShareRules(editableRules);
    setLoading(false);

    if (res.success) {
      showNotification("Aturan tier pembagian bagi hasil berhasil diperbarui!", "success");
    } else {
      setRuleError(res.error || "Validasi aturan tier gagal");
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

      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1C1917] tracking-tight">
            Investor & Distribusi Bagi Hasil
          </h1>
          <p className="text-sm text-[#6B6560] mt-1">
            Manajemen modal investor, alokasi unit, eksekusi bagi hasil deterministik, dan aturan tier 4 saudara.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/investors/new"
            className="flex items-center gap-1.5 bg-white hover:bg-[#F7F5F2] border border-[#D9D4CB] text-[#1C1917] px-3.5 py-2 rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            <Users className="w-3.5 h-3.5 text-[#D97706]" />
            <span>+ Investor Baru</span>
          </Link>

          <Link
            href="/admin/investors/deposit/new"
            className="flex items-center gap-1.5 bg-[#D97706] hover:bg-[#B45309] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Setor Modal Investor</span>
          </Link>
        </div>
      </div>

      {/* 4 KARTU KPI INVESTOR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#D9D4CB] shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[#6B6560]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Modal Investor Terikat</span>
            <Coins className="w-4 h-4 text-[#D97706]" />
          </div>
          <div className="text-2xl font-black text-[#1C1917] tracking-tight">
            {formatRupiah(summary.activeAllocatedCapital)}
          </div>
          <p className="text-xs text-[#6B6560]">Dana berputar di unit mobil aktif</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#D9D4CB] shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[#6B6560]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Unit Siap Dibagi Laba</span>
            <HeartHandshake className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-[#1C1917] tracking-tight">
            {summary.pendingDistributionsCount} <span className="text-sm font-medium text-[#6B6560]">Unit</span>
          </div>
          <p className="text-xs text-amber-700 font-medium">Lunas 100% & menunggu eksekusi</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#D9D4CB] shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[#6B6560]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Laba Investor</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 tracking-tight">
            {formatRupiah(summary.totalInvestorProfit)}
          </div>
          <p className="text-xs text-[#6B6560]">Pencairan laba ke mitra & keluarga</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#D9D4CB] shadow-sm space-y-1">
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

      {/* TABS NAVIGATION */}
      <div className="flex border-b border-[#D9D4CB] gap-4 sm:gap-6 text-xs sm:text-sm font-semibold overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab("pending")}
          className={cn(
            "pb-3 -mb-px transition-colors cursor-pointer shrink-0 flex items-center gap-1.5",
            activeTab === "pending"
              ? "border-b-2 border-[#D97706] text-[#D97706] font-bold"
              : "text-[#6B6560] hover:text-[#1C1917]"
          )}
        >
          <span>Unit Siap Bagi Hasil</span>
          {pendingSales.length > 0 && (
            <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
              {pendingSales.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("accounts")}
          className={cn(
            "pb-3 -mb-px transition-colors cursor-pointer shrink-0",
            activeTab === "accounts"
              ? "border-b-2 border-[#D97706] text-[#D97706] font-bold"
              : "text-[#6B6560] hover:text-[#1C1917]"
          )}
        >
          Daftar Akun Investor ({investors.length})
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={cn(
            "pb-3 -mb-px transition-colors cursor-pointer shrink-0",
            activeTab === "history"
              ? "border-b-2 border-[#D97706] text-[#D97706] font-bold"
              : "text-[#6B6560] hover:text-[#1C1917]"
          )}
        >
          Riwayat Distribusi Laba ({distributions.length})
        </button>

        <button
          onClick={() => setActiveTab("rules")}
          className={cn(
            "pb-3 -mb-px transition-colors cursor-pointer shrink-0",
            activeTab === "rules"
              ? "border-b-2 border-[#D97706] text-[#D97706] font-bold"
              : "text-[#6B6560] hover:text-[#1C1917]"
          )}
        >
          Aturan Tier 4 Saudara
        </button>
      </div>

      {/* =========================================================================
          TAB 1: UNIT SIAP BAGI HASIL
          ========================================================================= */}
      {activeTab === "pending" && (
        <div className="bg-white rounded-2xl border border-[#D9D4CB] overflow-hidden shadow-sm">
          <div className="p-5 border-b border-[#D9D4CB] flex items-center justify-between bg-[#FBF9F6]">
            <div>
              <h3 className="font-bold text-[#1C1917]">Unit Terjual Lunas — Menunggu Distribusi Laba</h3>
              <p className="text-xs text-[#6B6560] mt-0.5">
                Distribusi hanya dieksekusi saat pembayaran lunas 100% (SUM(payments) ≥ Harga Jual).
              </p>
            </div>
            <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full font-bold">
              {pendingSales.length} Unit Siap
            </span>
          </div>

          {pendingSales.length === 0 ? (
            <div className="p-8 text-center text-[#6B6560]">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-medium">Semua unit yang lunas sudah didistribusikan labanya.</p>
              <p className="text-xs mt-1">Tidak ada antrean pembagian laba yang tertunda.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F7F5F2] text-xs uppercase text-[#6B6560] font-semibold">
                  <tr>
                    <th className="py-3 px-4">Unit Mobil</th>
                    <th className="py-3 px-4">Pembeli</th>
                    <th className="py-3 px-4 text-right">Harga Jual</th>
                    <th className="py-3 px-4 text-right">HPP (Landed Cost)</th>
                    <th className="py-3 px-4 text-right">Laba Kotor</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9D4CB]">
                  {pendingSales.map((s) => (
                    <tr key={s.id} className="hover:bg-[#FAF9F6]">
                      <td className="py-4 px-4">
                        <span className="font-bold text-[#1C1917] block">{s.vehiclePlate}</span>
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
                            s.grossProfit >= 0 ? "text-emerald-600" : "text-red-600"
                          )}
                        >
                          {formatRupiah(s.grossProfit)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          disabled={loading}
                          onClick={() => handleExecuteDistribution(s.id)}
                          className="bg-[#D97706] hover:bg-[#B45309] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                        >
                          Eksekusi Bagi Hasil
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: DAFTAR AKUN INVESTOR
          ========================================================================= */}
      {activeTab === "accounts" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {investors.map((inv) => (
              <div key={inv.id} className="bg-white rounded-2xl border border-[#D9D4CB] p-5 shadow-sm space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-base text-[#1C1917]">{inv.name}</h4>
                    <span className="text-xs text-[#6B6560]">{inv.phone || "Tanpa No HP"}</span>
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider",
                      inv.type === "MOTHER_SIBLING"
                        ? "bg-purple-100 text-purple-800"
                        : inv.type === "OWNER_EQUITY"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-blue-100 text-blue-800"
                    )}
                  >
                    {inv.type === "MOTHER_SIBLING" ? "Ibu / 4 Saudara" : inv.type === "OWNER_EQUITY" ? "Owner Equity" : "Pihak Ketiga"}
                  </span>
                </div>

                <div className="space-y-2 pt-2 border-t border-[#EBE7E1] text-xs">
                  <div className="flex justify-between text-[#6B6560]">
                    <span>Saldo Modal Bebas di Kas:</span>
                    <span className="font-bold text-[#1C1917]">{formatRupiah(inv.currentBalance)}</span>
                  </div>
                  <div className="flex justify-between text-[#6B6560]">
                    <span>Unit Sedang Didanai:</span>
                    <span className="font-semibold text-[#1C1917]">{inv.investmentsCount} Mobil</span>
                  </div>
                  <div className="flex justify-between text-[#6B6560]">
                    <span>Total Laba Diterima:</span>
                    <span className="font-bold text-emerald-600">{formatRupiah(inv.totalProfitDistributed)}</span>
                  </div>
                </div>

                {inv.investments.length > 0 && (
                  <div className="pt-2 border-t border-[#F2EFE9] space-y-1.5">
                    <span className="text-[10px] font-bold uppercase text-[#6B6560] block">Unit Aktif:</span>
                    {inv.investments.slice(0, 3).map((vInv) => (
                      <div key={vInv.id} className="text-xs flex justify-between bg-[#F7F5F2] p-2 rounded-lg">
                        <span className="font-medium text-[#1C1917]">{vInv.vehiclePlate}</span>
                        <span className="font-bold text-[#D97706]">{formatRupiah(vInv.capitalShare)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: RIWAYAT DISTRIBUSI LABA
          ========================================================================= */}
      {activeTab === "history" && (
        <div className="bg-white rounded-2xl border border-[#D9D4CB] overflow-hidden shadow-sm">
          <div className="p-5 border-b border-[#D9D4CB] flex items-center justify-between bg-[#FBF9F6]">
            <div>
              <h3 className="font-bold text-[#1C1917]">Riwayat Pembagian Laba Penjualan Unit</h3>
              <p className="text-xs text-[#6B6560] mt-0.5">
                Snapshot permanen bagi hasil berdasarkan aturan tier 4 saudara dan investor pihak ketiga.
              </p>
            </div>
            <span className="text-xs text-[#6B6560] font-medium">
              Total {distributions.length} Pembagian
            </span>
          </div>

          {distributions.length === 0 ? (
            <div className="p-8 text-center text-[#6B6560]">
              Belum ada riwayat pembagian laba yang dicatat.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F7F5F2] text-xs uppercase text-[#6B6560] font-semibold">
                  <tr>
                    <th className="py-3 px-4">Tanggal Eksekusi</th>
                    <th className="py-3 px-4">Unit Mobil</th>
                    <th className="py-3 px-4">Penerima Manfaat</th>
                    <th className="py-3 px-4 text-right">Laba Kotor Unit</th>
                    <th className="py-3 px-4 text-right">Nominal Bagian</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9D4CB]">
                  {distributions.map((d) => (
                    <tr key={d.id} className="hover:bg-[#FAF9F6]">
                      <td className="py-3 px-4 text-xs text-[#6B6560] whitespace-nowrap">
                        {formatDate(d.calculatedAt)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-xs text-[#1C1917] block">{d.vehiclePlate}</span>
                        <span className="text-[11px] text-[#6B6560]">{d.vehicleName}</span>
                      </td>
                      <td className="py-3 px-4 text-xs font-medium text-[#1C1917]">
                        {d.beneficiaryName}
                        <span className="text-[10px] text-[#6B6560] block">({d.beneficiaryType})</span>
                      </td>
                      <td className="py-3 px-4 text-right text-xs text-[#6B6560]">
                        {formatRupiah(d.grossProfitAtCalc)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600">
                        {formatRupiah(d.calculatedAmount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                          LUNAS
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

      {/* =========================================================================
          TAB 4: ATURAN TIER BAGI HASIL
          ========================================================================= */}
      {activeTab === "rules" && (
        <div className="bg-white rounded-2xl border border-[#D9D4CB] p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EBE7E1] pb-4">
            <div>
              <h3 className="font-bold text-[#1C1917] text-base">
                Aturan Bertingkat Bagi Hasil Modal Ibu (4 Saudara)
              </h3>
              <p className="text-xs text-[#6B6560] mt-0.5">
                Validasi tier contiguous: tanpa gap atau overlap antar rentang laba.
              </p>
            </div>
            <button
              onClick={handleSaveRules}
              disabled={loading}
              className="bg-[#D97706] hover:bg-[#B45309] text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer"
            >
              Simpan Perubahan Aturan
            </button>
          </div>

          {ruleError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
              {ruleError}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F7F5F2] text-xs uppercase text-[#6B6560] font-semibold">
                <tr>
                  <th className="py-3 px-4">Nama Tier</th>
                  <th className="py-3 px-4">Rentang Laba Kotor (Min - Max)</th>
                  <th className="py-3 px-4 text-right">Nominal per Orang</th>
                  <th className="py-3 px-4 text-center">Jumlah Orang</th>
                  <th className="py-3 px-4 text-right">Total Alokasi Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9D4CB]">
                {editableRules.map((r, idx) => (
                  <tr key={idx} className="hover:bg-[#FAF9F6]">
                    <td className="py-3.5 px-4 font-bold text-xs text-[#1C1917]">{r.name}</td>
                    <td className="py-3.5 px-4 text-xs text-[#6B6560]">
                      {formatRupiah(r.minProfit)} s/d {r.maxProfit ? formatRupiah(r.maxProfit) : "Tak Terbatas"}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-xs text-emerald-600">
                      {formatRupiah(r.amountPerPerson)}
                    </td>
                    <td className="py-3.5 px-4 text-center text-xs font-medium text-[#1C1917]">
                      {r.numberOfPeople} orang
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-xs text-[#1C1917]">
                      {formatRupiah(r.amountPerPerson * r.numberOfPeople)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: SETOR MODAL INVESTOR
          ========================================================================= */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-[#D9D4CB]">
            <h3 className="text-lg font-bold text-[#1C1917]">Penyetoran Modal Investor</h3>

            <form onSubmit={handleDepositSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#1C1917] block mb-1">
                  Pilih Investor
                </label>
                <select
                  required
                  value={selectedInvestorId}
                  onChange={(e) => setSelectedInvestorId(e.target.value)}
                  className="w-full border border-[#D9D4CB] rounded-xl px-3 py-2 text-sm bg-white"
                >
                  <option value="">-- Pilih Akun Investor --</option>
                  {investors.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.name} ({inv.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#1C1917] block mb-1">
                  Nominal Setoran (Rp)
                </label>
                <input
                  type="number"
                  required
                  placeholder="Contoh: 50000000"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full border border-[#D9D4CB] rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#1C1917] block mb-1">
                  Catatan / Keterangan
                </label>
                <textarea
                  rows={2}
                  placeholder="Keterangan transfer modal..."
                  value={depositNotes}
                  onChange={(e) => setDepositNotes(e.target.value)}
                  className="w-full border border-[#D9D4CB] rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="px-4 py-2 border border-[#D9D4CB] rounded-xl text-sm font-medium hover:bg-[#F7F5F2] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#D97706] hover:bg-[#B45309] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm cursor-pointer"
                >
                  Simpan Setoran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: TAMBAH INVESTOR BARU
          ========================================================================= */}
      {showInvestorModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-[#D9D4CB]">
            <h3 className="text-lg font-bold text-[#1C1917]">Tambah Investor Baru</h3>

            <form onSubmit={handleCreateInvestor} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#1C1917] block mb-1">
                  Nama Lengkap Investor
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Bpk. H. Ahmad"
                  value={newInvestorName}
                  onChange={(e) => setNewInvestorName(e.target.value)}
                  className="w-full border border-[#D9D4CB] rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#1C1917] block mb-1">
                  Nomor HP / WhatsApp
                </label>
                <input
                  type="text"
                  placeholder="08123456789"
                  value={newInvestorPhone}
                  onChange={(e) => setNewInvestorPhone(e.target.value)}
                  className="w-full border border-[#D9D4CB] rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#1C1917] block mb-1">
                  Tipe Hubungan Investor
                </label>
                <select
                  value={newInvestorType}
                  onChange={(e) => setNewInvestorType(e.target.value as any)}
                  className="w-full border border-[#D9D4CB] rounded-xl px-3 py-2 text-sm bg-white"
                >
                  <option value="THIRD_PARTY">Investor Pihak Ketiga</option>
                  <option value="MOTHER_SIBLING">Modal Ibu (Alokasi 4 Saudara)</option>
                  <option value="OWNER_EQUITY">Owner Equity</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInvestorModal(false)}
                  className="px-4 py-2 border border-[#D9D4CB] rounded-xl text-sm font-medium hover:bg-[#F7F5F2] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#1C1917] hover:bg-[#2C2927] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm cursor-pointer"
                >
                  Tambah
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

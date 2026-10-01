"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  Coins,
  ArrowDownLeft,
  Search,
  CheckCircle2,
  Car,
  TrendingUp,
  ShieldCheck
} from "lucide-react";
import { formatRupiah, formatDate, cn } from "@/lib/utils";
import { depositInvestorCapital } from "@/app/actions/capital-ledger";
import { createInvestor } from "@/app/actions/investor";
import { InvestorSubNav } from "./InvestorSubNav";

interface InvestorAccountsProps {
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
  pendingCount: number;
  totalHistoryCount: number;
}

export function InvestorAccountsPageClient({
  investors,
  pendingCount,
  totalHistoryCount,
}: InvestorAccountsProps) {
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showInvestorModal, setShowInvestorModal] = useState(false);

  // Form State: Setor Modal
  const [selectedInvestorId, setSelectedInvestorId] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositNotes, setDepositNotes] = useState("");

  // Form State: Tambah Investor
  const [newInvestorName, setNewInvestorName] = useState("");
  const [newInvestorPhone, setNewInvestorPhone] = useState("");
  const [newInvestorType, setNewInvestorType] = useState<"OWNER_EQUITY" | "MOTHER_SIBLING" | "THIRD_PARTY">("THIRD_PARTY");

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showNotification = (message: string, type: "success" | "error") => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

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

  const filteredInvestors = investors.filter((inv) => {
    const matchType = typeFilter === "ALL" || inv.type === typeFilter;
    const matchSearch =
      inv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.phone || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchType && matchSearch;
  });

  const totalCapitalInPool = investors.reduce((sum, inv) => sum + Number(inv.currentBalance), 0);
  const totalProfitGiven = investors.reduce((sum, inv) => sum + Number(inv.totalProfitDistributed), 0);

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
        investorsCount={investors.length}
        historyCount={totalHistoryCount}
      />

      {/* 3 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#D9D4CB] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#6B6560]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Akun Investor</span>
            <Users className="w-5 h-5 text-[#D97706]" />
          </div>
          <div className="text-2xl font-black text-[#1C1917] tracking-tight">
            {investors.length} <span className="text-xs font-semibold text-[#6B6560]">Mitra</span>
          </div>
          <p className="text-xs text-[#6B6560]">Owner, modal Ibu/saudara & pihak ketiga</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#D9D4CB] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#6B6560]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Saldo Modal Bebas</span>
            <Coins className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-700 tracking-tight">
            {formatRupiah(totalCapitalInPool)}
          </div>
          <p className="text-xs text-[#6B6560]">Modal mengendap siap dialokasikan ke unit</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#D9D4CB] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#6B6560]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Laba yang Dibagikan</span>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 tracking-tight">
            {formatRupiah(totalProfitGiven)}
          </div>
          <p className="text-xs text-[#6B6560]">Akumulasi pencairan profit sharing</p>
        </div>
      </div>

      {/* Action Bar & Search */}
      <div className="bg-white p-4 rounded-2xl border border-[#D9D4CB] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#6B6560] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama investor atau nomor HP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[#D9D4CB] rounded-xl text-xs sm:text-sm bg-[#F7F5F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D97706]/20 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="p-2 border border-[#D9D4CB] rounded-xl text-xs bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[#D97706]/20"
          >
            <option value="ALL">Semua Kategori ({investors.length})</option>
            <option value="MOTHER_SIBLING">Ibu / 4 Saudara</option>
            <option value="THIRD_PARTY">Mitra Pihak Ketiga</option>
            <option value="OWNER_EQUITY">Owner Showroom</option>
          </select>

          <Link
            href="/admin/investors/new"
            className="flex items-center gap-1.5 bg-white hover:bg-[#F7F5F2] border border-[#D9D4CB] text-[#1C1917] px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <Users className="w-3.5 h-3.5 text-[#D97706]" />
            <span>+ Investor Baru</span>
          </Link>

          <Link
            href="/admin/investors/deposit/new"
            className="flex items-center gap-1.5 bg-[#D97706] hover:bg-[#B45309] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Setor Modal Investor</span>
          </Link>
        </div>
      </div>

      {/* Grid Kartu Akun Investor */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredInvestors.length === 0 ? (
          <div className="col-span-full py-12 text-center text-[#6B6560] bg-white rounded-2xl border border-[#D9D4CB]">
            Tidak ada akun investor yang cocok dengan pencarian atau filter.
          </div>
        ) : (
          filteredInvestors.map((inv) => (
            <div key={inv.id} className="bg-white rounded-2xl border border-[#D9D4CB] p-5 shadow-xs space-y-4 hover:border-[#D97706]/50 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-base text-[#1C1917]">{inv.name}</h4>
                  <span className="text-xs text-[#6B6560]">{inv.phone || "Tanpa No HP"}</span>
                </div>
                <span
                  className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border",
                    inv.type === "MOTHER_SIBLING"
                      ? "bg-purple-100 text-purple-800 border-purple-200"
                      : inv.type === "OWNER_EQUITY"
                      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                      : "bg-blue-100 text-blue-800 border-blue-200"
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
                  <span className="font-bold text-emerald-700">{formatRupiah(inv.totalProfitDistributed)}</span>
                </div>
              </div>

              {inv.investments.length > 0 && (
                <div className="pt-2 border-t border-[#F2EFE9] space-y-1.5">
                  <span className="text-[10px] font-bold uppercase text-[#6B6560] block">Alokasi Unit Aktif:</span>
                  {inv.investments.slice(0, 3).map((vInv) => (
                    <div key={vInv.id} className="text-xs flex justify-between bg-[#F7F5F2] p-2 rounded-xl">
                      <div className="flex items-center gap-1.5">
                        <Car className="w-3.5 h-3.5 text-[#D97706]" />
                        <span className="font-bold text-[#1C1917]">{vInv.vehiclePlate}</span>
                      </div>
                      <span className="font-bold text-[#D97706]">{formatRupiah(vInv.capitalShare)}</span>
                    </div>
                  ))}
                  {inv.investments.length > 3 && (
                    <span className="text-[10px] text-[#A8A29E] block text-center">
                      +{inv.investments.length - 3} unit lainnya
                    </span>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal: Setor Modal Investor */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black/50 z-50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#D9D4CB] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#D9D4CB] pb-3">
              <h3 className="text-base font-bold text-[#1C1917]">Setor Modal Investor</h3>
              <button
                onClick={() => setShowDepositModal(false)}
                className="text-[#6B6560] hover:text-[#1C1917] text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDepositSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#1C1917] uppercase tracking-wider block mb-1">
                  Pilih Akun Investor
                </label>
                <select
                  required
                  value={selectedInvestorId}
                  onChange={(e) => setSelectedInvestorId(e.target.value)}
                  className="w-full border border-[#D9D4CB] rounded-xl px-3 py-2.5 text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[#D97706]/20"
                >
                  <option value="">-- Pilih Akun Investor --</option>
                  {investors.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.name} ({inv.type === "MOTHER_SIBLING" ? "4 Saudara" : inv.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#1C1917] uppercase tracking-wider block mb-1">
                  Nominal Setoran (Rp)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="Contoh: 50000000"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full border border-[#D9D4CB] rounded-xl px-3 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#D97706]/20"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#1C1917] uppercase tracking-wider block mb-1">
                  Catatan / Keterangan Transfer
                </label>
                <textarea
                  rows={2}
                  placeholder="Keterangan setoran modal..."
                  value={depositNotes}
                  onChange={(e) => setDepositNotes(e.target.value)}
                  className="w-full border border-[#D9D4CB] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]/20"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="px-4 py-2 border border-[#D9D4CB] rounded-xl text-xs font-semibold text-[#6B6560] hover:bg-[#F7F5F2] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-[#D97706] hover:bg-[#B45309] text-white rounded-xl text-xs font-bold transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Menyimpan..." : "Simpan Setoran Modal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Tambah Investor Baru */}
      {showInvestorModal && (
        <div className="fixed inset-0 bg-black/50 z-50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#D9D4CB] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#D9D4CB] pb-3">
              <h3 className="text-base font-bold text-[#1C1917]">Tambah Investor Baru</h3>
              <button
                onClick={() => setShowInvestorModal(false)}
                className="text-[#6B6560] hover:text-[#1C1917] text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInvestor} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#1C1917] uppercase tracking-wider block mb-1">
                  Nama Lengkap Investor
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: H. Ahmad Fauzi / Ibu Nur"
                  value={newInvestorName}
                  onChange={(e) => setNewInvestorName(e.target.value)}
                  className="w-full border border-[#D9D4CB] rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#D97706]/20"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#1C1917] uppercase tracking-wider block mb-1">
                  Nomor WhatsApp / HP
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 081234567890"
                  value={newInvestorPhone}
                  onChange={(e) => setNewInvestorPhone(e.target.value)}
                  className="w-full border border-[#D9D4CB] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]/20"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#1C1917] uppercase tracking-wider block mb-1">
                  Tipe Hubungan Investor
                </label>
                <select
                  value={newInvestorType}
                  onChange={(e: any) => setNewInvestorType(e.target.value)}
                  className="w-full border border-[#D9D4CB] rounded-xl px-3 py-2.5 text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[#D97706]/20"
                >
                  <option value="THIRD_PARTY">Mitra Pihak Ketiga (Bagi Hasil Pro-rata)</option>
                  <option value="MOTHER_SIBLING">Ibu / 4 Saudara (Skema Tier Bertingkat)</option>
                  <option value="OWNER_EQUITY">Owner Showroom (Modal Pribadi Toko)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInvestorModal(false)}
                  className="px-4 py-2 border border-[#D9D4CB] rounded-xl text-xs font-semibold text-[#6B6560] hover:bg-[#F7F5F2] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-[#D97706] hover:bg-[#B45309] text-white rounded-xl text-xs font-bold transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Menyimpan..." : "Daftarkan Investor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useMemo } from "react";
import { 
  Search, 
  Car, 
  TrendingUp, 
  DollarSign, 
  Receipt, 
  Filter, 
  ExternalLink,
  ChevronRight,
  Info,
  Calendar,
  Sparkles,
  Layers,
  Wrench,
  CheckCircle2,
  X,
  Edit2
} from "lucide-react";
import { formatRupiah, formatDate, cn } from "@/lib/utils";
import { updateHistoricalSaleAction } from "@/app/actions/historical-sale";

interface HistoricalSaleItem {
  id: string;
  plateNumber: string;
  brand: string;
  model: string;
  year: number;
  color?: string | null;
  transmission?: string | null;
  sourceType?: string | null;
  auctionHouse?: string | null;
  purchasePrice: number;
  purchaseDate: string | null;
  repairExpenses: number;
  totalHpp: number;
  sellingPrice: number;
  saleDate: string | null;
  grossProfit: number;
  marginPercent: number;
  buyerName?: string | null;
  notes?: string | null;
  expenseDetails?: Array<{ category: string; amount: number; notes: string }> | null;
  sourceFile?: string | null;
}

interface SummaryStats {
  totalCount: number;
  totalOmzet: number;
  totalProfit: number;
  totalHpp: number;
  avgProfitPerUnit: number;
  avgMarginPercent: number;
}

interface ArchivePageClientProps {
  initialItems: HistoricalSaleItem[];
  initialSummary: SummaryStats;
}

export function ArchivePageClient({ initialItems, initialSummary }: ArchivePageClientProps) {
  const [items, setItems] = useState<HistoricalSaleItem[]>(initialItems);
  const [search, setSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("ALL");
  const [selectedYear, setSelectedYear] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"NEWEST" | "PROFIT_DESC" | "PRICE_DESC" | "MARGIN_DESC">("NEWEST");

  // Detail Modal
  const [selectedItem, setSelectedItem] = useState<HistoricalSaleItem | null>(null);

  // Edit Mode
  const [isEditing, setIsEditing] = useState(false);
  const [editSellingPrice, setEditSellingPrice] = useState<number>(0);
  const [editTotalHpp, setEditTotalHpp] = useState<number>(0);
  const [editNotes, setEditNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Daftar Merk Unik untuk filter
  const brands = useMemo(() => {
    const list = Array.from(new Set(items.map((i) => i.brand))).filter(Boolean).sort();
    return ["ALL", ...list];
  }, [items]);

  // Daftar Tahun Unik
  const years = useMemo(() => {
    const list = Array.from(new Set(items.map((i) => i.year))).filter((y) => y > 0).sort((a, b) => b - a);
    return ["ALL", ...list.map(String)];
  }, [items]);

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        const matchSearch =
          !search ||
          item.plateNumber.toLowerCase().includes(search.toLowerCase()) ||
          item.model.toLowerCase().includes(search.toLowerCase()) ||
          item.brand.toLowerCase().includes(search.toLowerCase()) ||
          (item.notes && item.notes.toLowerCase().includes(search.toLowerCase()));

        const matchBrand = selectedBrand === "ALL" || item.brand === selectedBrand;
        const matchYear = selectedYear === "ALL" || String(item.year) === selectedYear;

        return matchSearch && matchBrand && matchYear;
      })
      .sort((a, b) => {
        if (sortBy === "PROFIT_DESC") return b.grossProfit - a.grossProfit;
        if (sortBy === "PRICE_DESC") return b.sellingPrice - a.sellingPrice;
        if (sortBy === "MARGIN_DESC") return b.marginPercent - a.marginPercent;
        // Default NEWEST
        const dateA = a.saleDate ? new Date(a.saleDate).getTime() : 0;
        const dateB = b.saleDate ? new Date(b.saleDate).getTime() : 0;
        return dateB - dateA;
      });
  }, [items, search, selectedBrand, selectedYear, sortBy]);

  const openDetail = (item: HistoricalSaleItem) => {
    setSelectedItem(item);
    setEditSellingPrice(item.sellingPrice);
    setEditTotalHpp(item.totalHpp);
    setEditNotes(item.notes || "");
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!selectedItem) return;
    setIsSubmitting(true);
    try {
      const res = await updateHistoricalSaleAction(selectedItem.id, {
        sellingPrice: editSellingPrice,
        totalHpp: editTotalHpp,
        notes: editNotes,
      });

      if (res.success && res.data) {
        const newGrossProfit = editSellingPrice - editTotalHpp;
        const newMarginPct = editSellingPrice > 0 ? (newGrossProfit / editSellingPrice) * 100 : 0;

        const updatedList = items.map((i) =>
          i.id === selectedItem.id
            ? {
                ...i,
                sellingPrice: editSellingPrice,
                totalHpp: editTotalHpp,
                grossProfit: newGrossProfit,
                marginPercent: Math.round(newMarginPct * 10) / 10,
                notes: editNotes,
              }
            : i
        );
        setItems(updatedList);
        setSelectedItem((prev) =>
          prev
            ? {
                ...prev,
                sellingPrice: editSellingPrice,
                totalHpp: editTotalHpp,
                grossProfit: newGrossProfit,
                marginPercent: Math.round(newMarginPct * 10) / 10,
                notes: editNotes,
              }
            : null
        );
        setIsEditing(false);
      }
    } catch (err) {
      console.error("Gagal menyimpan perubahan:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* 1. Header Banner & Info */}
      <div className="bg-gradient-to-r from-[#1C1917] via-[#292524] to-[#1C1917] text-white p-6 sm:p-8 rounded-2xl shadow-xl relative overflow-hidden border border-[#D97706]/30">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-[#D97706]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-4xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D97706]/20 border border-[#D97706]/40 text-[#F59E0B] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Buku Besar Toko Lama & Benchmark Harga
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Arsip Penjualan & Referensi Pasaran
          </h1>
          <p className="text-sm sm:text-base text-[#D9D4CB] leading-relaxed">
            Data rekam jejak riil seluruh mobil & motor yang telah laku sejak 2021 hingga unit terkini.
            Didesain khusus sebagai mesin referensi harga kulakan vs harga jual pasar, tanpa mengotori arus kas aktif showroom saat ini.
          </p>
        </div>
      </div>

      {/* 2. Statistik Akumulasi Historis */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-[#D9D4CB] shadow-sm">
          <div className="flex items-center justify-between text-[#6B6560] text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Total Unit Terjual</span>
            <Car className="w-4 h-4 text-[#D97706]" />
          </div>
          <div className="text-2xl font-black text-[#1C1917]">
            {initialSummary.totalCount} <span className="text-sm font-medium text-[#6B6560]">Unit</span>
          </div>
          <div className="text-[11px] text-[#6B6560] mt-1">
            Riwayat 2021 s/d sekarang
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#D9D4CB] shadow-sm">
          <div className="flex items-center justify-between text-[#6B6560] text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Total Omzet Historis</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600">
            {formatRupiah(initialSummary.totalOmzet)}
          </div>
          <div className="text-[11px] text-[#6B6560] mt-1">
            Akumulasi transaksi bruto
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#D9D4CB] shadow-sm">
          <div className="flex items-center justify-between text-[#6B6560] text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Total Laba Kotor</span>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-600">
            {formatRupiah(initialSummary.totalProfit)}
          </div>
          <div className="text-[11px] text-[#6B6560] mt-1">
            Laba sebelum bagi hasil
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#D9D4CB] shadow-sm">
          <div className="flex items-center justify-between text-[#6B6560] text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Rata-Rata Margin / Unit</span>
            <Receipt className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-600">
            {formatRupiah(initialSummary.avgProfitPerUnit)}
          </div>
          <div className="text-[11px] text-[#6B6560] mt-1">
            Rata-rata margin: {initialSummary.avgMarginPercent}% per unit
          </div>
        </div>
      </div>

      {/* 3. Bar Pencarian & Filter */}
      <div className="bg-white p-4 rounded-xl border border-[#D9D4CB] shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Input Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6560]" />
            <input
              type="text"
              placeholder="Cari plat nomor atau tipe mobil..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-[#D9D4CB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706] focus:border-transparent bg-[#FAFAF9]"
            />
          </div>

          {/* Filter Merk */}
          <div>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full px-3 py-2 border border-[#D9D4CB] rounded-lg text-sm bg-[#FAFAF9] focus:outline-none focus:ring-2 focus:ring-[#D97706]"
            >
              <option value="ALL">Semua Merk Mobil/Motor</option>
              {brands.filter((b) => b !== "ALL").map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Filter Tahun */}
          <div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 border border-[#D9D4CB] rounded-lg text-sm bg-[#FAFAF9] focus:outline-none focus:ring-2 focus:ring-[#D97706]"
            >
              <option value="ALL">Semua Tahun Perakitan</option>
              {years.filter((y) => y !== "ALL").map((y) => (
                <option key={y} value={y}>Tahun {y}</option>
              ))}
            </select>
          </div>

          {/* Urutan Sort */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 border border-[#D9D4CB] rounded-lg text-sm bg-[#FAFAF9] focus:outline-none focus:ring-2 focus:ring-[#D97706]"
            >
              <option value="NEWEST">Terbaru Terjual</option>
              <option value="PROFIT_DESC">Keuntungan Tertinggi</option>
              <option value="PRICE_DESC">Harga Jual Tertinggi</option>
              <option value="MARGIN_DESC">Persentase Margin Tertinggi</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-[#6B6560] pt-1">
          <span>Menampilkan <strong>{filteredItems.length}</strong> dari total {items.length} unit historis</span>
          {(search || selectedBrand !== "ALL" || selectedYear !== "ALL") && (
            <button
              onClick={() => {
                setSearch("");
                setSelectedBrand("ALL");
                setSelectedYear("ALL");
              }}
              className="text-[#D97706] hover:underline font-semibold"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* 4. Tabel Daftar Penjualan Historis */}
      <div className="bg-white rounded-xl border border-[#D9D4CB] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#F5F2EB] border-b border-[#D9D4CB] text-[#6B6560] text-xs font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Plat &amp; Unit</th>
                <th className="py-3 px-4">Tahun / Transmisi</th>
                <th className="py-3 px-4">Sumber / Balai</th>
                <th className="py-3 px-4 text-right">Modal Total (HPP)</th>
                <th className="py-3 px-4 text-right">Harga Laku</th>
                <th className="py-3 px-4 text-right">Laba Kotor</th>
                <th className="py-3 px-4 text-center">Tanggal Laku</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E2DA]">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#6B6560]">
                    Tidak ditemukan data unit historis yang cocok dengan pencarian Anda.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-[#F9F8F6] transition-colors cursor-pointer group"
                    onClick={() => openDetail(item)}
                  >
                    <td className="py-3.5 px-4 font-medium">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold bg-[#E7E2DA] px-2 py-0.5 rounded text-xs text-[#1C1917]">
                          {item.plateNumber}
                        </span>
                        <span className="text-[#1C1917] font-semibold block truncate max-w-[200px] sm:max-w-[300px]">
                          {item.model}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[#6B6560]">
                      {item.year} • {item.transmission || "MANUAL"}
                    </td>
                    <td className="py-3.5 px-4 text-[#6B6560] text-xs">
                      {item.auctionHouse || item.sourceType || "LELANG"}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-[#1C1917]">
                      {formatRupiah(item.totalHpp)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-700">
                      {formatRupiah(item.sellingPrice)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span
                        className={cn(
                          "inline-block font-extrabold px-2 py-0.5 rounded text-xs",
                          item.grossProfit >= 0
                            ? "text-emerald-700 bg-emerald-50"
                            : "text-rose-700 bg-rose-50"
                        )}
                      >
                        {formatRupiah(item.grossProfit)}
                        {item.marginPercent !== 0 && (
                          <span className="text-[10px] ml-1 font-semibold opacity-80">
                            ({item.marginPercent}%)
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center text-[#6B6560] text-xs">
                      {item.saleDate ? formatDate(item.saleDate) : "-"}
                    </td>
                    <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => openDetail(item)}
                        className="px-2.5 py-1 text-xs font-semibold text-[#D97706] hover:bg-[#D97706]/10 rounded-lg transition-colors inline-flex items-center gap-1"
                      >
                        <span>Detail</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Modal Rincian & Edit Unit Historis */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-[#D9D4CB] shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 bg-[#F5F2EB] border-b border-[#D9D4CB] flex items-center justify-between">
              <div>
                <span className="font-mono text-xs font-bold bg-[#D97706]/10 text-[#D97706] px-2 py-0.5 rounded border border-[#D97706]/30">
                  {selectedItem.plateNumber}
                </span>
                <h3 className="font-black text-lg text-[#1C1917] mt-1">
                  {selectedItem.model}
                </h3>
                <p className="text-xs text-[#6B6560]">
                  Tahun {selectedItem.year} • {selectedItem.color || "HITAM"} • Sumber: {selectedItem.sourceFile || selectedItem.auctionHouse || "Lelang"}
                </p>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1.5 rounded-lg text-[#6B6560] hover:text-[#1C1917] hover:bg-[#E7E2DA] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
              {/* Financial Box */}
              {!isEditing ? (
                <div className="grid grid-cols-3 gap-3 p-4 bg-[#FAFAF9] rounded-xl border border-[#D9D4CB]">
                  <div>
                    <span className="text-[11px] font-semibold text-[#6B6560] block uppercase">
                      Modal HPP
                    </span>
                    <span className="font-bold text-[#1C1917] text-sm sm:text-base">
                      {formatRupiah(selectedItem.totalHpp)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-[#6B6560] block uppercase">
                      Harga Laku
                    </span>
                    <span className="font-bold text-emerald-700 text-sm sm:text-base">
                      {formatRupiah(selectedItem.sellingPrice)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-[#6B6560] block uppercase">
                      Laba Kotor
                    </span>
                    <span
                      className={cn(
                        "font-extrabold text-sm sm:text-base",
                        selectedItem.grossProfit >= 0 ? "text-emerald-700" : "text-rose-700"
                      )}
                    >
                      {formatRupiah(selectedItem.grossProfit)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-3">
                  <h4 className="font-bold text-amber-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit Angka Transaksi Historis
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-amber-900 block mb-1">
                        Modal Total HPP (Rp)
                      </label>
                      <input
                        type="number"
                        value={editTotalHpp}
                        onChange={(e) => setEditTotalHpp(Number(e.target.value))}
                        className="w-full px-3 py-1.5 border border-amber-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#D97706]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-amber-900 block mb-1">
                        Harga Laku Terjual (Rp)
                      </label>
                      <input
                        type="number"
                        value={editSellingPrice}
                        onChange={(e) => setEditSellingPrice(Number(e.target.value))}
                        className="w-full px-3 py-1.5 border border-amber-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#D97706]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-amber-900 block mb-1">
                      Catatan Tambahan
                    </label>
                    <textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-1.5 border border-amber-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#D97706]"
                    />
                  </div>
                </div>
              )}

              {/* Rincian Komponen Biaya (Jika ada di File 2) */}
              {selectedItem.expenseDetails && selectedItem.expenseDetails.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#6B6560] flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-[#D97706]" />
                    Rincian Komponen Biaya Unit ({selectedItem.expenseDetails.length} item)
                  </h4>
                  <div className="bg-[#FAFAF9] rounded-xl border border-[#D9D4CB] divide-y divide-[#E7E2DA] max-h-48 overflow-y-auto custom-scrollbar">
                    {selectedItem.expenseDetails.map((exp, idx) => (
                      <div key={idx} className="p-2.5 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-semibold text-[#1C1917] block">
                            {exp.notes || exp.category}
                          </span>
                          <span className="text-[10px] text-[#6B6560] uppercase">
                            {exp.category}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-[#1C1917]">
                          {formatRupiah(exp.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Info Tambahan */}
              <div className="text-xs text-[#6B6560] space-y-1 bg-[#F5F2EB] p-3 rounded-lg border border-[#D9D4CB]">
                <div>
                  <strong>Tanggal Beli:</strong> {selectedItem.purchaseDate ? formatDate(selectedItem.purchaseDate) : "-"}
                </div>
                <div>
                  <strong>Tanggal Laku:</strong> {selectedItem.saleDate ? formatDate(selectedItem.saleDate) : "-"}
                </div>
                {selectedItem.notes && (
                  <div>
                    <strong>Catatan:</strong> {selectedItem.notes}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#F5F2EB] border-t border-[#D9D4CB] flex items-center justify-between">
              {!isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-3.5 py-1.5 rounded-lg border border-[#D9D4CB] text-xs font-semibold text-[#1C1917] hover:bg-white transition-colors flex items-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-[#6B6560]" />
                    Edit Data Ini
                  </button>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="px-4 py-1.5 rounded-lg bg-[#D97706] text-white text-xs font-bold hover:bg-[#B45309] transition-colors"
                  >
                    Tutup
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3.5 py-1.5 rounded-lg border border-[#D9D4CB] text-xs font-semibold text-[#6B6560] hover:bg-white transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={isSubmitting}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1.5"
                  >
                    {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

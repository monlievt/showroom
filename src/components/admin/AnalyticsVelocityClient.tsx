"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Clock,
  Coins,
  TrendingUp,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Filter,
  Search,
  ChevronRight,
  CarFront,
  ShieldAlert,
  Flame,
  Award,
  BarChart3,
  Calculator,
  RotateCcw,
} from "lucide-react";
import { formatRupiah, formatDate, cn } from "@/lib/utils";
import {
  ShowroomAnalyticsData,
  UnitTimelineItem,
  VelocityMatrixItem,
} from "@/app/actions/analytics";

interface AnalyticsVelocityClientProps {
  initialData: ShowroomAnalyticsData;
}

type TabType = "TIMELINE" | "MATRIX" | "FUNNEL" | "TREND" | "SIMULATOR";

export function AnalyticsVelocityClient({ initialData }: AnalyticsVelocityClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>("TIMELINE");
  const [timelineFilter, setTimelineFilter] = useState<"ALL" | "SOLD" | "ACTIVE">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | "FAST" | "NORMAL" | "STAGNANT">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Simulator State
  const [simulatedDaysTarget, setSimulatedDaysTarget] = useState(25);
  const [costOfCapitalMonthlyPct, setCostOfCapitalMonthlyPct] = useState(1.0); // 1% per bulan

  const { metrics, timeline, velocityMatrix, bottleneckFunnel, monthlyTrend } = initialData;

  // Filter Timeline
  const filteredTimeline = timeline.filter((item) => {
    if (timelineFilter === "SOLD" && !item.isSold) return false;
    if (timelineFilter === "ACTIVE" && item.isSold) return false;
    if (categoryFilter !== "ALL" && item.category !== categoryFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchPlate = item.plateNumber.toLowerCase().includes(q);
      const matchBrand = item.brand.toLowerCase().includes(q);
      const matchModel = item.model.toLowerCase().includes(q);
      if (!matchPlate && !matchBrand && !matchModel) return false;
    }
    return true;
  });

  // Simulator Calculations
  const activeHpp = metrics.activeHppTotal;
  const currentAvgDays = metrics.avgDaysToSell || 45;
  const daysSaved = Math.max(0, currentAvgDays - simulatedDaysTarget);
  const dailyCostRate = (costOfCapitalMonthlyPct / 100) / 30;
  const estimatedSavingsPerCycle = Math.round(activeHpp * dailyCostRate * daysSaved);
  const estimatedAnnualSavings = Math.round(estimatedSavingsPerCycle * (365 / simulatedDaysTarget));

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* ── 1. TOP STATS / KPI SUMMARY CARDS ─────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card 1: Rata-rata Hari Laku */}
        <div className="bg-white border border-[var(--line)] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[var(--muted)]">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Rata-rata Hari Laku
            </span>
            <Clock className="w-4 h-4 text-[var(--accent)]" />
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[var(--ink)]">
                {metrics.avgDaysToSell}
              </span>
              <span className="text-xs text-[var(--muted)] font-medium">hari (beli ➔ laku)</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <span
                className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                  metrics.avgDaysToSell <= 21
                    ? "bg-[var(--ok)]/10 text-[var(--ok)] border-[var(--ok)]/30"
                    : metrics.avgDaysToSell <= 40
                    ? "bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/30"
                    : "bg-[var(--bad)]/10 text-[var(--bad)] border-[var(--bad)]/30 animate-pulse"
                )}
              >
                {metrics.avgDaysToSell <= 21
                  ? "🟢 Sangat Cepat (< 21 hr)"
                  : metrics.avgDaysToSell <= 40
                  ? "🔵 Normal Sehat"
                  : "🔴 Perlu Evaluasi (> 40 hr)"}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Biaya Modal Mengendap (Holding Cost) */}
        <div className="bg-white border border-[var(--line)] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[var(--muted)]">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Biaya Garasi / Hari
            </span>
            <Coins className="w-4 h-4 text-[var(--warn)]" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-[var(--ink)]">
              {formatRupiah(metrics.dailyHoldingCostPerUnitAvg)}
              <span className="text-xs text-[var(--muted)] font-normal"> / unit</span>
            </div>
            <div className="text-[11px] text-[var(--muted)] mt-1">
              Beban idle modal {metrics.totalActiveUnits} unit:{" "}
              <strong className="text-[var(--ink)]">
                {formatRupiah(metrics.dailyHoldingCostPerUnitAvg * metrics.totalActiveUnits)}/hari
              </strong>
            </div>
          </div>
        </div>

        {/* Card 3: Perputaran Stok Bulanan (Turnover Rate) */}
        <div className="bg-white border border-[var(--line)] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[var(--muted)]">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Turnover Bulanan
            </span>
            <TrendingUp className="w-4 h-4 text-[var(--ok)]" />
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[var(--ink)]">
                {metrics.inventoryTurnoverMonthly}x
              </span>
              <span className="text-xs text-[var(--muted)] font-medium">perputaran / bln</span>
            </div>
            <div className="text-[11px] text-[var(--muted)] mt-1">
              Total {metrics.totalSoldUnits} unit terjual dalam catatan sistem
            </div>
          </div>
        </div>

        {/* Card 4: Rekor Flip Tercepat */}
        <div className="bg-white border border-[var(--line)] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[var(--muted)]">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Rekor Tercepat
            </span>
            <Zap className="w-4 h-4 text-[var(--accent)]" />
          </div>
          <div className="mt-2">
            {metrics.fastestUnit ? (
              <>
                <div className="text-sm font-bold text-[var(--ink)] truncate">
                  {metrics.fastestUnit.name}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-black text-[var(--ok)]">
                    ⚡ {metrics.fastestUnit.days} Hari
                  </span>
                  <span className="text-[10px] text-[var(--muted)]">
                    Laba: {formatRupiah(metrics.fastestUnit.profit)}
                  </span>
                </div>
              </>
            ) : (
              <span className="text-xs text-[var(--muted)]">Belum ada data unit laku</span>
            )}
            {metrics.slowestUnit && (
              <div className="text-[10px] text-[var(--muted)] mt-1.5 pt-1.5 border-t border-[var(--line)] truncate">
                Unit terlama: <strong className="text-[var(--ink)]">{metrics.slowestUnit.name}</strong> ({metrics.slowestUnit.days} hr)
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. INTERACTIVE BENTO HUB SWITCHER (VARIASI 1) ─────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-[var(--muted)] px-1">
          <span className="font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
            Pilih Modul Analisis
          </span>
          <span className="text-[11px] hidden sm:inline-block">Klik kartu untuk berganti modul secara instan</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Card 1: Timeline Siklus Unit */}
          <button
            onClick={() => setActiveTab("TIMELINE")}
            type="button"
            className={cn(
              "text-left p-3.5 sm:p-4 rounded-2xl border transition-all relative flex flex-col justify-between cursor-pointer group",
              activeTab === "TIMELINE"
                ? "bg-white border-[var(--accent)] shadow-md ring-2 ring-[var(--accent)]/20"
                : "bg-white border-[var(--line)] hover:border-[var(--muted)]/50 hover:bg-[var(--bg)]/60 shadow-2xs"
            )}
          >
            <div>
              <div className="flex items-center justify-between">
                <div
                  className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center transition-colors",
                    activeTab === "TIMELINE"
                      ? "bg-[var(--accent)] text-white shadow-2xs"
                      : "bg-[var(--bg)] text-[var(--accent)] group-hover:bg-white"
                  )}
                >
                  <Calendar className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)]">
                  {timeline.length} Unit
                </span>
              </div>
              <div className="mt-2.5">
                <div className="text-xs sm:text-sm font-extrabold text-[var(--ink)] tracking-tight">
                  Timeline Beli ➔ Laku
                </div>
                <p className="text-[11px] text-[var(--muted)] mt-0.5 line-clamp-1">
                  Gantt chart jejak tanggal &amp; durasi
                </p>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-[var(--line)] flex items-center justify-between text-[10px]">
              <span
                className={cn(
                  "font-bold",
                  activeTab === "TIMELINE" ? "text-[var(--accent)]" : "text-[var(--muted)]"
                )}
              >
                {activeTab === "TIMELINE" ? "● Sedang Aktif" : "Buka Gantt Chart →"}
              </span>
            </div>
          </button>

          {/* Card 2: Velocity Matrix */}
          <button
            onClick={() => setActiveTab("MATRIX")}
            type="button"
            className={cn(
              "text-left p-3.5 sm:p-4 rounded-2xl border transition-all relative flex flex-col justify-between cursor-pointer group",
              activeTab === "MATRIX"
                ? "bg-white border-[var(--ok)] shadow-md ring-2 ring-[var(--ok)]/20"
                : "bg-white border-[var(--line)] hover:border-[var(--muted)]/50 hover:bg-[var(--bg)]/60 shadow-2xs"
            )}
          >
            <div>
              <div className="flex items-center justify-between">
                <div
                  className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center transition-colors",
                    activeTab === "MATRIX"
                      ? "bg-[var(--ok)] text-white shadow-2xs"
                      : "bg-[var(--bg)] text-[var(--ok)] group-hover:bg-white"
                  )}
                >
                  <Award className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)]">
                  {velocityMatrix.length} Tipe
                </span>
              </div>
              <div className="mt-2.5">
                <div className="text-xs sm:text-sm font-extrabold text-[var(--ink)] tracking-tight">
                  Matriks Kulakan Cuan
                </div>
                <p className="text-[11px] text-[var(--muted)] mt-0.5 line-clamp-1">
                  Peringkat fast cash &amp; margin tebal
                </p>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-[var(--line)] flex items-center justify-between text-[10px]">
              <span
                className={cn(
                  "font-bold",
                  activeTab === "MATRIX" ? "text-[var(--ok)]" : "text-[var(--muted)]"
                )}
              >
                {activeTab === "MATRIX" ? "● Sedang Aktif" : "Buka Rekomendasi →"}
              </span>
            </div>
          </button>

          {/* Card 3: Bottleneck Garasi */}
          <button
            onClick={() => setActiveTab("FUNNEL")}
            type="button"
            className={cn(
              "text-left p-3.5 sm:p-4 rounded-2xl border transition-all relative flex flex-col justify-between cursor-pointer group",
              activeTab === "FUNNEL"
                ? "bg-white border-[var(--warn)] shadow-md ring-2 ring-[var(--warn)]/20"
                : "bg-white border-[var(--line)] hover:border-[var(--muted)]/50 hover:bg-[var(--bg)]/60 shadow-2xs"
            )}
          >
            <div>
              <div className="flex items-center justify-between">
                <div
                  className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center transition-colors",
                    activeTab === "FUNNEL"
                      ? "bg-[var(--warn)] text-white shadow-2xs"
                      : "bg-[var(--bg)] text-[var(--warn)] group-hover:bg-white"
                  )}
                >
                  <Layers className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)]">
                  4 Alur
                </span>
              </div>
              <div className="mt-2.5">
                <div className="text-xs sm:text-sm font-extrabold text-[var(--ink)] tracking-tight">
                  Bottleneck Garasi
                </div>
                <p className="text-[11px] text-[var(--muted)] mt-0.5 line-clamp-1">
                  Waktu terhambat di bengkel / salon
                </p>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-[var(--line)] flex items-center justify-between text-[10px]">
              <span
                className={cn(
                  "font-bold",
                  activeTab === "FUNNEL" ? "text-[var(--warn)]" : "text-[var(--muted)]"
                )}
              >
                {activeTab === "FUNNEL" ? "● Sedang Aktif" : "Cek Titik Macet →"}
              </span>
            </div>
          </button>

          {/* Card 4: Tren Musiman */}
          <button
            onClick={() => setActiveTab("TREND")}
            type="button"
            className={cn(
              "text-left p-3.5 sm:p-4 rounded-2xl border transition-all relative flex flex-col justify-between cursor-pointer group",
              activeTab === "TREND"
                ? "bg-white border-indigo-600 shadow-md ring-2 ring-indigo-600/20"
                : "bg-white border-[var(--line)] hover:border-[var(--muted)]/50 hover:bg-[var(--bg)]/60 shadow-2xs"
            )}
          >
            <div>
              <div className="flex items-center justify-between">
                <div
                  className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center transition-colors",
                    activeTab === "TREND"
                      ? "bg-indigo-600 text-white shadow-2xs"
                      : "bg-[var(--bg)] text-indigo-600 group-hover:bg-white"
                  )}
                >
                  <BarChart3 className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)]">
                  12 Bulan
                </span>
              </div>
              <div className="mt-2.5">
                <div className="text-xs sm:text-sm font-extrabold text-[var(--ink)] tracking-tight">
                  Tren Musiman
                </div>
                <p className="text-[11px] text-[var(--muted)] mt-0.5 line-clamp-1">
                  Pola ramai vs sepi bulan ke bulan
                </p>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-[var(--line)] flex items-center justify-between text-[10px]">
              <span
                className={cn(
                  "font-bold",
                  activeTab === "TREND" ? "text-indigo-600" : "text-[var(--muted)]"
                )}
              >
                {activeTab === "TREND" ? "● Sedang Aktif" : "Buka Grafik Tren →"}
              </span>
            </div>
          </button>

          {/* Card 5: Simulasi Modal */}
          <button
            onClick={() => setActiveTab("SIMULATOR")}
            type="button"
            className={cn(
              "text-left p-3.5 sm:p-4 rounded-2xl border transition-all relative flex flex-col justify-between cursor-pointer group",
              activeTab === "SIMULATOR"
                ? "bg-white border-[var(--accent)] shadow-md ring-2 ring-[var(--accent)]/20"
                : "bg-white border-[var(--line)] hover:border-[var(--muted)]/50 hover:bg-[var(--bg)]/60 shadow-2xs"
            )}
          >
            <div>
              <div className="flex items-center justify-between">
                <div
                  className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center transition-colors",
                    activeTab === "SIMULATOR"
                      ? "bg-[var(--accent)] text-white shadow-2xs"
                      : "bg-[var(--bg)] text-[var(--accent)] group-hover:bg-white"
                  )}
                >
                  <Calculator className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-[var(--ok)] border border-emerald-200">
                  ROI Kas
                </span>
              </div>
              <div className="mt-2.5">
                <div className="text-xs sm:text-sm font-extrabold text-[var(--ink)] tracking-tight">
                  Simulasi Efisiensi
                </div>
                <p className="text-[11px] text-[var(--muted)] mt-0.5 line-clamp-1">
                  Pangkas hari garasi = cuan ekstra
                </p>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-[var(--line)] flex items-center justify-between text-[10px]">
              <span
                className={cn(
                  "font-bold",
                  activeTab === "SIMULATOR" ? "text-[var(--accent)]" : "text-[var(--muted)]"
                )}
              >
                {activeTab === "SIMULATOR" ? "● Sedang Aktif" : "Mulai Simulasi →"}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* ── 3. TAB CONTENT ───────────────────────────────────────── */}

      {/* ── TAB 1: VISUAL TIMELINE SIKLUS UNIT (GANTT CHART) ───── */}
      {activeTab === "TIMELINE" && (
        <div className="space-y-4">
          {/* Controls & Filter */}
          <div className="bg-white border border-[var(--line)] rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[var(--muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari plat nomor, merk, atau tipe..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[var(--bg)] border border-[var(--line)] rounded-xl text-xs sm:text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-[var(--bg)] p-1 rounded-xl border border-[var(--line)]">
                <button
                  onClick={() => setTimelineFilter("ALL")}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer",
                    timelineFilter === "ALL" ? "bg-white text-[var(--ink)] shadow-2xs" : "text-[var(--muted)]"
                  )}
                >
                  Semua ({timeline.length})
                </button>
                <button
                  onClick={() => setTimelineFilter("SOLD")}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer",
                    timelineFilter === "SOLD" ? "bg-white text-[var(--ok)] shadow-2xs font-bold" : "text-[var(--muted)]"
                  )}
                >
                  Terjual ({timeline.filter((t) => t.isSold).length})
                </button>
                <button
                  onClick={() => setTimelineFilter("ACTIVE")}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer",
                    timelineFilter === "ACTIVE" ? "bg-white text-[var(--accent)] shadow-2xs font-bold" : "text-[var(--muted)]"
                  )}
                >
                  Di Garasi ({timeline.filter((t) => !t.isSold).length})
                </button>
              </div>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as any)}
                aria-label="Filter kategori kecepatan"
                className="px-3 py-2 bg-[var(--bg)] border border-[var(--line)] rounded-xl text-xs font-semibold text-[var(--ink)] cursor-pointer"
              >
                <option value="ALL">Semua Kecepatan</option>
                <option value="FAST">⚡ Fast Moving (≤ 18 hr)</option>
                <option value="NORMAL">Normal (19 - 45 hr)</option>
                <option value="STAGNANT">🔴 Macet (&gt; 45 hr)</option>
              </select>
            </div>
          </div>

          {/* Timeline List */}
          <div className="bg-white border border-[var(--line)] rounded-2xl p-4 sm:p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)] text-xs text-[var(--muted)] font-medium">
              <span>Menampilkan {filteredTimeline.length} unit kendaraan</span>
              <div className="flex items-center gap-3 hidden sm:flex text-[11px]">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[var(--ok)]" /> Fast (&le;18 hr)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)]" /> Normal (19-45 hr)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[var(--bad)]" /> Macet (&gt;45 hr)
                </span>
              </div>
            </div>

            {filteredTimeline.length === 0 ? (
              <div className="py-12 text-center text-xs text-[var(--muted)]">
                Tidak ada data unit yang sesuai filter.
              </div>
            ) : (
              <div className="divide-y divide-[var(--line)]">
                {filteredTimeline.map((item) => {
                  const maxBarDays = 60;
                  const barWidthPct = Math.min(100, Math.max(12, (item.durationDays / maxBarDays) * 100));

                  return (
                    <div
                      key={item.id}
                      className="py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 hover:bg-[var(--bg)]/50 p-2 rounded-xl transition-colors"
                    >
                      {/* Left: Unit Info */}
                      <div className="w-full lg:w-72 shrink-0">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs sm:text-sm text-[var(--ink)] font-mono">
                            {item.plateNumber}
                          </span>
                          <span
                            className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                              item.isSold
                                ? "bg-[var(--ok)]/10 text-[var(--ok)] border-[var(--ok)]/30"
                                : item.durationDays > 45
                                ? "bg-[var(--bad)]/10 text-[var(--bad)] border-[var(--bad)]/30"
                                : "bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/30"
                            )}
                          >
                            {item.isSold ? "✓ Terjual" : `Garasi (${item.status})`}
                          </span>
                        </div>
                        <div className="text-xs text-[var(--ink)] font-medium truncate mt-0.5">
                          {item.brand} {item.model} ({item.year})
                        </div>
                      </div>

                      {/* Center: Visual Gantt Bar */}
                      <div className="flex-1 min-w-0 px-0 lg:px-4">
                        <div className="flex items-center justify-between text-[11px] text-[var(--muted)] mb-1">
                          <span>Beli: <strong>{formatDate(item.purchaseDate)}</strong></span>
                          <span>
                            {item.isSold && item.saleDate ? (
                              <>Laku: <strong>{formatDate(item.saleDate)}</strong></>
                            ) : (
                              <span className="text-[var(--warn)]">Masih Berjalan di Garasi</span>
                            )}
                          </span>
                        </div>

                        {/* Progress Bar Container */}
                        <div className="h-6 w-full bg-[var(--bg)] border border-[var(--line)] rounded-lg relative overflow-hidden flex items-center">
                          <div
                            style={{ width: `${barWidthPct}%` }}
                            className={cn(
                              "h-full rounded-md transition-all duration-500 flex items-center px-2",
                              item.category === "FAST"
                                ? "bg-[var(--ok)]/20 border-r-2 border-[var(--ok)] text-[var(--ok)]"
                                : item.category === "NORMAL"
                                ? "bg-[var(--accent)]/20 border-r-2 border-[var(--accent)] text-[var(--accent)]"
                                : "bg-[var(--bad)]/25 border-r-2 border-[var(--bad)] text-[var(--bad)]"
                            )}
                          >
                            <span className="text-[10px] font-bold font-mono whitespace-nowrap">
                              ⏱️ {item.durationDays} Hari
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Profit & Economics */}
                      <div className="w-full lg:w-48 shrink-0 text-left lg:text-right flex lg:flex-col justify-between items-center lg:items-end border-t lg:border-t-0 pt-2 lg:pt-0 border-[var(--line)]">
                        <div>
                          <span className="text-[10px] text-[var(--muted)] block">HPP Unit</span>
                          <span className="text-xs font-bold text-[var(--ink)]">
                            {formatRupiah(item.hpp)}
                          </span>
                        </div>

                        {item.grossProfit !== null && item.grossProfit !== undefined ? (
                          <div className="mt-0.5">
                            <span
                              className={cn(
                                "text-xs font-black",
                                item.grossProfit >= 0 ? "text-[var(--ok)]" : "text-[var(--bad)]"
                              )}
                            >
                              {item.grossProfit >= 0 ? "+" : ""}{formatRupiah(item.grossProfit)}
                            </span>
                            {item.marginPct !== null && (
                              <span className="text-[10px] text-[var(--muted)] ml-1">
                                ({item.marginPct.toFixed(1)}%)
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="mt-0.5 text-[10px] text-[var(--muted)]">
                            Biaya tunggu: ~{formatRupiah(item.durationDays * 35000)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: VELOCITY MATRIX (PANDUAN KULAKAN CUAN) ───────── */}
      {activeTab === "MATRIX" && (
        <div className="space-y-6">
          {/* 4 Quadrants Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Quadrant 1: Star Profit */}
            <div className="bg-white border-2 border-[var(--ok)]/40 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[var(--ok)] uppercase tracking-wider">
                  ⭐ Star Profit
                </span>
                <Flame className="w-4 h-4 text-[var(--ok)]" />
              </div>
              <p className="text-xs text-[var(--muted)] mt-1">
                Laku cepat (&le;20 hari) &amp; Margin tebal (&ge;Rp 8 Juta).
              </p>
              <div className="mt-3 text-xs font-bold text-[var(--ink)]">
                {velocityMatrix.filter((v) => v.classification === "STAR_PROFIT").length} Model Kendaraan
              </div>
            </div>

            {/* Quadrant 2: Fast Cash */}
            <div className="bg-white border-2 border-[var(--accent)]/40 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[var(--accent)] uppercase tracking-wider">
                  ⚡ Fast Cash
                </span>
                <Zap className="w-4 h-4 text-[var(--accent)]" />
              </div>
              <p className="text-xs text-[var(--muted)] mt-1">
                Perputaran kilat (&le;18 hari) untuk menjaga likuiditas kas.
              </p>
              <div className="mt-3 text-xs font-bold text-[var(--ink)]">
                {velocityMatrix.filter((v) => v.classification === "FAST_CASH").length} Model Kendaraan
              </div>
            </div>

            {/* Quadrant 3: Steady Movers */}
            <div className="bg-white border border-[var(--line)] rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider">
                  🚗 Steady Movers
                </span>
                <CheckCircle2 className="w-4 h-4 text-[var(--muted)]" />
              </div>
              <p className="text-xs text-[var(--muted)] mt-1">
                Perputaran normal showroom (20–45 hari).
              </p>
              <div className="mt-3 text-xs font-bold text-[var(--ink)]">
                {velocityMatrix.filter((v) => v.classification === "STEADY").length} Model Kendaraan
              </div>
            </div>

            {/* Quadrant 4: Slow / Stagnant */}
            <div className="bg-white border-2 border-[var(--bad)]/40 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[var(--bad)] uppercase tracking-wider">
                  ⚠️ Slow / Stagnant
                </span>
                <AlertTriangle className="w-4 h-4 text-[var(--bad)]" />
              </div>
              <p className="text-xs text-[var(--muted)] mt-1">
                Rata-rata macet (&gt;45 hari). Minta diskon gede saat lelang.
              </p>
              <div className="mt-3 text-xs font-bold text-[var(--ink)]">
                {velocityMatrix.filter((v) => v.classification === "SLOW_STAGNANT").length} Model Kendaraan
              </div>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="bg-white border border-[var(--line)] rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 sm:p-5 border-b border-[var(--line)] bg-[var(--bg)] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[var(--ink)]">
                  Peringkat Model Kendaraan &amp; Rekomendasi Kulakan
                </h3>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  Dihitung otomatis dari riwayat transaksi nyata showroom dan arsip toko.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[var(--bg)] text-[var(--muted)] uppercase text-[10px] sm:text-[11px] font-bold tracking-wider border-b border-[var(--line)]">
                  <tr>
                    <th className="py-3 px-4">Merk &amp; Tipe Model</th>
                    <th className="py-3 px-4">Klasifikasi Velocity</th>
                    <th className="py-3 px-4 text-center">Volume Unit</th>
                    <th className="py-3 px-4 text-right">Rata-rata Hari Laku</th>
                    <th className="py-3 px-4 text-right">Rata-rata Margin (Rp)</th>
                    <th className="py-3 px-4 text-right">Margin %</th>
                    <th className="py-3 px-4">Panduan Keputusan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {velocityMatrix.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-xs text-[var(--muted)]">
                        Belum ada data transaksi yang cukup untuk menyusun matriks.
                      </td>
                    </tr>
                  ) : (
                    velocityMatrix.map((item, idx) => (
                      <tr key={idx} className="hover:bg-[var(--bg)] transition-colors">
                        <td className="py-3.5 px-4 font-bold text-[var(--ink)]">
                          {item.brand} {item.model}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={cn(
                              "text-[10px] font-bold px-2.5 py-0.5 rounded-full border",
                              item.classification === "STAR_PROFIT"
                                ? "bg-[var(--ok)]/10 text-[var(--ok)] border-[var(--ok)]/30"
                                : item.classification === "FAST_CASH"
                                ? "bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/30"
                                : item.classification === "SLOW_STAGNANT"
                                ? "bg-[var(--bad)]/10 text-[var(--bad)] border-[var(--bad)]/30"
                                : "bg-[var(--bg)] text-[var(--ink)] border-[var(--line)]"
                            )}
                          >
                            {item.classification === "STAR_PROFIT"
                              ? "⭐ Star Profit"
                              : item.classification === "FAST_CASH"
                              ? "⚡ Fast Cash"
                              : item.classification === "SLOW_STAGNANT"
                              ? "⚠️ Slow Stagnant"
                              : "🚗 Steady"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-medium">
                          {item.soldUnits} terjual / {item.totalUnits} unit
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold font-mono">
                          <span
                            className={cn(
                              item.avgDaysToSell <= 20
                                ? "text-[var(--ok)]"
                                : item.avgDaysToSell > 45
                                ? "text-[var(--bad)]"
                                : "text-[var(--ink)]"
                            )}
                          >
                            {item.avgDaysToSell} Hari
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-[var(--ink)] font-mono">
                          {formatRupiah(item.avgProfitRupiah)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-[var(--muted)] font-mono">
                          {item.avgMarginPct}%
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-xs font-semibold text-[var(--ink)]">
                            {item.recommendationTag}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: BOTTLENECK FUNNEL GARASI ──────────────────────── */}
      {activeTab === "FUNNEL" && (
        <div className="bg-white border border-[var(--line)] rounded-2xl p-6 shadow-xs space-y-6">
          <div className="border-b border-[var(--line)] pb-4">
            <h3 className="text-base font-bold text-[var(--ink)]">
              Lead Time &amp; Analisa Bottleneck Alur Garasi
            </h3>
            <p className="text-xs text-[var(--muted)] mt-1">
              Mendeteksi di tahap mana modal Anda terhambat paling lama: apakah di bengkel rekanan, salon poles, atau pemasaran.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {bottleneckFunnel.map((stage, idx) => (
              <div
                key={idx}
                className={cn(
                  "p-5 rounded-2xl border flex flex-col justify-between space-y-3",
                  stage.status === "GOOD"
                    ? "bg-white border-[var(--line)]"
                    : stage.status === "WARNING"
                    ? "bg-amber-50/30 border-amber-200"
                    : "bg-rose-50/30 border-rose-200"
                )}
              >
                <div>
                  <div className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">
                    {stage.stage}
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-[var(--ink)]">
                      {stage.avgDays}
                    </span>
                    <span className="text-xs text-[var(--muted)]">hari rata-rata</span>
                  </div>
                </div>

                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  {stage.description}
                </p>

                <div className="pt-2 border-t border-[var(--line)] text-[11px] font-bold">
                  {stage.status === "GOOD" ? (
                    <span className="text-[var(--ok)] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Alur Cepat &amp; Efisien
                    </span>
                  ) : stage.status === "WARNING" ? (
                    <span className="text-[var(--warn)] flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Potensi Bottleneck
                    </span>
                  ) : (
                    <span className="text-[var(--bad)] flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" /> Titik Kritis Hambatan
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Actionable Advice Box */}
          <div className="bg-[var(--bg)] border border-[var(--line)] rounded-xl p-4 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-[var(--accent)] shrink-0 mt-0.5" />
            <div className="text-xs text-[var(--ink)] leading-relaxed space-y-1">
              <strong>Tips Efisiensi dari Analitik Garasi:</strong>
              <p className="text-[var(--muted)]">
                Jika durasi di bengkel cat &amp; salon melebihi <strong>7 hari</strong>, segera evaluasi bengkel rekanan atau alihkan perbaikan minor ke divisi garasi mandiri menggunakan bahan habis pakai internal agar mobil bisa segera difoto dan tayang di katalog.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: TREN MUSIMAN (12 BULAN) ───────────────────────── */}
      {activeTab === "TREND" && (
        <div className="bg-white border border-[var(--line)] rounded-2xl p-6 shadow-xs space-y-6">
          <div className="border-b border-[var(--line)] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-[var(--ink)]">
                Tren Musiman &amp; Volume Penjualan (12 Bulan Terakhir)
              </h3>
              <p className="text-xs text-[var(--muted)] mt-1">
                Membaca ritme pasar: kapan penjualan ramai (peak season) dan kapan pasar melambat.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {monthlyTrend.map((m) => (
              <div
                key={m.monthKey}
                className="bg-[var(--bg)] border border-[var(--line)] rounded-xl p-3.5 flex flex-col justify-between space-y-2 hover:border-[var(--accent)]/50 transition-colors"
              >
                <div className="font-bold text-xs text-[var(--ink)] border-b border-[var(--line)] pb-1.5 flex items-center justify-between">
                  <span>{m.monthLabel}</span>
                  {m.unitsSold > 0 && (
                    <span className="text-[10px] font-mono text-[var(--ok)] font-bold">
                      {m.unitsSold} laku
                    </span>
                  )}
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-[var(--muted)] text-[11px]">
                    <span>Beli:</span>
                    <strong className="text-[var(--ink)]">{m.unitsBought} unit</strong>
                  </div>
                  <div className="flex justify-between text-[var(--muted)] text-[11px]">
                    <span>Laku:</span>
                    <strong className="text-[var(--ok)]">{m.unitsSold} unit</strong>
                  </div>
                  <div className="flex justify-between text-[var(--muted)] text-[11px]">
                    <span>Kecepatan:</span>
                    <strong className="text-[var(--ink)]">
                      {m.avgDaysToSell > 0 ? `${m.avgDaysToSell} hr` : "-"}
                    </strong>
                  </div>
                </div>

                <div className="pt-1.5 border-t border-[var(--line)] text-right">
                  <span className="text-[10px] text-[var(--muted)] block">Profit Laba</span>
                  <span className="text-xs font-extrabold text-[var(--ink)]">
                    {formatRupiah(m.profit)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 5: SIMULASI EFISIENSI MODAL & HOLDING COST ────────── */}
      {activeTab === "SIMULATOR" && (
        <div className="bg-white border border-[var(--line)] rounded-2xl p-6 shadow-xs space-y-6">
          <div className="border-b border-[var(--line)] pb-4">
            <h3 className="text-base font-bold text-[var(--ink)] flex items-center gap-2">
              <Calculator className="w-5 h-5 text-[var(--accent)]" />
              <span>Kalkulator Simulasi: Efisiensi Perputaran Modal Showroom</span>
            </h3>
            <p className="text-xs text-[var(--muted)] mt-1">
              Hitung potensi penghematan rupiah dan percepatan arus kas jika Anda menekan durasi menginap mobil di garasi.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
            {/* Input Controls */}
            <div className="space-y-4 bg-[var(--bg)] p-5 rounded-2xl border border-[var(--line)]">
              <div>
                <label className="text-xs font-bold text-[var(--ink)] block mb-1">
                  Target Rata-rata Hari Laku Baru: <strong>{simulatedDaysTarget} Hari</strong>
                </label>
                <input
                  type="range"
                  min="10"
                  max="60"
                  value={simulatedDaysTarget}
                  onChange={(e) => setSimulatedDaysTarget(Number(e.target.value))}
                  className="w-full accent-[var(--accent)] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[var(--muted)] mt-1">
                  <span>10 Hari (Sangat Agresif)</span>
                  <span>25 Hari (Ideal)</span>
                  <span>60 Hari (Lambat)</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--ink)] block mb-1">
                  Estimasi Biaya Bunga Modal Investor / Opportunity Cost: <strong>{costOfCapitalMonthlyPct}% / bulan</strong>
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.1"
                  value={costOfCapitalMonthlyPct}
                  onChange={(e) => setCostOfCapitalMonthlyPct(Number(e.target.value))}
                  className="w-full accent-[var(--accent)] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[var(--muted)] mt-1">
                  <span>0.5% (Modal Sendiri)</span>
                  <span>1.0% (Bagi Hasil Investor)</span>
                  <span>2.5% (Bunga Pinjaman)</span>
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--line)] text-xs text-[var(--muted)] space-y-1">
                <div>Total Modal HPP Garasi Saat Ini: <strong>{formatRupiah(activeHpp)}</strong></div>
                <div>Rata-rata Durasi Laku Saat Ini: <strong>{currentAvgDays} Hari</strong></div>
              </div>
            </div>

            {/* Simulation Results */}
            <div className="bg-[var(--surface)] border-2 border-[var(--ok)]/40 rounded-2xl p-6 shadow-xs space-y-4">
              <span className="text-xs font-bold text-[var(--ok)] uppercase tracking-wider block">
                Hasil Simulasi Percepatan Cashflow
              </span>

              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-[var(--line)]">
                  <span className="text-xs text-[var(--muted)]">Hari Terpangkas per Siklus</span>
                  <span className="text-base font-extrabold text-[var(--ink)]">
                    {daysSaved} Hari Lebih Cepat
                  </span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-[var(--line)]">
                  <span className="text-xs text-[var(--muted)]">Hemat Biaya Tunggu per Perputaran</span>
                  <span className="text-base font-extrabold text-[var(--ok)]">
                    + {formatRupiah(estimatedSavingsPerCycle)}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-sm font-bold text-[var(--ink)]">Estimasi Tambahan Profit per Tahun</span>
                  <span className="text-xl font-black text-[var(--ok)]">
                    + {formatRupiah(estimatedAnnualSavings)} / thn
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-[var(--muted)] leading-relaxed pt-2 border-t border-[var(--line)]">
                💡 Memotong waktu diam mobil di garasi sebesar <strong>{daysSaved} hari</strong> setara dengan menyuntikkan likuiditas ekstra <strong>{formatRupiah(estimatedAnnualSavings)}</strong> ke kas showroom tanpa perlu menambah modal investor.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

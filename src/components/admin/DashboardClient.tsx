"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Bot,
  Car,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Wallet,
  ArrowRight,
  Send,
  Building,
  Wrench,
  FileText,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  Layers,
  ShoppingBag,
  HelpCircle,
  Plus,
  Coins,
  Power,
  Gavel,
  BarChart3,
  TrendingDown,
  CalendarClock,
  BadgeCheck,
  ShieldAlert,
  Receipt,
  ArrowUpCircle,
  ArrowDownCircle,
  MessageCircle,
  BellRing,
} from "lucide-react";
import { formatRupiah, cn } from "@/lib/utils";
import { generateReceivableReminderLink } from "@/lib/utils/whatsapp";
import {
  DashboardOperationalData,
  BusinessPatternAnalytics,
  generateExecutiveAiBriefing,
  askAiShowroomAdvisor,
} from "@/app/actions/ai-assistant";
import { toggleSystemSettingAction } from "@/app/actions/setting";


interface DashboardClientProps {
  initialData: DashboardOperationalData;
  hasGeminiKey: boolean;
  geminiKeySet?: boolean;
  geminiEnabled?: boolean;
}

export function DashboardClient({
  initialData,
  hasGeminiKey,
  geminiKeySet = false,
  geminiEnabled = true,
}: DashboardClientProps) {
  const [data, setData] = useState<DashboardOperationalData>(initialData);
  const [activeGemini, setActiveGemini] = useState(hasGeminiKey);
  const [keyPresent, setKeyPresent] = useState(geminiKeySet || hasGeminiKey);
  const [isEnablingGemini, setIsEnablingGemini] = useState(false);

  // AI Briefing State
  const [aiBriefing, setAiBriefing] = useState<string | null>(null);
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleQuickEnableGemini = async () => {
    setIsEnablingGemini(true);
    setAiError(null);
    const res = await toggleSystemSettingAction("GEMINI_ENABLED", true);
    setIsEnablingGemini(false);
    if (res.success) {
      setActiveGemini(true);
    } else {
      setAiError(res.error || "Gagal mengaktifkan Gemini");
    }
  };

  // Interactive AI Question State
  const [question, setQuestion] = useState("");
  const [askingAi, setAskingAi] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);

  const handleGenerateBriefing = async () => {
    setBriefingLoading(true);
    setAiError(null);
    const res = await generateExecutiveAiBriefing();
    setBriefingLoading(false);
    if (res.success && res.briefing) {
      setAiBriefing(res.briefing);
    } else {
      setAiError(res.error || "Gagal menghasilkan briefing AI.");
    }
  };

  const handleAskAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setAskingAi(true);
    setAiAnswer(null);
    setAiError(null);
    const res = await askAiShowroomAdvisor(question);
    setAskingAi(false);

    if (res.success && res.answer) {
      setAiAnswer(res.answer);
    } else {
      setAiError(res.error || "Gagal berkonsultasi dengan AI.");
    }
  };

  const handlePresetQuestion = (preset: string) => {
    setQuestion(preset);
  };

  const cf = data.cashflowProjection;
  const ap = data.auctionPipeline;
  const netPositive = cf.netCashflow14Days >= 0;

  return (
    <div className="space-y-8">
      {/* ── 1. AI EXECUTIVE BRIEFING & DECISION SUPPORT PANEL ── */}
      <div className="rounded-3xl bg-gradient-to-br from-[#1C1917] via-[#292524] to-[#1C1917] text-white p-6 sm:p-8 shadow-xl border border-stone-800 relative overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#D97706]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Header AI Panel */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#D97706] to-amber-400 text-white flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                    Asisten Keputusan & Briefing AI Showroom
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Gemini AI
                  </span>
                </div>
                <p className="text-xs text-stone-400 mt-0.5">
                  Analisis cerdas pola lelang eks perusahaan, proyeksi kas 14 hari, dan rekomendasi
                  kulakan berbasis data real-time.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {activeGemini ? (
                <button
                  onClick={handleGenerateBriefing}
                  disabled={briefingLoading}
                  className="flex items-center gap-2 bg-[#D97706] hover:bg-[#B45309] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", briefingLoading && "animate-spin")} />
                  <span>{briefingLoading ? "Sedang Menganalisis..." : "Generate Rangkuman Harian AI"}</span>
                </button>
              ) : keyPresent ? (
                <button
                  onClick={handleQuickEnableGemini}
                  disabled={isEnablingGemini}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{isEnablingGemini ? "Mengaktifkan..." : "Aktifkan Sakelar Gemini (ON)"}</span>
                </button>
              ) : (
                <Link
                  href="/admin/settings"
                  className="flex items-center gap-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Aktifkan Kunci API Gemini Gratis</span>
                </Link>
              )}
            </div>
          </div>

          {/* AI Error Notification Banner */}
          {aiError && (
            <div className="bg-red-950/80 border border-red-700/60 rounded-2xl p-4 text-xs text-red-200 flex items-start justify-between gap-3 shadow-md animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold text-red-100 block">Pemberitahuan Asisten AI:</strong>
                  <p className="mt-0.5 leading-relaxed">{aiError}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAiError(null)}
                className="text-xs text-red-300 hover:text-white underline shrink-0 cursor-pointer font-bold px-2 py-0.5"
              >
                Tutup
              </button>
            </div>
          )}

          {/* AI Daily Briefing Content */}
          {aiBriefing ? (
            <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-5 text-xs sm:text-sm text-stone-200 leading-relaxed space-y-3">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2 mb-2 text-stone-400 text-xs">
                <span className="font-semibold text-amber-400 flex items-center gap-1.5">
                  <Bot className="w-4 h-4" />
                  Hasil Analisa Asisten Eksekutif (Konteks: Lelang 80%, Eks Perusahaan 90%, Piutang 2 Minggu)
                </span>
                <span>{new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB</span>
              </div>
              <div className="whitespace-pre-line font-normal">{aiBriefing}</div>
            </div>
          ) : (
            <div className="bg-stone-900/40 border border-stone-800/80 rounded-2xl p-5 text-xs text-stone-300 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <strong className="text-stone-100 font-bold block text-sm">
                  {activeGemini
                    ? "Siap Menganalisa: Pola Lelang, Proyeksi Kas, & Rekomendasi Kulakan"
                    : keyPresent
                    ? "Kunci API Tersimpan, Sakelar Fitur Belum Aktif"
                    : "Gemini API Key Belum Dikonfigurasi"}
                </strong>
                <p className="text-stone-400">
                  {activeGemini
                    ? "Klik 'Generate Rangkuman Harian AI' untuk mendapatkan briefing cerdas berdasarkan pola bisnis Anda: 80% lelang, 90% eks perusahaan, piutang 2 minggu."
                    : keyPresent
                    ? "Kunci API Gemini sudah tersimpan. Klik 'Aktifkan Sakelar Gemini' untuk menyalakan asisten AI."
                    : "Masukkan Gemini API Key gratis di halaman Pengaturan untuk mengaktifkan asisten AI showroom."}
                </p>
              </div>

              {!activeGemini && (
                keyPresent ? (
                  <button
                    onClick={handleQuickEnableGemini}
                    disabled={isEnablingGemini}
                    className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold text-xs shrink-0 shadow-sm cursor-pointer"
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>Aktifkan Sekarang</span>
                  </button>
                ) : (
                  <Link
                    href="/admin/settings"
                    className="inline-flex items-center gap-1.5 bg-[#D97706] text-white px-4 py-2 rounded-xl font-bold text-xs shrink-0 shadow-sm hover:bg-[#B45309]"
                  >
                    <span>Buka Pengaturan API</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )
              )}
            </div>
          )}

          {/* Interactive Q&A Input with AI */}
          {activeGemini && (
            <div className="space-y-3 pt-2">
              <form onSubmit={handleAskAi} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Tanya asisten AI (contoh: 'Ada yang nawarin Avanza 2019 harga 135jt eks perusahaan, aman ambil gak dengan kas sekarang?')"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="flex-1 bg-stone-900/90 border border-stone-700 rounded-xl px-4 py-3 text-xs sm:text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
                />
                <button
                  type="submit"
                  disabled={askingAi || !question.trim()}
                  className="bg-[#D97706] hover:bg-[#B45309] text-white px-5 py-3 rounded-xl font-bold text-xs transition-colors shrink-0 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{askingAi ? "Menganalisa..." : "Tanya AI"}</span>
                </button>
              </form>

              {/* Quick Prompt Presets */}
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-stone-400">
                <span className="font-semibold text-stone-500">Contoh pertanyaan:</span>
                <button
                  type="button"
                  onClick={() =>
                    handlePresetQuestion(
                      "Berapa unit dan segmen apa yang paling aman kita kulakan di lelang hari ini berdasarkan sisa kas BCA?"
                    )
                  }
                  className="bg-stone-800 hover:bg-stone-700 text-stone-300 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  Daya Kulakan Kas Hari Ini
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handlePresetQuestion(
                      "Bagaimana rekomendasi penyesuaian harga dan strategi penjualan untuk mobil yang sudah di atas 30 hari di garasi?"
                    )
                  }
                  className="bg-stone-800 hover:bg-stone-700 text-stone-300 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  Strategi Unit Macet
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handlePresetQuestion(
                      "Ada unit eks tarikan leasing ditawarkan di lelang besok, apa risiko yang perlu saya pertimbangkan soal BPKB dan dokumennya?"
                    )
                  }
                  className="bg-stone-800 hover:bg-stone-700 text-stone-300 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  Risiko Eks Leasing
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handlePresetQuestion(
                      "Piutang saya yang mana yang sudah mendekati 2 minggu dan perlu segera saya tagih hari ini?"
                    )
                  }
                  className="bg-stone-800 hover:bg-stone-700 text-stone-300 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  Piutang Mana Ditagih?
                </button>
              </div>

              {/* Answer Box */}
              {aiAnswer && (
                <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-4 text-xs sm:text-sm text-amber-100 space-y-2 mt-3 animate-in fade-in">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Jawaban AI Advisor (Pola: 80% Lelang, 90% Eks Perusahaan):</span>
                  </div>
                  <div className="whitespace-pre-line leading-relaxed text-stone-200">
                    {aiAnswer}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── ALARM PROAKTIF PIUTANG TEMPO 14 HARI (ACTIONABLE REMINDER) ── */}
      {(() => {
        const urgentReceivables =
          data.pendingReceivables?.filter(
            (r) =>
              r.dueCategory === "OVERDUE" ||
              r.dueCategory === "DUE_TODAY" ||
              r.dueCategory === "DUE_SOON" ||
              r.daysSinceSale >= 10
          ) || [];

        if (urgentReceivables.length === 0) return null;

        const totalUrgentAmount = urgentReceivables.reduce(
          (sum, r) => sum + r.remainingAmount,
          0
        );
        const hasOverdue = urgentReceivables.some((r) => r.dueCategory === "OVERDUE");

        return (
          <div
            className={cn(
              "rounded-2xl p-5 border shadow-sm transition-all relative overflow-hidden",
              hasOverdue
                ? "bg-rose-50/80 border-rose-200"
                : "bg-amber-50/80 border-amber-200"
            )}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200/80">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                    hasOverdue ? "bg-rose-600 text-white" : "bg-amber-600 text-white"
                  )}
                >
                  <BellRing className="w-5 h-5 animate-bounce" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm sm:text-base text-stone-900 tracking-tight">
                      Alarm Piutang Tempo 14 Hari ({urgentReceivables.length} Tagihan Butuh Tindakan)
                    </h3>
                    <span
                      className={cn(
                        "text-[10px] font-bold px-2.5 py-0.5 rounded-full border",
                        hasOverdue
                          ? "bg-rose-100 text-rose-800 border-rose-300"
                          : "bg-amber-100 text-amber-800 border-amber-300"
                      )}
                    >
                      Total: {formatRupiah(totalUrgentAmount)}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 mt-0.5">
                    Data histori menunjukkan pembeli umumnya melunasi dalam 14 hari. Segera konfirmasi dan kirim pengingat ramah via WhatsApp.
                  </p>
                </div>
              </div>

              <Link
                href="/admin/sales"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-700 hover:text-stone-900 bg-white/90 hover:bg-white border border-stone-300 px-3 py-1.5 rounded-xl transition-colors shrink-0 shadow-xs"
              >
                <span>Lihat Semua Penjualan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-4">
              {urgentReceivables.map((r) => {
                const waLink = r.buyerPhone
                  ? generateReceivableReminderLink(r.buyerPhone, {
                      buyerName: r.buyerName,
                      brand: r.vehicleBrand || "Mobil",
                      model: r.vehicleModel || "",
                      plateNumber: r.vehiclePlate,
                      remainingAmount: r.remainingAmount,
                      dueDate: r.dueDate,
                    })
                  : null;

                const isOverdue = r.dueCategory === "OVERDUE";
                const isToday = r.dueCategory === "DUE_TODAY";

                return (
                  <div
                    key={r.id}
                    className="bg-white rounded-xl p-3.5 border border-stone-200 shadow-xs flex flex-col justify-between gap-3 hover:border-amber-400 transition-colors"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-stone-900 truncate">
                          {r.vehiclePlate} · {r.vehicleBrand} {r.vehicleModel}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0",
                            isOverdue
                              ? "bg-red-100 text-red-700"
                              : isToday
                              ? "bg-amber-100 text-amber-800"
                              : "bg-stone-100 text-stone-700"
                          )}
                        >
                          {isOverdue
                            ? `Lewat ${Math.abs(r.daysRemaining)} Hari`
                            : isToday
                            ? "Tempo Hari Ini"
                            : `${r.daysRemaining} Hari Lagi`}
                        </span>
                      </div>

                      <div className="text-xs text-stone-600 flex items-center justify-between">
                        <span>
                          Pembeli: <strong>{r.buyerName}</strong>
                        </span>
                        <span className="text-[11px] text-stone-500">
                          {r.daysSinceSale} hari lalu
                        </span>
                      </div>

                      <div className="bg-stone-50 rounded-lg p-2 flex items-center justify-between border border-stone-100">
                        <span className="text-[11px] text-stone-500 font-medium">Sisa Piutang:</span>
                        <span className="font-black text-sm text-stone-900">
                          {formatRupiah(r.remainingAmount)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-stone-100">
                      {waLink ? (
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3 rounded-lg shadow-xs transition-colors cursor-pointer"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Kirim WA Tagihan (1-Klik)</span>
                        </a>
                      ) : (
                        <span className="flex-1 text-[11px] text-stone-400 italic text-center py-1">
                          No HP belum diisi
                        </span>
                      )}
                      <Link
                        href="/admin/sales"
                        title="Catat Pelunasan"
                        className="p-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* ── 2. FUNNEL STATUS OPERASIONAL & BENGKEL GARASI ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-black text-[#1C1917] tracking-tight">
              Funnel Status Operasional & Workshop Garasi
            </h3>
            <p className="text-xs text-[#6B6560]">
              Monitoring alur fisik unit mulai dari penerimaan, perbaikan cat & salon poles, hingga dokumen siap jual.
            </p>
          </div>
          <Link
            href="/admin/inventory"
            className="text-xs font-bold text-[#D97706] hover:underline flex items-center gap-1"
          >
            <span>Buka Inventori Lengkap</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* 1. Total Unit di Garasi */}
          <div className="bg-white p-4 rounded-2xl border border-[#D9D4CB] shadow-xs space-y-1">
            <div className="flex items-center justify-between text-[#6B6560]">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Di Garasi</span>
              <Car className="w-4 h-4 text-[#D97706]" />
            </div>
            <div className="text-2xl font-black text-[#1C1917] tracking-tight">
              {data.totalActiveVehicles}{" "}
              <span className="text-xs font-semibold text-[#6B6560]">/ {data.garageCapacity}</span>
            </div>
            <div className="w-full bg-[#EFECE8] h-1.5 rounded-full overflow-hidden mt-1">
              <div
                className="bg-[#D97706] h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (data.totalActiveVehicles / data.garageCapacity) * 100)}%`,
                }}
              />
            </div>
            <p className="text-[10px] text-[#6B6560] pt-0.5">{data.emptyGarageSlots} slot kosong</p>
          </div>

          {/* 2. Ready Siap Jual */}
          <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs space-y-1 bg-emerald-50/20">
            <div className="flex items-center justify-between text-emerald-700">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Siap Jual</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-800 tracking-tight">
              {data.readyCount} <span className="text-xs font-semibold text-emerald-600">Unit</span>
            </div>
            <p className="text-[10px] text-emerald-700">Tayang di katalog publik</p>
          </div>

          {/* 3. Belum Salon & Poles */}
          <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs space-y-1 bg-amber-50/20">
            <div className="flex items-center justify-between text-amber-700">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Belum Poles</span>
              <Wrench className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-800 tracking-tight">
              {data.pendingSalonCount} <span className="text-xs font-semibold text-amber-600">Unit</span>
            </div>
            <p className="text-[10px] text-amber-700">Butuh salon & detailing</p>
          </div>

          {/* 4. Sedang / Butuh Cat */}
          <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-xs space-y-1 bg-blue-50/20">
            <div className="flex items-center justify-between text-blue-700">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Perbaikan Cat</span>
              <Layers className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-blue-800 tracking-tight">
              {data.pendingPaintCount} <span className="text-xs font-semibold text-blue-600">Unit</span>
            </div>
            <p className="text-[10px] text-blue-700">Di bengkel body repair</p>
          </div>

          {/* 5. Alarm BPKB Tertahan */}
          <div className="bg-white p-4 rounded-2xl border border-purple-200 shadow-xs space-y-1 bg-purple-50/20">
            <div className="flex items-center justify-between text-purple-700">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">BPKB Tertahan</span>
              <FileText className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-black text-purple-800 tracking-tight">
              {data.pendingBpkbCount} <span className="text-xs font-semibold text-purple-600">Unit</span>
            </div>
            <p className="text-[10px] text-purple-700">Proses leasing/penjual</p>
          </div>

          {/* 6. Unit Macet (>45 Hari) */}
          <div
            className={cn(
              "p-4 rounded-2xl border shadow-xs space-y-1 transition-all",
              data.stagnantCount > 0
                ? "bg-rose-50 border-rose-200 text-rose-800"
                : "bg-white border-[#D9D4CB]"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
                Macet (&gt;45 Hari)
              </span>
              <AlertTriangle
                className={cn(
                  "w-4 h-4",
                  data.stagnantCount > 0 ? "text-rose-600 animate-bounce" : "text-[#6B6560]"
                )}
              />
            </div>
            <div
              className={cn(
                "text-2xl font-black tracking-tight",
                data.stagnantCount > 0 ? "text-rose-800" : "text-[#1C1917]"
              )}
            >
              {data.stagnantCount} <span className="text-xs font-semibold text-[#6B6560]">Unit</span>
            </div>
            <p
              className={cn(
                "text-[10px]",
                data.stagnantCount > 0 ? "text-rose-700 font-bold" : "text-[#6B6560]"
              )}
            >
              {data.stagnantCount > 0 ? "Perlu evaluasi harga" : "Arus perputaran sehat"}
            </p>
          </div>
        </div>
      </div>

      {/* ── 3. AUCTION PIPELINE & CASH FLOW PROJECTION ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ── AUCTION PIPELINE ── */}
        <div className="bg-white rounded-2xl border border-[#D9D4CB] shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-[#D9D4CB] flex items-center gap-3 bg-gradient-to-r from-[#F7F5F2] to-[#FEF3C7]/30">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Gavel className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-[#1C1917]">Auction Pipeline</h3>
              <p className="text-[11px] text-[#6B6560]">
                80% beli lelang · 90% eks perusahaan (BPKB 7-14 hari)
              </p>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* 3 Stat Cards */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-[#F7F5F2] rounded-xl p-3 space-y-1">
                <div className="text-xl font-black text-[#1C1917]">{ap.totalAuctionUnits}</div>
                <div className="text-[10px] text-[#6B6560] font-semibold leading-tight">Unit dari Lelang</div>
              </div>
              <div className="bg-emerald-50 rounded-xl p-3 space-y-1 border border-emerald-200/60">
                <div className="text-xl font-black text-emerald-800">{ap.eksPerusahaanCount}</div>
                <div className="text-[10px] text-emerald-700 font-semibold leading-tight">
                  Eks Perusahaan
                  <br />
                  <span className="font-normal text-emerald-600">(aman)</span>
                </div>
              </div>
              <div
                className={cn(
                  "rounded-xl p-3 space-y-1 border",
                  ap.eksTarikLeasingCount > 0
                    ? "bg-orange-50 border-orange-200/60"
                    : "bg-[#F7F5F2] border-[#D9D4CB]"
                )}
              >
                <div
                  className={cn(
                    "text-xl font-black",
                    ap.eksTarikLeasingCount > 0 ? "text-orange-800" : "text-[#1C1917]"
                  )}
                >
                  {ap.eksTarikLeasingCount}
                </div>
                <div
                  className={cn(
                    "text-[10px] font-semibold leading-tight",
                    ap.eksTarikLeasingCount > 0 ? "text-orange-700" : "text-[#6B6560]"
                  )}
                >
                  Eks Leasing
                  <br />
                  <span className={ap.eksTarikLeasingCount > 0 ? "text-orange-600 font-normal" : "font-normal"}>
                    {ap.eksTarikLeasingCount > 0 ? "(pantau dok.)" : "(nihil)"}
                  </span>
                </div>
              </div>
            </div>

            {/* BPKB Estimasi Tiba */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#1C1917]">
                <CalendarClock className="w-3.5 h-3.5 text-purple-600" />
                <span>BPKB Estimasi Tiba dalam 7 Hari</span>
                <span className="ml-auto text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">
                  {ap.unitsBpkbArrivingSoon.length} Unit
                </span>
              </div>

              {ap.unitsBpkbArrivingSoon.length === 0 ? (
                <div className="text-[11px] text-[#6B6560] text-center py-3 bg-[#F7F5F2] rounded-xl">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                  Tidak ada BPKB yang diperkirakan tiba dalam 7 hari ke depan
                </div>
              ) : (
                <div className="space-y-1.5">
                  {ap.unitsBpkbArrivingSoon.map((u, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex items-center justify-between text-xs rounded-xl px-3 py-2.5 border",
                        u.estimatedBpkbArrivalDays <= 0
                          ? "bg-red-50 border-red-200 text-red-800"
                          : u.estimatedBpkbArrivalDays <= 2
                          ? "bg-orange-50 border-orange-200 text-orange-800"
                          : "bg-purple-50 border-purple-200 text-purple-800"
                      )}
                    >
                      <div>
                        <span className="font-bold">{u.plateNumber}</span>
                        <span className="text-[10px] ml-2 opacity-80">
                          {u.name.length > 25 ? u.name.substring(0, 25) + "..." : u.name}
                        </span>
                        <span className="text-[10px] block opacity-70">
                          {u.auctionLotType === "EKS_PERUSAHAAN" ? "Eks Perusahaan" : "Eks Leasing"}
                        </span>
                      </div>
                      <span className="font-black text-sm whitespace-nowrap">
                        {u.estimatedBpkbArrivalDays <= 0
                          ? "⚠️ Terlambat"
                          : `${u.estimatedBpkbArrivalDays}h lagi`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Info Benchmark */}
            <div className="bg-[#F7F5F2] rounded-xl px-3 py-2 text-[10px] text-[#6B6560] flex gap-4">
              <div className="flex items-center gap-1.5">
                <BadgeCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  <strong>Eks Perusahaan:</strong> BPKB ~7-14 hari
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                <span>
                  <strong>Eks Leasing:</strong> BPKB ~14-28 hari
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── CASH FLOW PROJECTION 14 HARI ── */}
        <div className="bg-white rounded-2xl border border-[#D9D4CB] shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-[#D9D4CB] flex items-center gap-3 bg-gradient-to-r from-[#F7F5F2] to-emerald-50/40">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <BarChart3 className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-[#1C1917]">Proyeksi Arus Kas 14 Hari</h3>
              <p className="text-[11px] text-[#6B6560]">
                70% pembeli bayar lunas dalam 2 minggu · Tagih hari ke-12
              </p>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* Kasflow Overview */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-emerald-50 border border-emerald-200/60 rounded-xl p-3 space-y-1">
                <ArrowUpCircle className="w-4 h-4 text-emerald-600 mx-auto" />
                <div className="text-sm font-black text-emerald-800">
                  {formatRupiah(cf.projectedCashIn14Days)}
                </div>
                <div className="text-[10px] text-emerald-700 font-semibold">Masuk (Est.)</div>
              </div>
              <div className="bg-rose-50 border border-rose-200/60 rounded-xl p-3 space-y-1">
                <ArrowDownCircle className="w-4 h-4 text-rose-500 mx-auto" />
                <div className="text-sm font-black text-rose-800">
                  {formatRupiah(cf.projectedCashOut14Days)}
                </div>
                <div className="text-[10px] text-rose-700 font-semibold">Keluar (Est.)</div>
              </div>
              <div
                className={cn(
                  "rounded-xl p-3 space-y-1 border",
                  netPositive
                    ? "bg-emerald-50 border-emerald-200/60"
                    : "bg-red-50 border-red-200/60"
                )}
              >
                <TrendingUp
                  className={cn("w-4 h-4 mx-auto", netPositive ? "text-emerald-600" : "text-red-500")}
                />
                <div
                  className={cn(
                    "text-sm font-black",
                    netPositive ? "text-emerald-800" : "text-red-800"
                  )}
                >
                  {netPositive ? "+" : ""}
                  {formatRupiah(Math.abs(cf.netCashflow14Days))}
                </div>
                <div
                  className={cn(
                    "text-[10px] font-semibold",
                    netPositive ? "text-emerald-700" : "text-red-700"
                  )}
                >
                  Net Cashflow
                </div>
              </div>
            </div>

            {/* Cash Runway */}
            <div
              className={cn(
                "rounded-xl px-4 py-3 flex items-center justify-between",
                cf.cashRunwayDays > 90
                  ? "bg-emerald-50 border border-emerald-200"
                  : cf.cashRunwayDays > 30
                  ? "bg-amber-50 border border-amber-200"
                  : "bg-red-50 border border-red-200"
              )}
            >
              <div>
                <span className="text-xs font-bold text-[#1C1917]">Cash Runway (tanpa pemasukan)</span>
                <p className="text-[10px] text-[#6B6560] mt-0.5">
                  Dari saldo kas BCA {formatRupiah(data.cashBalance)}
                </p>
              </div>
              <div className="text-right">
                <div
                  className={cn(
                    "text-xl font-black",
                    cf.cashRunwayDays > 90
                      ? "text-emerald-800"
                      : cf.cashRunwayDays > 30
                      ? "text-amber-800"
                      : "text-red-800"
                  )}
                >
                  {cf.cashRunwayDays >= 999 ? "∞" : cf.cashRunwayDays}
                </div>
                <div className="text-[10px] text-[#6B6560]">hari</div>
              </div>
            </div>

            {/* Piutang Mendekati 2 Minggu */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#1C1917]">
                <Receipt className="w-3.5 h-3.5 text-[#D97706]" />
                <span>Piutang Mendekati 2 Minggu (Tagih Sekarang)</span>
              </div>
              {cf.pendingSettlements.filter((p) => p.isLikelyClearingSoon).length === 0 ? (
                <div className="text-[11px] text-[#6B6560] text-center py-3 bg-[#F7F5F2] rounded-xl">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                  Tidak ada piutang yang mendekati 2 minggu
                </div>
              ) : (
                <div className="space-y-1.5">
                  {cf.pendingSettlements
                    .filter((p) => p.isLikelyClearingSoon)
                    .slice(0, 4)
                    .map((p, i) => {
                      const matchRec = data.pendingReceivables?.find(
                        (r) => r.vehiclePlate === p.vehiclePlate
                      );
                      const waLink = matchRec?.buyerPhone
                        ? generateReceivableReminderLink(matchRec.buyerPhone, {
                            buyerName: matchRec.buyerName,
                            brand: matchRec.vehicleBrand || "Mobil",
                            model: matchRec.vehicleModel || "",
                            plateNumber: matchRec.vehiclePlate,
                            remainingAmount: p.amount,
                            dueDate: matchRec.dueDate,
                          })
                        : null;

                      return (
                        <div
                          key={i}
                          className="flex items-center justify-between bg-amber-50 border border-amber-200/60 rounded-xl px-3 py-2 text-xs gap-2"
                        >
                          <div className="truncate">
                            <span className="font-bold text-[#1C1917]">{p.vehiclePlate}</span>
                            <span className="text-[10px] text-[#6B6560] ml-1.5">{p.buyerName}</span>
                            <span className="text-[10px] text-amber-700 ml-1.5 font-semibold">
                              · {p.daysSinceSale} hari lalu
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-black text-amber-800 whitespace-nowrap">
                              {formatRupiah(p.amount)}
                            </span>
                            {waLink && (
                              <a
                                href={waLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Kirim WA Tagihan"
                                className="p-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Burn Rate Info */}
            <div className="bg-[#F7F5F2] rounded-xl px-3 py-2 text-[10px] text-[#6B6560] flex items-center justify-between">
              <span>Biaya Operasional Bulanan (avg 3 bln):</span>
              <span className="font-bold text-[#1C1917]">
                {formatRupiah(cf.monthlyOperationalBurn)} / bln
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. KALKULATOR DAYA BELI KAS (BUYING POWER & RUNWAY KULAKAN) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Card Ringkasan Arus Kas */}
        <div className="bg-white rounded-2xl border border-[#D9D4CB] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between text-[#6B6560]">
            <span className="text-xs font-bold uppercase tracking-wider">Saldo Kas Rekening BCA</span>
            <Wallet className="w-5 h-5 text-[#D97706]" />
          </div>
          <div>
            <div className="text-3xl font-black text-[#1C1917] tracking-tight">
              {formatRupiah(data.cashBalance)}
            </div>
            <p className="text-xs text-emerald-700 font-medium mt-1">Kas riil on-hand di rekening bank BCA</p>
          </div>

          <div className="pt-3 border-t border-[#EBE7E1] space-y-2 text-xs">
            <div className="flex justify-between text-[#6B6560]">
              <span>Total Modal Terikat di Stok (HPP):</span>
              <span className="font-bold text-[#1C1917]">{formatRupiah(data.totalInventoryHpp)}</span>
            </div>
            <div className="flex justify-between text-[#6B6560]">
              <span>Cadangan Kas Operasional (Aman):</span>
              <span className="font-bold text-amber-700">
                {formatRupiah(data.buyingPowerRecommendation.reserveFund)}
              </span>
            </div>
            <div className="flex justify-between text-[#6B6560]">
              <span>Dana Maksimal Kulakan Baru:</span>
              <span className="font-black text-emerald-700 text-sm">
                {formatRupiah(data.buyingPowerRecommendation.recommendedBudget)}
              </span>
            </div>
          </div>
        </div>

        {/* Card Rekomendasi Keputusan Kulakan */}
        <div className="lg:col-span-2 bg-gradient-to-br from-amber-50/60 to-orange-50/40 border border-amber-200 rounded-2xl p-6 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#92400E]">
              <Coins className="w-5 h-5 text-[#D97706]" />
              <h4 className="font-extrabold text-sm uppercase tracking-wider text-[#78350F]">
                Rekomendasi Keputusan Kulakan Unit Baru
              </h4>
            </div>

            <p className="text-xs text-[#92400E] leading-relaxed">
              {data.buyingPowerRecommendation.advice}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="bg-white/90 p-3.5 rounded-xl border border-amber-200/80 space-y-1">
              <span className="text-[10px] font-bold uppercase text-[#6B6560] block">Rekomendasi Jumlah Unit:</span>
              <span className="text-lg font-black text-[#1C1917]">
                {data.buyingPowerRecommendation.recommendedUnits > 0
                  ? `Beli ${data.buyingPowerRecommendation.recommendedUnits} Mobil`
                  : "Tunda Kulakan"}
              </span>
              <span className="text-[11px] text-[#6B6560] block">
                {data.emptyGarageSlots} slot garasi masih tersedia
              </span>
            </div>

            <div className="bg-white/90 p-3.5 rounded-xl border border-amber-200/80 space-y-1">
              <span className="text-[10px] font-bold uppercase text-[#6B6560] block">Target Segmen Disarankan:</span>
              <span className="text-xs font-bold text-[#1C1917] block truncate">
                {data.buyingPowerRecommendation.targetSegment}
              </span>
              <span className="text-[11px] text-emerald-700 font-semibold block">
                Fokus perputaran &lt; 20 hari
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. DAFTAR PERHATIAN MENDESAK HARI INI (ACTION ITEMS) ── */}
      <div className="bg-white rounded-2xl border border-[#D9D4CB] shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#D9D4CB] flex items-center justify-between bg-[#F7F5F2]">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#D97706]" />
            <h3 className="font-bold text-sm text-[#1C1917]">
              Mobil Perlu Perhatian Mendesak (BPKB Belum Datang / Mendekati Macet)
            </h3>
          </div>
          <span className="text-xs text-[#6B6560] font-semibold">{data.urgentVehicles.length} Unit</span>
        </div>

        {data.urgentVehicles.length === 0 ? (
          <div className="p-8 text-center text-[#6B6560] text-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
            Semua unit dalam kondisi aman. Tidak ada BPKB tertahan atau unit macet kritis.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#EFECE8] text-[#6B6560] uppercase text-[10px] sm:text-[11px] font-bold tracking-wider border-b border-[#D9D4CB]">
                <tr>
                  <th className="py-3 px-4">Plat & Unit</th>
                  <th className="py-3 px-4">Umur di Garasi</th>
                  <th className="py-3 px-4">Status & Isu Utama</th>
                  <th className="py-3 px-4 text-right">HPP</th>
                  <th className="py-3 px-4 text-right">Target Harga</th>
                  <th className="py-3 px-4 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9D4CB]">
                {data.urgentVehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-[#F7F5F2] transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-[#1C1917] block">{v.plateNumber}</span>
                      <span className="text-xs text-[#6B6560]">{v.name}</span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 font-bold text-xs",
                          v.days > 45 ? "text-rose-700" : "text-amber-700"
                        )}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        {v.days} Hari
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-xs text-[#1C1917] font-medium block">{v.urgentReason}</span>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap font-medium text-[#6B6560]">
                      {formatRupiah(v.hpp)}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap font-black text-[#1C1917]">
                      {formatRupiah(v.targetPrice)}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Link
                        href={`/admin/inventory`}
                        className="inline-flex items-center gap-1 text-xs text-[#D97706] hover:underline font-bold"
                      >
                        <span>Kelola Unit</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 6. BUSINESS PATTERN ANALYTICS — dari data nyata yang diinput user ── */}
      <div className="bg-white rounded-2xl border border-[#D9D4CB] shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#D9D4CB] flex items-center justify-between bg-gradient-to-r from-[#F7F5F2] to-blue-50/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <BarChart3 className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-[#1C1917]">Analisa Pola Bisnis Nyata</h3>
              <p className="text-[11px] text-[#6B6560]">
                Dihitung langsung dari semua data yang Anda input — bukan asumsi
              </p>
            </div>
          </div>
          <span
            className={cn(
              "text-[10px] font-bold px-2.5 py-1 rounded-full border",
              data.businessPatterns.totalHistoricalVehicles >= 5
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-amber-50 text-amber-700 border-amber-200"
            )}
          >
            {data.businessPatterns.dataQualityNote.startsWith("✅") ? "✅ Data Andal" : "⚠️ Butuh Lebih Banyak Data"}
          </span>
        </div>

        <div className="p-5 space-y-5">
          {/* Data Quality Note */}
          <div className="text-xs text-[#6B6560] bg-[#F7F5F2] rounded-xl px-4 py-3 leading-relaxed">
            {data.businessPatterns.dataQualityNote}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Siklus Rata-rata */}
            <div className="bg-[#F7F5F2] rounded-xl p-4 space-y-1">
              <div className="text-[10px] font-bold text-[#6B6560] uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3" /> Siklus Rata-rata
              </div>
              <div className="text-2xl font-black text-[#1C1917]">
                {data.businessPatterns.avgTotalCycleDays > 0 ? data.businessPatterns.avgTotalCycleDays : "-"}
              </div>
              <div className="text-[11px] text-[#6B6560]">hari beli → terjual</div>
              {data.businessPatterns.avgTotalCycleDays > 0 && (
                <div className="text-[10px] text-emerald-700">
                  Intake→Siap: ~{data.businessPatterns.avgDaysIntakeToReady}h | Siap→Jual: ~{data.businessPatterns.avgDaysReadyToSold}h
                </div>
              )}
            </div>

            {/* Rata-rata Payment Lag */}
            <div className="bg-[#F7F5F2] rounded-xl p-4 space-y-1">
              <div className="text-[10px] font-bold text-[#6B6560] uppercase tracking-wider flex items-center gap-1">
                <Receipt className="w-3 h-3" /> Payment Lag Nyata
              </div>
              <div className="text-2xl font-black text-[#1C1917]">
                {data.businessPatterns.avgPaymentLagDays > 0 ? data.businessPatterns.avgPaymentLagDays : "-"}
              </div>
              <div className="text-[11px] text-[#6B6560]">hari rata-rata lunas</div>
              {data.businessPatterns.avgPaymentLagDays > 0 && (
                <div className="text-[10px] text-blue-700">
                  {data.businessPatterns.pctPaidWithin14Days}% lunas dalam 14 hari · {data.businessPatterns.pctPaidWithin7Days}% dalam 7 hari
                </div>
              )}
            </div>

            {/* Rata-rata Margin */}
            <div className="bg-[#F7F5F2] rounded-xl p-4 space-y-1">
              <div className="text-[10px] font-bold text-[#6B6560] uppercase tracking-wider flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Avg Margin / Unit
              </div>
              <div className="text-2xl font-black text-emerald-800">
                {data.businessPatterns.avgGrossMarginRupiah > 0
                  ? formatRupiah(data.businessPatterns.avgGrossMarginRupiah)
                  : "-"}
              </div>
              <div className="text-[11px] text-[#6B6560]">
                {data.businessPatterns.avgGrossMarginPct > 0 ? `${data.businessPatterns.avgGrossMarginPct}% margin kotor` : "belum ada data"}
              </div>
            </div>

            {/* % dari Lelang */}
            <div className="bg-[#F7F5F2] rounded-xl p-4 space-y-1">
              <div className="text-[10px] font-bold text-[#6B6560] uppercase tracking-wider flex items-center gap-1">
                <Gavel className="w-3 h-3" /> % Beli dari Lelang
              </div>
              <div className="text-2xl font-black text-amber-800">
                {data.businessPatterns.totalHistoricalVehicles > 0 ? `${data.businessPatterns.pctFromAuction}%` : "-"}
              </div>
              <div className="text-[11px] text-[#6B6560]">
                {data.businessPatterns.pctEksPerusahaan > 0
                  ? `${data.businessPatterns.pctEksPerusahaan}% eks perusahaan`
                  : "dari total unit historis"}
              </div>
            </div>
          </div>

          {/* Baris kedua: Top Balai Lelang + Unit Tercepat Laku + Merk Terlaris */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Balai lelang favorit dari data nyata */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-[#1C1917] flex items-center gap-1.5">
                <Gavel className="w-3.5 h-3.5 text-amber-600" />
                Balai Lelang Favorit (Data Nyata)
              </div>
              {data.businessPatterns.topAuctionHouses.length === 0 ? (
                <p className="text-[11px] text-[#6B6560] italic">Belum ada data balai lelang tercatat</p>
              ) : (
                <div className="space-y-1">
                  {data.businessPatterns.topAuctionHouses.map((h, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-[#1C1917] font-medium">{h.name}</span>
                      <span className="text-[#6B6560]">{h.count}x ({h.pct}%)</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Unit tercepat laku */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-[#1C1917] flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                Unit Tercepat Laku (Histori)
              </div>
              {data.businessPatterns.fastestSegments.length === 0 ? (
                <p className="text-[11px] text-[#6B6560] italic">Belum ada data penjualan cukup</p>
              ) : (
                <div className="space-y-1">
                  {data.businessPatterns.fastestSegments.slice(0, 4).map((s, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-[#1C1917] font-medium">{s.brandModel}</span>
                      <span className="text-emerald-700 font-bold">{s.avgDays} hari</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Merk paling menguntungkan */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-[#1C1917] flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-blue-600" />
                Margin Terbaik per Merk
              </div>
              {data.businessPatterns.mostProfitableBrands.length === 0 ? (
                <p className="text-[11px] text-[#6B6560] italic">Belum ada data penjualan cukup</p>
              ) : (
                <div className="space-y-1">
                  {data.businessPatterns.mostProfitableBrands.slice(0, 4).map((b, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-[#1C1917] font-medium">{b.brand}</span>
                      <span className="text-blue-700 font-bold">{formatRupiah(b.avgMargin)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

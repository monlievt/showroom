"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Car,
  ReceiptText,
  Wallet,
  Clock,
  AlertTriangle,
  MessageCircle,
  ExternalLink,
  ChevronDown,
  RefreshCw,
  Send,
  Wrench,
  CheckCircle2,
  FileText,
} from "lucide-react";
import {
  formatRupiah,
  cn,
  normalizePlateNumber,
  formatVehicleTitle,
} from "@/lib/utils";
import { generateReceivableReminderLink } from "@/lib/utils/whatsapp";
import {
  DashboardOperationalData,
  ExecutiveAiOrchestration,
  generateExecutiveAiBriefing,
  askAiShowroomAdvisor,
} from "@/app/actions/ai-assistant";

interface DashboardClientProps {
  initialData: DashboardOperationalData;
  initialOrchestration?: ExecutiveAiOrchestration;
  hasGeminiKey: boolean;
  geminiKeySet?: boolean;
  geminiEnabled?: boolean;
}

export function DashboardClient({
  initialData,
  initialOrchestration,
  hasGeminiKey,
}: DashboardClientProps) {
  const data = initialData;

  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [orchestration, setOrchestration] = useState<ExecutiveAiOrchestration | undefined>(
    initialOrchestration
  );
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [askingAi, setAskingAi] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);

  const totalPiutang = data.pendingReceivables.reduce(
    (sum, item) => sum + item.remainingAmount,
    0
  );
  const totalInProgress = data.intakeCount + data.inRepairCount;
  const criticalTaxUnits = data.taxAlertSummary?.criticalUnits || [];
  const waitingBpkbUnits = data.auctionPipeline?.unitsBpkbArrivingSoon || [];

  const handleGenerateBriefing = async () => {
    setBriefingLoading(true);
    setAiError(null);
    const res = await generateExecutiveAiBriefing();
    setBriefingLoading(false);
    if (res.success && res.orchestration) {
      setOrchestration(res.orchestration);
    } else if (res.error) {
      setAiError(res.error || "Gagal memuat ringkasan AI.");
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
      setAiError(res.error || "Gagal menghubungi asisten AI.");
    }
  };

  return (
    <div className="space-y-6">
      {/* ── 1. AKSI CEPAT HARIAN (1-TAP DI HP) ── */}
      <section aria-label="Aksi cepat harian" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          href="/admin/inventory/new"
          className="flex items-center justify-center sm:justify-start gap-3 px-4 py-3.5 min-h-[54px] rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold text-sm shadow-xs transition-colors active:scale-[0.99]"
        >
          <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
            <Plus className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="leading-tight">Catat Unit Masuk</div>
            <div className="text-[11px] font-normal text-white/80">
              Input beli &amp; tayang web
            </div>
          </div>
        </Link>

        <Link
          href="/admin/sales/new"
          className="flex items-center justify-center sm:justify-start gap-3 px-4 py-3.5 min-h-[54px] rounded-xl bg-[var(--ok)] hover:opacity-95 text-white font-bold text-sm shadow-xs transition-opacity active:scale-[0.99]"
        >
          <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
            <ReceiptText className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="leading-tight">Catat Penjualan</div>
            <div className="text-[11px] font-normal text-white/85">
              Jual lunas atau tempo
            </div>
          </div>
        </Link>

        <Link
          href="/admin/finance/cash/new"
          className="flex items-center justify-center sm:justify-start gap-3 px-4 py-3.5 min-h-[54px] rounded-xl bg-[var(--surface)] hover:bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)] font-bold text-sm shadow-xs transition-colors active:scale-[0.99]"
        >
          <div className="w-8 h-8 rounded-lg bg-[var(--bg)] border border-[var(--line)] flex items-center justify-center shrink-0">
            <Wallet className="w-4 h-4 text-[var(--accent)]" />
          </div>
          <div className="text-left">
            <div className="leading-tight">Catat Kas Masuk / Keluar</div>
            <div className="text-[11px] font-normal text-[var(--muted)]">
              Setor modal atau operasional
            </div>
          </div>
        </Link>
      </section>

      {/* ── 2. RINGKASAN 4 ANGKA UTAMA ── */}
      <section aria-label="Ringkasan utama" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Link
          href="/admin/inventory?status=READY_FOR_SALE"
          className="bg-[var(--surface)] border border-[var(--line)] hover:border-[var(--accent)] rounded-xl p-4 transition-colors block"
        >
          <div className="flex items-center justify-between gap-2 text-[var(--muted)]">
            <span className="text-xs font-semibold">Siap Jual (Web)</span>
            <Car className="w-4 h-4 text-[var(--ok)] shrink-0" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-[var(--ink)]">
              {data.readyCount}
            </span>
            <span className="text-xs text-[var(--muted)]">unit</span>
          </div>
          <div className="text-[11px] text-[var(--accent)] font-semibold mt-1">
            Lihat stok &rsaquo;
          </div>
        </Link>

        <Link
          href="/admin/sales"
          className="bg-[var(--surface)] border border-[var(--line)] hover:border-[var(--accent)] rounded-xl p-4 transition-colors block"
        >
          <div className="flex items-center justify-between gap-2 text-[var(--muted)]">
            <span className="text-xs font-semibold">Belum Lunas</span>
            <Clock className="w-4 h-4 text-[var(--warn)] shrink-0" />
          </div>
          <div className="mt-2 text-lg sm:text-xl font-extrabold text-[var(--ink)] truncate">
            {formatRupiah(totalPiutang)}
          </div>
          <div className="text-[11px] text-[var(--muted)] mt-1">
            {data.pendingReceivables.length} unit masih tempo
          </div>
        </Link>

        <Link
          href="/admin/finance"
          className="bg-[var(--surface)] border border-[var(--line)] hover:border-[var(--accent)] rounded-xl p-4 transition-colors block"
        >
          <div className="flex items-center justify-between gap-2 text-[var(--muted)]">
            <span className="text-xs font-semibold">Saldo Kas</span>
            <Wallet className="w-4 h-4 text-[var(--accent)] shrink-0" />
          </div>
          <div
            className={cn(
              "mt-2 text-lg sm:text-xl font-extrabold truncate",
              data.cashBalance < 0 ? "text-[var(--bad)]" : "text-[var(--ink)]"
            )}
          >
            {formatRupiah(data.cashBalance)}
          </div>
          <div className="text-[11px] text-[var(--muted)] mt-1">
            Lihat buku kas &rsaquo;
          </div>
        </Link>

        <Link
          href="/admin/inventory"
          className="bg-[var(--surface)] border border-[var(--line)] hover:border-[var(--accent)] rounded-xl p-4 transition-colors block"
        >
          <div className="flex items-center justify-between gap-2 text-[var(--muted)]">
            <span className="text-xs font-semibold">Baru / Bengkel</span>
            <Wrench className="w-4 h-4 text-[var(--muted)] shrink-0" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-[var(--ink)]">
              {totalInProgress}
            </span>
            <span className="text-xs text-[var(--muted)]">unit</span>
          </div>
          <div className="text-[11px] text-[var(--muted)] mt-1">
            Total stok aktif: {data.totalActiveVehicles} unit
          </div>
        </Link>
      </section>

      {/* ── 3. TAGIHAN TEMPO YANG BELUM LUNAS ── */}
      <section className="bg-[var(--surface)] border border-[var(--line)] rounded-xl overflow-hidden">
        <div className="px-4 sm:px-5 py-3.5 border-b border-[var(--line)] flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-[var(--ink)]">
              Tagihan Belum Lunas ({data.pendingReceivables.length})
            </h2>
            <p className="text-xs text-[var(--muted)]">
              Catat pelunasan atau kirim pengingat lewat WhatsApp.
            </p>
          </div>
          <Link
            href="/admin/sales"
            className="text-xs font-semibold text-[var(--accent)] hover:underline shrink-0"
          >
            Lihat semua
          </Link>
        </div>

        {data.pendingReceivables.length === 0 ? (
          <div className="p-5 flex items-center gap-3 text-sm text-[var(--muted)]">
            <CheckCircle2 className="w-5 h-5 text-[var(--ok)] shrink-0" />
            <span>Semua transaksi penjualan sudah lunas. Tidak ada tagihan tertunggak.</span>
          </div>
        ) : (
          <div className="divide-y divide-[var(--line)]">
            {data.pendingReceivables.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-[var(--ink)]">
                      {normalizePlateNumber(item.vehiclePlate)}
                    </span>
                    <span className="text-xs text-[var(--muted)]">
                      {formatVehicleTitle(item.vehicleBrand, item.vehicleModel)}
                    </span>
                    {item.dueCategory === "OVERDUE" && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[var(--bad-light)] text-[var(--bad)]">
                        Lewat tempo
                      </span>
                    )}
                    {(item.dueCategory === "DUE_TODAY" || item.dueCategory === "DUE_SOON") && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[var(--warn-light)] text-amber-800">
                        Segera jatuh tempo
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[var(--muted)] mt-1">
                    Pembeli: <strong className="text-[var(--ink)]">{item.buyerName}</strong>
                    {" • "}
                    Sisa:{" "}
                    <strong className="text-[var(--bad)]">
                      {formatRupiah(item.remainingAmount)}
                    </strong>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.buyerPhone && (
                    <a
                      href={generateReceivableReminderLink(item.buyerPhone, {
                        buyerName: item.buyerName,
                        brand: item.vehicleBrand,
                        model: item.vehicleModel,
                        plateNumber: normalizePlateNumber(item.vehiclePlate),
                        remainingAmount: item.remainingAmount,
                        dueDate: item.dueDate || null,
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 min-h-[44px] rounded-lg border border-[var(--line)] bg-[var(--bg)] hover:bg-[var(--line)]/50 text-xs font-semibold text-[var(--ink)]"
                    >
                      <MessageCircle className="w-4 h-4 text-[var(--ok)]" />
                      <span>WA Tagih</span>
                    </a>
                  )}
                  <Link
                    href={`/admin/sales/${item.id}/payment`}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold"
                  >
                    <span>Terima Bayar</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── 4. PENGINGAT PAJAK & BPKB (HANYA TAMPIL JIKA ADA YANG PERLU DICEK) ── */}
      {(criticalTaxUnits.length > 0 || waitingBpkbUnits.length > 0) && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {criticalTaxUnits.length > 0 && (
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--line)] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[var(--bad)] shrink-0" />
                <h3 className="text-sm font-bold text-[var(--ink)]">
                  Pajak STNK Mati / Mepet ({criticalTaxUnits.length})
                </h3>
              </div>
              <div className="divide-y divide-[var(--line)]">
                {criticalTaxUnits.slice(0, 4).map((u) => (
                  <Link
                    key={u.id}
                    href={`/admin/inventory/${u.id}`}
                    className="p-3.5 flex items-center justify-between gap-3 hover:bg-[var(--bg)] transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-[var(--ink)] truncate">
                        {normalizePlateNumber(u.plateNumber)}
                      </div>
                      <div className="text-xs text-[var(--muted)] truncate">
                        {formatVehicleTitle(u.brand, u.model, u.year)}
                      </div>
                    </div>
                    <span
                      className={cn(
                        "text-xs font-bold px-2.5 py-1 rounded shrink-0",
                        u.status === "OVERDUE"
                          ? "bg-[var(--bad-light)] text-[var(--bad)]"
                          : "bg-[var(--warn-light)] text-amber-800"
                      )}
                    >
                      {u.daysRemaining < 0
                        ? `Mati ${Math.abs(u.daysRemaining)} hari`
                        : `Sisa ${u.daysRemaining} hari`}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {waitingBpkbUnits.length > 0 && (
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--line)] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[var(--accent)] shrink-0" />
                <h3 className="text-sm font-bold text-[var(--ink)]">
                  BPKB Masih Menunggu ({waitingBpkbUnits.length})
                </h3>
              </div>
              <div className="divide-y divide-[var(--line)]">
                {waitingBpkbUnits.slice(0, 4).map((u) => (
                  <div
                    key={u.plateNumber}
                    className="p-3.5 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-[var(--ink)] truncate">
                        {normalizePlateNumber(u.plateNumber)}
                      </div>
                      <div className="text-xs text-[var(--muted)] truncate">{u.name}</div>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)] shrink-0">
                      {u.estimatedBpkbArrivalDays <= 0
                        ? "Sudah waktunya ambil"
                        : `± ${u.estimatedBpkbArrivalDays} hari lagi`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── 5. PINTASAN KATALOG WEB PUBLIK ── */}
      <section className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-sm font-bold text-[var(--ink)]">
            Katalog Web Publik Nur Mobil
          </div>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            Semua unit berstatus Siap Jual otomatis tampil di website agar mudah dibagikan ke pembeli.
          </p>
        </div>
        <Link
          href="/katalog"
          target="_blank"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg border border-[var(--line)] bg-[var(--bg)] hover:bg-[var(--line)]/50 text-xs font-bold text-[var(--ink)] shrink-0"
        >
          <ExternalLink className="w-4 h-4 text-[var(--accent)]" />
          <span>Buka Katalog Web</span>
        </Link>
      </section>

      {/* ── 6. ASISTEN AI & ANALISA LANJUTAN (DILIPAT / OPSIONAL) ── */}
      <section className="bg-[var(--surface)] border border-[var(--line)] rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setAiPanelOpen((prev) => !prev)}
          className="w-full px-4 sm:px-5 py-3.5 min-h-[52px] flex items-center justify-between gap-3 text-left hover:bg-[var(--bg)] transition-colors cursor-pointer"
        >
          <div>
            <div className="text-sm font-bold text-[var(--ink)]">
              Analisa Lanjutan &amp; Asisten AI (Opsional)
            </div>
            <div className="text-xs text-[var(--muted)]">
              Buka jika ingin melihat saran kulakan atau bertanya ke asisten AI.
            </div>
          </div>
          <ChevronDown
            className={cn(
              "w-5 h-5 text-[var(--muted)] transition-transform duration-200 shrink-0",
              aiPanelOpen && "rotate-180"
            )}
          />
        </button>

        {aiPanelOpen && (
          <div className="p-4 sm:p-5 border-t border-[var(--line)] space-y-4 bg-[var(--bg)]/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-[var(--muted)]">
                {orchestration?.headline || "Klik tombol di samping untuk memuat analisa kondisi stok & kas."}
              </div>
              <button
                type="button"
                onClick={handleGenerateBriefing}
                disabled={briefingLoading || !hasGeminiKey}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold disabled:opacity-50 cursor-pointer shrink-0"
              >
                <RefreshCw className={cn("w-4 h-4", briefingLoading && "animate-spin")} />
                <span>{briefingLoading ? "Memuat analisa..." : "Muat Analisa AI"}</span>
              </button>
            </div>

            {!hasGeminiKey && (
              <div className="text-xs text-[var(--muted)] bg-white border border-[var(--line)] rounded-lg p-3">
                Kunci API Gemini belum diaktifkan. Anda bisa mengaturnya di menu{" "}
                <Link href="/admin/settings" className="text-[var(--accent)] font-semibold underline">
                  Pengaturan &amp; Notifikasi
                </Link>
                .
              </div>
            )}

            {aiError && (
              <div className="p-3 rounded-lg bg-[var(--bad-light)] border border-[var(--bad)]/30 text-xs text-[var(--bad)] font-medium">
                {aiError}
              </div>
            )}

            {orchestration?.executiveSummary && (
              <div className="p-4 rounded-lg bg-white border border-[var(--line)] text-xs sm:text-sm text-[var(--ink)] leading-relaxed whitespace-pre-line">
                {orchestration.executiveSummary}
              </div>
            )}

            <form onSubmit={handleAskAi} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Tanya tentang stok, kas, atau saran harga jual..."
                className="flex-1 px-3.5 py-2.5 min-h-[44px] bg-white border border-[var(--line)] rounded-lg text-sm text-[var(--ink)]"
              />
              <button
                type="submit"
                disabled={askingAi || !question.trim() || !hasGeminiKey}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg bg-[var(--ink)] text-white text-xs font-bold disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{askingAi ? "Mengirim..." : "Tanya AI"}</span>
              </button>
            </form>

            {aiAnswer && (
              <div className="p-4 rounded-lg bg-white border border-[var(--line)] text-xs sm:text-sm text-[var(--ink)] leading-relaxed whitespace-pre-line">
                {aiAnswer}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

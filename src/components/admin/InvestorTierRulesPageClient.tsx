"use client";

import React, { useState } from "react";
import {
  Sliders,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Calculator,
  Building,
  Users,
  TrendingUp,
  Sparkles,
  Edit3,
  RotateCcw,
  Save,
  X,
  Info,
  Plus,
  Trash2,
  ShieldCheck,
  TrendingDown
} from "lucide-react";
import { formatRupiah, cn } from "@/lib/utils";
import { saveProfitShareRules } from "@/app/actions/profit-share-rule";
import { InvestorSubNav } from "./InvestorSubNav";

interface ProfitRuleItem {
  id?: string;
  tier?: number;
  name: string;
  beneficiaryGroup?: string;
  minProfit: number;
  maxProfit: number | null;
  amountPerPerson: number;
  numberOfPeople: number;
  active?: boolean;
}

interface TierRulesProps {
  profitRules: ProfitRuleItem[];
  pendingCount: number;
  totalInvestorsCount: number;
  totalHistoryCount: number;
}

const DEFAULT_STANDARD_RULES: ProfitRuleItem[] = [
  {
    name: "Laba Rendah (Rp 0 - Rp 1.000.000)",
    beneficiaryGroup: "MOTHER_SIBLING",
    minProfit: 0,
    maxProfit: 1000000,
    amountPerPerson: 100000,
    numberOfPeople: 4,
  },
  {
    name: "Laba Ringan (Rp 1.000.000 - Rp 2.500.000)",
    beneficiaryGroup: "MOTHER_SIBLING",
    minProfit: 1000000,
    maxProfit: 2500000,
    amountPerPerson: 175000,
    numberOfPeople: 4,
  },
  {
    name: "Laba Wajar (Rp 2.500.000 - Rp 5.000.000)",
    beneficiaryGroup: "MOTHER_SIBLING",
    minProfit: 2500000,
    maxProfit: 5000000,
    amountPerPerson: 250000,
    numberOfPeople: 4,
  },
  {
    name: "Laba Menengah (Rp 5.000.000 - Rp 7.500.000)",
    beneficiaryGroup: "MOTHER_SIBLING",
    minProfit: 5000000,
    maxProfit: 7500000,
    amountPerPerson: 500000,
    numberOfPeople: 4,
  },
  {
    name: "Laba Tinggi (Rp 7.500.000 - Rp 10.000.000)",
    beneficiaryGroup: "MOTHER_SIBLING",
    minProfit: 7500000,
    maxProfit: 10000000,
    amountPerPerson: 750000,
    numberOfPeople: 4,
  },
  {
    name: "Laba Sangat Tinggi (Rp 10.000.000 - Rp 20.000.000)",
    beneficiaryGroup: "MOTHER_SIBLING",
    minProfit: 10000000,
    maxProfit: 20000000,
    amountPerPerson: 1000000,
    numberOfPeople: 4,
  },
  {
    name: "Laba Istimewa (> Rp 20.000.000)",
    beneficiaryGroup: "MOTHER_SIBLING",
    minProfit: 20000000,
    maxProfit: null,
    amountPerPerson: 2000000,
    numberOfPeople: 4,
  },
];

export function InvestorTierRulesPageClient({
  profitRules,
  pendingCount,
  totalInvestorsCount,
  totalHistoryCount,
}: TierRulesProps) {
  const initialRules = profitRules && profitRules.length > 0 ? profitRules : DEFAULT_STANDARD_RULES;
  const [editableRules, setEditableRules] = useState<ProfitRuleItem[]>(initialRules);
  const [isEditing, setIsEditing] = useState(false);
  const [ruleError, setRuleError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Simulation State (bisa angka positif maupun minus/rugi)
  const [simulationProfit, setSimulationProfit] = useState("15000000");

  const showNotification = (message: string, type: "success" | "error") => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 6000);
  };

  const handleRuleChange = (
    index: number,
    field: keyof ProfitRuleItem,
    value: any
  ) => {
    const updated = [...editableRules];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };

    // Auto sync boundary: jika maxProfit tier [i] diubah, sync minProfit tier [i+1]
    if (field === "maxProfit" && index < updated.length - 1 && value !== null) {
      updated[index + 1] = {
        ...updated[index + 1],
        minProfit: Number(value),
      };
    }

    setEditableRules(updated);
  };

  // Tambah Tier Baru di atas tier terakhir
  const handleAddNewTier = () => {
    const updated = [...editableRules];
    const lastIdx = updated.length - 1;
    const currentLast = updated[lastIdx];

    const splitPoint = currentLast.minProfit + 5000000;
    
    // Tier sebelumnya diberi batas atas
    updated[lastIdx] = {
      ...currentLast,
      name: `Tier ${updated.length} (${formatRupiah(currentLast.minProfit)} - ${formatRupiah(splitPoint)})`,
      maxProfit: splitPoint,
    };

    // Tier baru tanpa batas atas
    updated.push({
      name: `Tier ${updated.length + 1} (> ${formatRupiah(splitPoint)})`,
      beneficiaryGroup: "MOTHER_SIBLING",
      minProfit: splitPoint,
      maxProfit: null,
      amountPerPerson: currentLast.amountPerPerson + 250000,
      numberOfPeople: currentLast.numberOfPeople || 4,
    });

    setEditableRules(updated);
  };

  // Hapus Tier dengan penyambungan otomatis batas tier (auto re-chain)
  const handleDeleteTier = (indexToDelete: number) => {
    if (editableRules.length <= 1) {
      setRuleError("Minimal harus ada 1 tingkatan aturan bagi hasil");
      return;
    }

    let updated = editableRules.filter((_, idx) => idx !== indexToDelete);

    // Sambungkan kontinuitas
    if (indexToDelete === 0) {
      // Jika hapus tier pertama, tier baru pertama mulai dari 0
      updated[0] = { ...updated[0], minProfit: 0 };
    } else if (indexToDelete === editableRules.length - 1) {
      // Jika hapus tier terakhir, tier baru terakhir jadi tak terbatas (maxProfit null)
      const newLastIdx = updated.length - 1;
      updated[newLastIdx] = { ...updated[newLastIdx], maxProfit: null };
    } else {
      // Jika hapus tier tengah, hubungkan tier sebelumnya ke tier berikutnya
      const prevIdx = indexToDelete - 1;
      const nextIdx = indexToDelete; // karena sudah ter-filter
      updated[prevIdx] = { ...updated[prevIdx], maxProfit: updated[nextIdx].minProfit };
    }

    setEditableRules(updated);
  };

  const handleResetToStandard = () => {
    setEditableRules(DEFAULT_STANDARD_RULES);
    setRuleError(null);
  };

  const handleCancelEdit = () => {
    setEditableRules(initialRules);
    setIsEditing(false);
    setRuleError(null);
  };

  // Validasi kontinuitas tier
  const checkContiguity = () => {
    for (let i = 0; i < editableRules.length - 1; i++) {
      const current = editableRules[i];
      const next = editableRules[i + 1];
      if (current.maxProfit === null) {
        return `Tier '${current.name}' tidak berbatas atas tetapi bukan tier terakhir.`;
      }
      if (current.maxProfit !== next.minProfit) {
        return `Batas atas tier ${i + 1} (${formatRupiah(current.maxProfit)}) tidak sama dengan batas bawah tier ${i + 2} (${formatRupiah(next.minProfit)}).`;
      }
    }
    return null;
  };

  const contiguityError = checkContiguity();

  const handleSaveRules = async () => {
    setRuleError(null);
    if (contiguityError) {
      setRuleError(contiguityError);
      return;
    }

    setLoading(true);

    const payload = editableRules.map((r) => ({
      name: r.name,
      beneficiaryGroup: r.beneficiaryGroup || "MOTHER_SIBLING",
      minProfit: Number(r.minProfit),
      maxProfit: r.maxProfit !== null ? Number(r.maxProfit) : null,
      amountPerPerson: Number(r.amountPerPerson),
      numberOfPeople: Number(r.numberOfPeople) || 4,
    }));

    const res = await saveProfitShareRules(payload as any);
    setLoading(false);

    if (res.success) {
      setIsEditing(false);
      showNotification("Aturan tier bertingkat berhasil divalidasi dan disimpan!", "success");
    } else {
      setRuleError(res.error || "Gagal menyimpan aturan tier");
    }
  };

  // Logika Simulasi (Menangani Laba Normal, Laba Kecil, Impas, maupun RUGI)
  const simProfitNum = Number(simulationProfit) || 0;
  const isLoss = simProfitNum < 0;
  const isBreakEven = simProfitNum === 0;

  let matchedRule: ProfitRuleItem | undefined = undefined;
  let totalAlokasiSaudara = 0;
  let sisaLabaOwner = 0;

  if (isLoss) {
    // Skenario RUGI: Keluarga/Investor dapat Rp 0, Pokok 100% utuh, Owner menyerap rugi 100%
    matchedRule = undefined;
    totalAlokasiSaudara = 0;
    sisaLabaOwner = simProfitNum; // negatif
  } else {
    matchedRule = editableRules.find(
      (r) => simProfitNum >= r.minProfit && (r.maxProfit === null || simProfitNum < r.maxProfit)
    );
    totalAlokasiSaudara = matchedRule ? matchedRule.amountPerPerson * matchedRule.numberOfPeople : 0;
    sisaLabaOwner = Math.max(0, simProfitNum - totalAlokasiSaudara);
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {feedback && (
        <div
          className={cn(
            "p-4 rounded-xl text-sm font-medium flex items-center justify-between border shadow-sm transition-all",
            feedback.type === "success"
              ? "bg-[var(--bg)] border-[var(--line)] text-[var(--ok)]"
              : "bg-[var(--bg)] border-[var(--bad)]/30 text-[var(--bad)]"
          )}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[var(--ok)] shrink-0" />
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs underline hover:opacity-80 cursor-pointer font-semibold"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Sub-Navigation Pills */}
      <InvestorSubNav
        pendingCount={pendingCount}
        investorsCount={totalInvestorsCount}
        historyCount={totalHistoryCount}
      />

      {/* Penjelasan Transparansi Modal Keluarga */}
      <div className="bg-white border border-[var(--line)] p-4 rounded-2xl flex items-start gap-3 shadow-xs">
        <Info className="w-5 h-5 text-[var(--accent)] shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-[var(--muted)]">
          <p className="font-bold text-sm text-[var(--ink)]">
            Skema Bagi Hasil Khusus Modal Ibu Nurdiah (Alokasi 4 Penerima)
          </p>
          <p className="leading-relaxed">
            Keuntungan dari setiap unit mobil yang didanai modal <strong>Ibu Nurdiah</strong> secara otomatis dibagikan kepada <strong>4 penerima tetap</strong> (1 bagian untuk <strong>Ibu Nurdiah</strong> dan 3 bagian untuk <strong>3 saudara kandung</strong>). Anda dapat menambah tingkatan baru (misal untuk keuntungan tipis 1 juta), mengubah nilai nominal, atau menambah tier setinggi mungkin.
          </p>
        </div>
      </div>

      {/* Interactive Profit Simulator Card */}
      <div className="bg-white rounded-2xl border border-[var(--line)] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-[var(--accent)]" />
            <h3 className="font-bold text-base text-[var(--ink)]">
              Simulasi Interaktif Pembagian Laba Unit (Aturan 4 Saudara)
            </h3>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
            <span className="hidden sm:inline">Coba nilai minus untuk uji skenario rugi:</span>
            <button
              onClick={() => setSimulationProfit("-2000000")}
              className="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 font-bold border border-rose-200 hover:bg-rose-100 transition-colors text-[11px] cursor-pointer"
            >
              Uji Rugi -2 Juta
            </button>
            <button
              onClick={() => setSimulationProfit("1500000")}
              className="px-2 py-0.5 rounded-lg bg-[var(--bg)] text-[var(--ink)] font-bold border border-[var(--line)] hover:bg-white transition-colors text-[11px] cursor-pointer"
            >
              Uji Untung 1.5 Juta
            </button>
          </div>
        </div>

        <p className="text-xs text-[var(--muted)]">
          Masukkan estimasi keuntungan kotor mobil (positif atau negatif jika rugi) untuk melihat bagaimana algoritma membagi porsi keluarga dan risiko showroom.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Input Laba Kotor */}
          <div>
            <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider mb-1.5">
              Simulasi Laba Kotor Unit (Rp)
            </label>
            <input
              type="number"
              value={simulationProfit}
              onChange={(e) => setSimulationProfit(e.target.value)}
              className={cn(
                "w-full p-3 border rounded-xl text-base font-black focus:outline-none focus:ring-2 transition-all",
                isLoss
                  ? "border-rose-300 bg-rose-50/50 text-rose-900 focus:ring-rose-200"
                  : "border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] focus:ring-[var(--accent)]/20"
              )}
              placeholder="Contoh: 15000000 atau -2000000"
            />
            {isLoss ? (
              <span className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-full border border-rose-300">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>Unit Mengalami Kerugian Operasional</span>
              </span>
            ) : matchedRule ? (
              <span className="inline-block mt-2 text-xs font-bold text-[var(--accent)] bg-[var(--bg)] px-2.5 py-1 rounded-full border border-[var(--line)]">
                Masuk ke: {matchedRule.name}
              </span>
            ) : null}
          </div>

          {/* Kartu Alokasi Keluarga */}
          <div
            className={cn(
              "p-4 rounded-xl border space-y-1 transition-all",
              isLoss
                ? "bg-[var(--bg)] border-[var(--line)] text-[var(--muted)]"
                : "bg-white border-[var(--line)] shadow-xs"
            )}
          >
            <span
              className={cn(
                "text-[11px] font-bold uppercase tracking-wider",
                isLoss ? "text-[var(--muted)]" : "text-[var(--accent)]"
              )}
            >
              Total Alokasi Keluarga (4 Orang)
            </span>
            <div
              className={cn(
                "text-xl font-black",
                isLoss ? "text-[var(--muted)]" : "text-[var(--ink)]"
              )}
            >
              {formatRupiah(totalAlokasiSaudara)}
            </div>
            <p className={cn("text-xs", isLoss ? "text-[var(--muted)]" : "text-[var(--muted)]")}>
              {isLoss
                ? "Rp 0 (Keluarga tidak menanggung rugi, modal pokok aman 100%)"
                : matchedRule
                ? `${formatRupiah(matchedRule.amountPerPerson)} / orang (1 Ibu + 3 Saudara)`
                : "Tidak ada tier yang cocok"}
            </p>
          </div>

          {/* Kartu Bagian Owner */}
          <div
            className={cn(
              "p-4 rounded-xl border space-y-1 transition-all",
              isLoss
                ? "bg-rose-50 border-rose-200 text-rose-900"
                : "bg-white border-[var(--line)] shadow-xs"
            )}
          >
            <span
              className={cn(
                "text-[11px] font-bold uppercase tracking-wider",
                isLoss ? "text-rose-700" : "text-[var(--ink)]"
              )}
            >
              {isLoss ? "Beban Kerugian Diserap Owner" : "Sisa Laba Bersih Pengelola (Owner)"}
            </span>
            <div className={cn("text-xl font-black", isLoss ? "text-rose-700" : "text-[var(--ink)]")}>
              {isLoss ? `- ${formatRupiah(Math.abs(sisaLabaOwner))}` : formatRupiah(sisaLabaOwner)}
            </div>
            <p className={cn("text-xs", isLoss ? "text-rose-700" : "text-[var(--muted)]")}>
              {isLoss
                ? "100% kerugian diserap oleh operasional showroom Nur Mobil"
                : "Bagian operasional & jerih payah pengelola showroom"}
            </p>
          </div>
        </div>
      </div>

      {/* Tabel Konfigurasi Aturan Tier */}
      <div className="bg-white rounded-2xl border border-[var(--line)] p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--line)] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-[var(--ink)] text-base">
                Konfigurasi Aturan Bertingkat Modal Ibu (4 Saudara)
              </h3>
              {isEditing ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--bg)] text-[var(--ink)] border border-[var(--line)]">
                  Mode Edit Aktif ({editableRules.length} Tingkatan)
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--bg)] text-[var(--ink)] border border-[var(--line)]">
                  Aktif &amp; Terkunci ({editableRules.length} Tingkatan)
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Skema bertingkat (*contiguous*): setiap tingkat terhubung tanpa celah (*gap*) atau tumpang tindih (*overlap*).
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            {!isEditing ? (
              <button
                onClick={() => {
                  setIsEditing(true);
                  setRuleError(null);
                }}
                className="flex items-center gap-1.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Ubah Konfigurasi Aturan</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleAddNewTier}
                  className="flex items-center gap-1 bg-white hover:bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)] px-3 py-2 rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
                  title="Tambah baris tingkatan baru"
                >
                  <Plus className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span>+ Tambah Tier</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetToStandard}
                  className="flex items-center gap-1 bg-[var(--bg)] hover:bg-white border border-[var(--line)] text-[var(--muted)] hover:text-[var(--ink)] px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  title="Kembalikan ke 7 aturan standar keluarga"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Standar (7 Tier)</span>
                </button>

                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex items-center gap-1 bg-white hover:bg-red-50 border border-[var(--line)] text-red-600 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Batal</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveRules}
                  disabled={loading || Boolean(contiguityError)}
                  className="flex items-center gap-1.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{loading ? "Menyimpan..." : "Simpan Perubahan"}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Error Feedback */}
        {ruleError && (
          <div className="p-3 bg-[var(--bg)] border border-[var(--bad)]/30 text-[var(--bad)] text-xs rounded-xl font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-[var(--bad)]" />
            <span>{ruleError}</span>
          </div>
        )}

        {isEditing && contiguityError && (
          <div className="p-3 bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)] text-xs rounded-xl font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-[var(--accent)]" />
            <span>{contiguityError}</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[var(--bg)] text-[var(--muted)] uppercase text-[10px] sm:text-[11px] font-bold tracking-wider border-b border-[var(--line)]">
              <tr>
                <th className="py-3 px-4">Nama Tier</th>
                <th className="py-3 px-4">Rentang Laba Kotor (Min - Max)</th>
                <th className="py-3 px-4 text-right">Nominal per Orang</th>
                <th className="py-3 px-4 text-center">Jumlah Orang</th>
                <th className="py-3 px-4 text-right">Total Alokasi Tier</th>
                {isEditing && <th className="py-3 px-4 text-center w-16">Hapus</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {editableRules.map((r, idx) => {
                const totalTierAlokasi = Number(r.amountPerPerson) * Number(r.numberOfPeople);
                const isLast = idx === editableRules.length - 1;

                if (isEditing) {
                  return (
                    <tr key={idx} className="bg-[var(--bg)]/50">
                      {/* Nama Tier */}
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={r.name}
                          onChange={(e) => handleRuleChange(idx, "name", e.target.value)}
                          className="w-full p-2 border border-[var(--line)] rounded-lg text-xs font-bold text-[var(--ink)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                        />
                      </td>

                      {/* Rentang Laba */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            value={r.minProfit}
                            disabled={idx > 0} // Tier > 0 otomatis tersinkron dari maxProfit tier sebelumnya
                            onChange={(e) => handleRuleChange(idx, "minProfit", Number(e.target.value))}
                            className="w-28 p-1.5 border border-[var(--line)] rounded-lg text-xs font-semibold bg-white disabled:bg-gray-100 disabled:text-gray-500"
                            placeholder="Min"
                          />
                          <span className="text-[var(--muted)] font-medium">s/d</span>
                          {isLast ? (
                            <span className="text-xs font-bold text-[var(--muted)] bg-gray-100 px-3 py-1.5 rounded-lg border border-[var(--line)]">
                              Tak Terbatas
                            </span>
                          ) : (
                            <input
                              type="number"
                              value={r.maxProfit ?? ""}
                              onChange={(e) => handleRuleChange(idx, "maxProfit", Number(e.target.value))}
                              className="w-28 p-1.5 border border-[var(--line)] rounded-lg text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                              placeholder="Max"
                            />
                          )}
                        </div>
                      </td>

                      {/* Nominal per Orang */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-xs text-[var(--muted)] font-bold">Rp</span>
                          <input
                            type="number"
                            value={r.amountPerPerson}
                            onChange={(e) => handleRuleChange(idx, "amountPerPerson", Number(e.target.value))}
                            className="w-28 p-1.5 border border-[var(--line)] rounded-lg text-xs font-bold text-[var(--ink)] bg-white text-right focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                          />
                        </div>
                      </td>

                      {/* Jumlah Orang */}
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          value={r.numberOfPeople}
                          min={1}
                          max={10}
                          onChange={(e) => handleRuleChange(idx, "numberOfPeople", Number(e.target.value))}
                          className="w-16 p-1.5 border border-[var(--line)] rounded-lg text-xs font-bold text-center bg-white"
                        />
                      </td>

                      {/* Total Alokasi */}
                      <td className="py-3 px-4 text-right font-black text-[var(--ink)]">
                        {formatRupiah(totalTierAlokasi)}
                      </td>

                      {/* Tombol Hapus Baris */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          disabled={editableRules.length <= 1}
                          onClick={() => handleDeleteTier(idx)}
                          className="p-1.5 rounded-lg text-[var(--muted)] hover:text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                          title="Hapus baris tingkatan ini"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                }

                // Mode Tampilan (Read-Only) yang Elegan & Presisi
                const rangeLabel =
                  r.maxProfit === null
                    ? `>= ${formatRupiah(r.minProfit)} (Tak Terbatas)`
                    : r.minProfit === 0
                    ? `< ${formatRupiah(r.maxProfit)} (Rp 0 s/d < ${formatRupiah(r.maxProfit)})`
                    : `${formatRupiah(r.minProfit)} s/d < ${formatRupiah(r.maxProfit)}`;

                return (
                  <tr key={idx} className="hover:bg-[var(--bg)] transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[var(--ink)]">{r.name}</td>
                    <td className="py-3.5 px-4 text-[var(--muted)] font-medium font-mono text-xs">
                      {rangeLabel}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-[var(--ink)]">
                      {formatRupiah(r.amountPerPerson)} <span className="text-[11px] text-[var(--muted)] font-normal">/ orang</span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-medium text-[var(--ink)]">
                      {r.numberOfPeople} orang <span className="text-[10px] text-[var(--muted)] block">(1 Ibu + 3 Saudara)</span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-[var(--ink)]">
                      {formatRupiah(totalTierAlokasi)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bagian Penjelasan Proteksi Risiko Jika Mobil Rugi */}
      <div className="bg-white rounded-2xl border border-[var(--line)] p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[var(--accent)]" />
          <h3 className="font-bold text-base text-[var(--ink)]">
            Kebijakan &amp; Algoritma Back-End Jika Unit Mengalami Kerugian (Loss Protection)
          </h3>
        </div>

        <p className="text-xs text-[var(--muted)] leading-relaxed">
          Algoritma pembagian laba sistem Nur Mobil pada file backend (<code>src/lib/calculations/profit-share.ts</code>) telah memiliki aturan deterministik yang mengamankan dana keluarga dan investor jika mobil lelang atau tukar tambah terjual di bawah HPP (rugi):
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="p-4 rounded-xl border border-[var(--line)] bg-[var(--bg)] space-y-1.5">
            <div className="flex items-center gap-2 text-[var(--ink)] font-bold text-xs uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-[var(--accent)]" />
              <span>1. Pokok Modal Terlindungi 100%</span>
            </div>
            <p className="text-xs text-[var(--muted)] leading-snug">
              Modal pokok Ibu Nurdiah ataupun investor pihak ketiga <strong>tidak dipotong sepeserpun</strong> saat mobil rugi. Pokok investasi dikembalikan penuh 100%.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-[var(--line)] bg-[var(--bg)] space-y-1.5">
            <div className="flex items-center gap-2 text-[var(--ink)] font-bold text-xs uppercase tracking-wider">
              <Info className="w-4 h-4 text-[var(--accent)]" />
              <span>2. Bagi Hasil = Rp 0</span>
            </div>
            <p className="text-xs text-[var(--muted)] leading-snug">
              Bagi hasil murni dihitung dari keuntungan bersih. Jika laba kotor <strong>Rp 0 atau minus</strong>, maka alokasi dividen untuk keluarga/investor otomatis <strong>Rp 0</strong>.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-[var(--line)] bg-[var(--bg)] space-y-1.5">
            <div className="flex items-center gap-2 text-[var(--ink)] font-bold text-xs uppercase tracking-wider">
              <TrendingDown className="w-4 h-4 text-rose-600" />
              <span>3. Risiko Diserap 100% Oleh Owner</span>
            </div>
            <p className="text-xs text-[var(--muted)] leading-snug">
              Seluruh kerugian operasional dan selisih minus harga jual diserap penuh oleh pengelola showroom (Owner Nur Mobil) sebagai penanggung jawab bisnis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

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
  Info
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
    name: "Laba Wajar (< Rp 5.000.000)",
    beneficiaryGroup: "MOTHER_SIBLING",
    minProfit: 0,
    maxProfit: 5000000,
    amountPerPerson: 250000,
    numberOfPeople: 4,
  },
  {
    name: "Laba Tinggi (Rp 5.000.000 - Rp 10.000.000)",
    beneficiaryGroup: "MOTHER_SIBLING",
    minProfit: 5000000,
    maxProfit: 10000000,
    amountPerPerson: 500000,
    numberOfPeople: 4,
  },
  {
    name: "Laba Sangat Tinggi (> Rp 10.000.000)",
    beneficiaryGroup: "MOTHER_SIBLING",
    minProfit: 10000000,
    maxProfit: null,
    amountPerPerson: 1000000,
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

  // Simulation State
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

  const handleResetToStandard = () => {
    setEditableRules(DEFAULT_STANDARD_RULES);
    setRuleError(null);
  };

  const handleCancelEdit = () => {
    setEditableRules(initialRules);
    setIsEditing(false);
    setRuleError(null);
  };

  // Validasi sederhana kontinuitas tier
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

  // Hitung simulasi pembagian berdasarkan simulationProfit (menggunakan operator < untuk maxProfit sesuai profit-share.ts)
  const simProfitNum = Number(simulationProfit) || 0;
  const matchedRule = editableRules.find(
    (r) => simProfitNum >= r.minProfit && (r.maxProfit === null || simProfitNum < r.maxProfit)
  );
  const totalAlokasiSaudara = matchedRule ? matchedRule.amountPerPerson * matchedRule.numberOfPeople : 0;
  const sisaLabaOwner = Math.max(0, simProfitNum - totalAlokasiSaudara);

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
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
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
      <div className="bg-[#FFFBEB] border border-[#FDE68A] p-4 rounded-2xl flex items-start gap-3 shadow-xs">
        <Info className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-[#92400E]">
          <p className="font-bold text-sm text-[#78350F]">
            Skema Bagi Hasil Khusus Modal Ibu Nurdiah (Alokasi 4 Penerima)
          </p>
          <p className="leading-relaxed">
            Keuntungan dari setiap unit mobil yang didanai modal <strong>Ibu Nurdiah</strong> secara otomatis dibagikan kepada <strong>4 penerima tetap</strong> (1 bagian untuk <strong>Ibu Nurdiah</strong> dan 3 bagian untuk <strong>3 saudara kandung</strong>). Sistem ini tidak bergantung pada akun investor pihak ketiga biasa karena menggunakan skema pembagian bertingkat (*tier-based*) keluarga.
          </p>
        </div>
      </div>

      {/* Interactive Profit Simulator Card */}
      <div className="bg-white rounded-2xl border border-[#D9D4CB] p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-[#D97706]" />
          <h3 className="font-bold text-base text-[#1C1917]">
            Simulasi Interaktif Pembagian Laba Unit (Aturan 4 Saudara)
          </h3>
        </div>

        <p className="text-xs text-[#6B6560]">
          Masukkan estimasi keuntungan kotor mobil untuk melihat bagaimana algoritma tier membagikan porsi keluarga (Ibu + 3 Saudara) dan sisa bersih untuk pengelola showroom (owner).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-[#1C1917] uppercase tracking-wider mb-1.5">
              Simulasi Laba Kotor Unit (Rp)
            </label>
            <input
              type="number"
              value={simulationProfit}
              onChange={(e) => setSimulationProfit(e.target.value)}
              className="w-full p-3 border border-[#D9D4CB] rounded-xl text-base font-black focus:outline-none focus:ring-2 focus:ring-[#D97706]/20 bg-[#F7F5F2]"
              placeholder="Contoh: 15000000"
            />
            {matchedRule && (
              <span className="inline-block mt-2 text-xs font-bold text-[#D97706] bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                Masuk ke: {matchedRule.name}
              </span>
            )}
          </div>

          <div className="bg-purple-50 border border-purple-200 p-4 rounded-xl space-y-1">
            <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">
              Total Alokasi Keluarga (4 Orang)
            </span>
            <div className="text-xl font-black text-purple-900">
              {formatRupiah(totalAlokasiSaudara)}
            </div>
            <p className="text-xs text-purple-700">
              {matchedRule
                ? `${formatRupiah(matchedRule.amountPerPerson)} / orang (1 Ibu + 3 Saudara)`
                : "Tidak ada tier yang cocok"}
            </p>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl space-y-1">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
              Sisa Laba Bersih Pengelola (Owner)
            </span>
            <div className="text-xl font-black text-emerald-900">
              {formatRupiah(sisaLabaOwner)}
            </div>
            <p className="text-xs text-emerald-700">
              Bagian operasional & jerih payah pengelola showroom
            </p>
          </div>
        </div>
      </div>

      {/* Tabel Konfigurasi Aturan Tier */}
      <div className="bg-white rounded-2xl border border-[#D9D4CB] p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EBE7E1] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-[#1C1917] text-base">
                Konfigurasi Aturan Bertingkat Modal Ibu (4 Saudara)
              </h3>
              {isEditing ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                  Mode Edit Aktif
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Aktif & Terkunci
                </span>
              )}
            </div>
            <p className="text-xs text-[#6B6560] mt-0.5">
              Skema bertingkat (*contiguous*): setiap tingkat terhubung tanpa celah (*gap*) atau tumpang tindih (*overlap*).
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                onClick={() => {
                  setIsEditing(true);
                  setRuleError(null);
                }}
                className="flex items-center gap-1.5 bg-[#D97706] hover:bg-[#B45309] text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Ubah Konfigurasi Aturan</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleResetToStandard}
                  className="flex items-center gap-1 bg-[#F7F5F2] hover:bg-[#EFECE8] border border-[#D9D4CB] text-[#6B6560] hover:text-[#1C1917] px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  title="Kembalikan ke aturan standar bawaan sistem"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Standar</span>
                </button>

                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex items-center gap-1 bg-white hover:bg-red-50 border border-[#D9D4CB] text-red-600 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Batal</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveRules}
                  disabled={loading || Boolean(contiguityError)}
                  className="flex items-center gap-1.5 bg-[#16A34A] hover:bg-[#15803D] disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
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
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{ruleError}</span>
          </div>
        )}

        {isEditing && contiguityError && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>{contiguityError}</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#EFECE8] text-[#6B6560] uppercase text-[10px] sm:text-[11px] font-bold tracking-wider border-b border-[#D9D4CB]">
              <tr>
                <th className="py-3 px-4">Nama Tier</th>
                <th className="py-3 px-4">Rentang Laba Kotor (Min - Max)</th>
                <th className="py-3 px-4 text-right">Nominal per Orang</th>
                <th className="py-3 px-4 text-center">Jumlah Orang</th>
                <th className="py-3 px-4 text-right">Total Alokasi Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9D4CB]">
              {editableRules.map((r, idx) => {
                const totalTierAlokasi = Number(r.amountPerPerson) * Number(r.numberOfPeople);
                const isLast = idx === editableRules.length - 1;

                if (isEditing) {
                  return (
                    <tr key={idx} className="bg-amber-50/30">
                      {/* Nama Tier */}
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={r.name}
                          onChange={(e) => handleRuleChange(idx, "name", e.target.value)}
                          className="w-full p-2 border border-[#D9D4CB] rounded-lg text-xs font-bold text-[#1C1917] bg-white focus:outline-none focus:ring-2 focus:ring-[#D97706]/30"
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
                            className="w-28 p-1.5 border border-[#D9D4CB] rounded-lg text-xs font-semibold bg-white disabled:bg-gray-100 disabled:text-gray-500"
                            placeholder="Min"
                          />
                          <span className="text-[#6B6560] font-medium">s/d</span>
                          {isLast ? (
                            <span className="text-xs font-bold text-[#6B6560] bg-gray-100 px-3 py-1.5 rounded-lg border border-[#D9D4CB]">
                              Tak Terbatas
                            </span>
                          ) : (
                            <input
                              type="number"
                              value={r.maxProfit ?? ""}
                              onChange={(e) => handleRuleChange(idx, "maxProfit", Number(e.target.value))}
                              className="w-28 p-1.5 border border-[#D9D4CB] rounded-lg text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-[#D97706]/30"
                              placeholder="Max"
                            />
                          )}
                        </div>
                      </td>

                      {/* Nominal per Orang */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-xs text-[#6B6560] font-bold">Rp</span>
                          <input
                            type="number"
                            value={r.amountPerPerson}
                            onChange={(e) => handleRuleChange(idx, "amountPerPerson", Number(e.target.value))}
                            className="w-28 p-1.5 border border-[#D9D4CB] rounded-lg text-xs font-bold text-emerald-700 bg-white text-right focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
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
                          className="w-16 p-1.5 border border-[#D9D4CB] rounded-lg text-xs font-bold text-center bg-white"
                        />
                      </td>

                      {/* Total Alokasi */}
                      <td className="py-3 px-4 text-right font-black text-[#1C1917]">
                        {formatRupiah(totalTierAlokasi)}
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
                  <tr key={idx} className="hover:bg-[#F7F5F2] transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#1C1917]">{r.name}</td>
                    <td className="py-3.5 px-4 text-[#6B6560] font-medium font-mono text-xs">
                      {rangeLabel}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-700">
                      {formatRupiah(r.amountPerPerson)} <span className="text-[11px] text-[#6B6560] font-normal">/ orang</span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-medium text-[#1C1917]">
                      {r.numberOfPeople} orang <span className="text-[10px] text-[#6B6560] block">(1 Ibu + 3 Saudara)</span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-[#1C1917]">
                      {formatRupiah(totalTierAlokasi)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

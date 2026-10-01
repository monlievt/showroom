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
  Sparkles
} from "lucide-react";
import { formatRupiah, cn } from "@/lib/utils";
import { saveProfitShareRules } from "@/app/actions/profit-share-rule";
import { InvestorSubNav } from "./InvestorSubNav";

interface TierRulesProps {
  profitRules: Array<{
    id?: string;
    tier?: number;
    name: string;
    beneficiaryGroup?: string;
    minProfit: number;
    maxProfit: number | null;
    amountPerPerson: number;
    numberOfPeople: number;
    active?: boolean;
  }>;
  pendingCount: number;
  totalInvestorsCount: number;
  totalHistoryCount: number;
}

export function InvestorTierRulesPageClient({
  profitRules,
  pendingCount,
  totalInvestorsCount,
  totalHistoryCount,
}: TierRulesProps) {
  const [editableRules, setEditableRules] = useState(profitRules);
  const [ruleError, setRuleError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Simulation State
  const [simulationProfit, setSimulationProfit] = useState("15000000");

  const showNotification = (message: string, type: "success" | "error") => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleSaveRules = async () => {
    setRuleError(null);
    setLoading(true);

    const res = await saveProfitShareRules(editableRules as any);
    setLoading(false);

    if (res.success) {
      showNotification("Aturan tier berhasil divalidasi dan disimpan!", "success");
    } else {
      setRuleError(res.error || "Gagal menyimpan aturan tier");
    }
  };

  // Hitung simulasi pembagian berdasarkan simulationProfit
  const simProfitNum = Number(simulationProfit) || 0;
  const matchedRule = editableRules.find(
    (r) => simProfitNum >= r.minProfit && (r.maxProfit === null || simProfitNum <= r.maxProfit)
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
        investorsCount={totalInvestorsCount}
        historyCount={totalHistoryCount}
      />

      {/* Interactive Profit Simulator Card */}
      <div className="bg-white rounded-2xl border border-[#D9D4CB] p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-[#D97706]" />
          <h3 className="font-bold text-base text-[#1C1917]">
            Simulasi Interaktif Pembagian Laba Unit (Aturan 4 Saudara)
          </h3>
        </div>

        <p className="text-xs text-[#6B6560]">
          Masukkan estimasi keuntungan kotor mobil untuk melihat bagaimana algoritma tier membagikan porsi 4 saudara dan bagian bersih pengelola (owner).
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
              Total Alokasi 4 Saudara
            </span>
            <div className="text-xl font-black text-purple-900">
              {formatRupiah(totalAlokasiSaudara)}
            </div>
            <p className="text-xs text-purple-700">
              {matchedRule ? `${formatRupiah(matchedRule.amountPerPerson)} / saudara (x${matchedRule.numberOfPeople})` : "Tidak ada tier cocok"}
            </p>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl space-y-1">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
              Sisa Laba Bersih Owner
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
            <h3 className="font-bold text-[#1C1917] text-base">
              Konfigurasi Aturan Bertingkat Bagi Hasil Modal Ibu (4 Saudara)
            </h3>
            <p className="text-xs text-[#6B6560] mt-0.5">
              Validasi tier contiguous: tanpa gap atau overlap antar rentang laba untuk kepastian deterministik.
            </p>
          </div>
          <button
            onClick={handleSaveRules}
            disabled={loading}
            className="bg-[#D97706] hover:bg-[#B45309] text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer disabled:opacity-50"
          >
            {loading ? "Menyimpan..." : "Simpan Perubahan Aturan"}
          </button>
        </div>

        {ruleError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
            {ruleError}
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
              {editableRules.map((r, idx) => (
                <tr key={idx} className="hover:bg-[#F7F5F2] transition-colors">
                  <td className="py-3.5 px-4 font-bold text-[#1C1917]">{r.name}</td>
                  <td className="py-3.5 px-4 text-[#6B6560]">
                    {formatRupiah(r.minProfit)} s/d {r.maxProfit ? formatRupiah(r.maxProfit) : "Tak Terbatas"}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-emerald-700">
                    {formatRupiah(r.amountPerPerson)}
                  </td>
                  <td className="py-3.5 px-4 text-center font-medium text-[#1C1917]">
                    {r.numberOfPeople} orang
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-[#1C1917]">
                    {formatRupiah(r.amountPerPerson * r.numberOfPeople)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

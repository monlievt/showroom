"use client";

import React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle,
  Plus,
  Trash2,
  Users,
  Wallet,
} from "lucide-react";
import { cn, formatRupiah, formatThousands, parseThousands } from "@/lib/utils";

export interface InvestorOption {
  id: string;
  name: string;
  type: string;
  currentBalance: number;
  defaultProfitSharePercent?: number | null;
}

export interface FundingAllocationRow {
  investorId: string;
  capitalShare: number;
  profitSharePercent: number;
}

interface VehicleFundingSelectorProps {
  sectionNumber?: number | string;
  availableInvestors: InvestorOption[];
  fundingMode: "SHOWROOM" | "INVESTOR";
  onFundingModeChange: (mode: "SHOWROOM" | "INVESTOR") => void;
  investorFundingList: FundingAllocationRow[];
  onInvestorFundingListChange: (next: FundingAllocationRow[]) => void;
  purchasePrice: number;
  extraInitialCosts?: number;
  existingInvestments?: { investorId: string; capitalShare: number }[];
  showroomCashBalance?: number | null;
}

function getDefaultProfitPercent(inv: InvestorOption): number {
  if (inv.defaultProfitSharePercent != null) {
    return Number(inv.defaultProfitSharePercent);
  }
  return inv.type === "THIRD_PARTY" ? 50 : 0;
}

function getInvestorTypeLabel(type: string): string {
  if (type === "MOTHER_SIBLING") return "Keluarga / Tier 4 Saudara";
  if (type === "OWNER_EQUITY") return "Modal Owner";
  return "Mitra Luar";
}

export function VehicleFundingSelector({
  sectionNumber = 5,
  availableInvestors,
  fundingMode,
  onFundingModeChange,
  investorFundingList,
  onInvestorFundingListChange,
  purchasePrice,
  extraInitialCosts = 0,
  existingInvestments = [],
  showroomCashBalance = null,
}: VehicleFundingSelectorProps) {
  const totalUnitCost = (Number(purchasePrice) || 0) + (Number(extraInitialCosts) || 0);
  const totalInvCap = investorFundingList.reduce(
    (sum, r) => sum + (Number(r.capitalShare) || 0),
    0
  );
  const effectiveInvestorCap = fundingMode === "INVESTOR" ? totalInvCap : 0;
  const showroomShare = Math.max(0, totalUnitCost - effectiveInvestorCap);
  const invPercent =
    totalUnitCost > 0
      ? Math.min(100, Math.round((effectiveInvestorCap / totalUnitCost) * 100))
      : 0;

  const cashInsufficient =
    showroomCashBalance !== null && totalUnitCost > 0 && showroomCashBalance < totalUnitCost;

  const getPrevAllocated = (investorId: string) =>
    Number(
      existingInvestments.find((vInv) => vInv.investorId === investorId)?.capitalShare || 0
    );

  const handleSwitchToInvestor = () => {
    onFundingModeChange("INVESTOR");
    if (investorFundingList.length === 0 && availableInvestors.length > 0) {
      const firstInv = availableInvestors[0];
      const maxAvail = Math.max(
        0,
        (Number(firstInv.currentBalance) || 0) + getPrevAllocated(firstInv.id)
      );
      const initialCap = totalUnitCost > 0 ? Math.min(totalUnitCost, maxAvail) : 0;
      onInvestorFundingListChange([
        {
          investorId: firstInv.id,
          capitalShare: initialCap,
          profitSharePercent: getDefaultProfitPercent(firstInv),
        },
      ]);
    }
  };

  const handleAddInvestorRow = () => {
    const unselected = availableInvestors.find(
      (inv) => !investorFundingList.some((item) => item.investorId === inv.id)
    );
    const chosen = unselected || availableInvestors[0];
    if (!chosen) return;

    onInvestorFundingListChange([
      ...investorFundingList,
      {
        investorId: chosen.id,
        capitalShare: 0,
        profitSharePercent: getDefaultProfitPercent(chosen),
      },
    ]);
  };

  const handleRemoveInvestorRow = (index: number) => {
    onInvestorFundingListChange(investorFundingList.filter((_, i) => i !== index));
  };

  const handleUpdateInvestorRow = (
    index: number,
    field: "investorId" | "capitalShare" | "profitSharePercent",
    val: string | number
  ) => {
    const next = [...investorFundingList];
    if (field === "investorId") {
      const inv = availableInvestors.find((item) => item.id === val);
      next[index] = {
        ...next[index],
        investorId: String(val),
        profitSharePercent: inv
          ? getDefaultProfitPercent(inv)
          : next[index].profitSharePercent,
      };
    } else {
      next[index] = { ...next[index], [field]: Number(val) };
    }
    onInvestorFundingListChange(next);
  };

  return (
    <div className="bg-white border border-[var(--line)] rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--line)] pb-3">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-[var(--accent)]" />
          <h2 className="text-sm font-bold text-[var(--ink)] uppercase tracking-wider">
            {sectionNumber}. Sumber Modal &amp; Pendanaan Unit (Alokasi Modal)
          </h2>
        </div>
        <span className="text-[11px] font-semibold text-[var(--ink)] bg-[var(--bg)] px-2.5 py-0.5 rounded-full border border-[var(--line)]">
          Sinkron ke Kas &amp; Buku Modal Pemodal
        </span>
      </div>

      <p className="text-xs text-[var(--muted)]">
        Tentukan sumber modal untuk pembelian unit ini. Alokasi akan langsung memotong saldo kas bebas pemodal atau kas showroom dan otomatis dikembalikan saat unit laku lunas.
      </p>

      {/* Banner Kesiapan Saldo Kas Showroom (khusus Intake Unit Baru) */}
      {showroomCashBalance !== null && (
        <div
          className={cn(
            "p-3.5 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2",
            cashInsufficient
              ? "bg-red-50 border-red-200 text-red-900"
              : "bg-[var(--bg)] border-[var(--line)] text-[var(--ink)]"
          )}
        >
          <div className="space-y-0.5">
            <div className="font-bold flex items-center gap-1.5">
              {cashInsufficient && <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />}
              <span>
                Saldo Kas Showroom Tersedia Saat Ini: {formatRupiah(showroomCashBalance)}
              </span>
            </div>
            {totalUnitCost > 0 && (
              <p className={cn("text-[11px]", cashInsufficient ? "text-red-700" : "text-[var(--muted)]")}>
                Total pengeluaran kas saat intake: <strong>{formatRupiah(totalUnitCost)}</strong>
                {cashInsufficient
                  ? ` (Kurang ${formatRupiah(totalUnitCost - showroomCashBalance)} — setor modal terlebih dahulu agar saldo tidak minus).`
                  : ` → Sisa kas setelah transaksi: ${formatRupiah(showroomCashBalance - totalUnitCost)}`}
              </p>
            )}
          </div>
          {cashInsufficient && (
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/admin/investors/accounts"
                className="px-2.5 py-1.5 rounded-lg bg-white border border-red-200 hover:bg-red-100 text-[11px] font-bold text-red-800 transition-colors"
              >
                Setor Modal Pemodal
              </Link>
              <Link
                href="/admin/finance"
                className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-[11px] font-bold text-white transition-colors"
              >
                Buku Kas &amp; Mutasi
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Funding Mode Toggle */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <button
          type="button"
          onClick={() => onFundingModeChange("SHOWROOM")}
          className={cn(
            "p-4 rounded-xl border text-left transition-all cursor-pointer",
            fundingMode === "SHOWROOM"
              ? "border-[var(--accent)] bg-white ring-2 ring-[var(--accent)]/20 shadow-xs"
              : "border-[var(--line)] bg-[var(--bg)] hover:bg-white text-[var(--muted)]"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--ink)] block">
              100% Modal Kas Showroom
            </span>
            {fundingMode === "SHOWROOM" && (
              <CheckCircle className="w-4 h-4 text-[var(--accent)]" />
            )}
          </div>
          <p className="text-[11px] text-[var(--muted)] mt-1 leading-relaxed">
            Didanai murni dari kas internal showroom tanpa bagi hasil dengan pemodal luar.
          </p>
        </button>

        <button
          type="button"
          onClick={handleSwitchToInvestor}
          className={cn(
            "p-4 rounded-xl border text-left transition-all cursor-pointer",
            fundingMode === "INVESTOR"
              ? "border-[var(--accent)] bg-white ring-2 ring-[var(--accent)]/20 shadow-xs"
              : "border-[var(--line)] bg-[var(--bg)] hover:bg-white text-[var(--muted)]"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--ink)] block">
              Didanai Mitra Pemodal / Investor
            </span>
            {fundingMode === "INVESTOR" && (
              <CheckCircle className="w-4 h-4 text-[var(--accent)]" />
            )}
          </div>
          <p className="text-[11px] text-[var(--muted)] mt-1 leading-relaxed">
            Unit didanai penuh atau patungan sebagian oleh pemodal terdaftar (otomatis memotong saldo bebas pemodal).
          </p>
        </button>
      </div>

      {/* Investor Detail Form */}
      {fundingMode === "INVESTOR" && (
        <div className="space-y-4 pt-2 border-t border-[var(--line)]">
          {availableInvestors.length === 0 ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-950 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span>
                Belum ada akun pemodal yang terdaftar. Silakan tambahkan pemodal dan setor saldo modalnya terlebih dahulu.
              </span>
              <Link
                href="/admin/investors/accounts"
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shrink-0 text-center"
              >
                Buka Daftar Akun Investor
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {investorFundingList.map((row, idx) => {
                  const matchedInv = availableInvestors.find((inv) => inv.id === row.investorId);
                  const curBal = Number(matchedInv?.currentBalance) || 0;
                  const maxAllowed = Math.max(0, curBal + getPrevAllocated(row.investorId));
                  const capShare = Number(row.capitalShare) || 0;
                  const diff = maxAllowed - capShare;
                  const isDuplicate =
                    investorFundingList.filter((item) => item.investorId === row.investorId).length > 1;

                  return (
                    <div
                      key={idx}
                      className="p-4 bg-[var(--bg)] border border-[var(--line)] rounded-xl space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[var(--ink)] flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-[var(--accent)]" />
                          Pemodal #{idx + 1}
                        </span>
                        {investorFundingList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveInvestorRow(idx)}
                            className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Hapus
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                        <div className="sm:col-span-5">
                          <label className="block text-[11px] font-semibold text-[var(--ink)] mb-1">
                            Pilih Investor / Pemodal *
                          </label>
                          <select
                            value={row.investorId}
                            onChange={(e) =>
                              handleUpdateInvestorRow(idx, "investorId", e.target.value)
                            }
                            className="w-full h-10 px-3 bg-white border border-[var(--line)] rounded-lg text-xs font-semibold text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
                          >
                            {availableInvestors.map((inv) => (
                              <option key={inv.id} value={inv.id}>
                                {inv.name} ({getInvestorTypeLabel(inv.type)}) — Saldo Kas: {formatRupiah(inv.currentBalance || 0)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-4">
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-[11px] font-semibold text-[var(--ink)]">
                              Modal Yang Disetor (Rp) *
                            </label>
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateInvestorRow(
                                  idx,
                                  "capitalShare",
                                  totalUnitCost > 0
                                    ? Math.min(totalUnitCost, maxAllowed)
                                    : maxAllowed
                                )
                              }
                              className="text-[10px] font-bold text-[var(--accent)] hover:underline cursor-pointer"
                            >
                              {maxAllowed < totalUnitCost
                                ? `Isi Maks Saldo (${formatThousands(maxAllowed)})`
                                : "Isi 100% Modal"}
                            </button>
                          </div>
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="0"
                            value={formatThousands(row.capitalShare)}
                            onChange={(e) =>
                              handleUpdateInvestorRow(
                                idx,
                                "capitalShare",
                                parseThousands(e.target.value)
                              )
                            }
                            className={cn(
                              "w-full h-10 px-3 bg-white border rounded-lg text-xs font-bold text-[var(--ink)] focus:outline-none focus:ring-2",
                              capShare > maxAllowed
                                ? "border-red-400 focus:ring-red-400/40 text-red-700 bg-red-50/20"
                                : "border-[var(--line)] focus:ring-[var(--accent)]/40"
                            )}
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-[11px] font-semibold text-[var(--ink)] mb-1">
                            Porsi Laba (%) *
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="1"
                              placeholder="50"
                              value={row.profitSharePercent}
                              onChange={(e) =>
                                handleUpdateInvestorRow(
                                  idx,
                                  "profitSharePercent",
                                  Number(e.target.value)
                                )
                              }
                              className="w-full h-10 px-3 pr-7 bg-white border border-[var(--line)] rounded-lg text-xs font-bold text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
                            />
                            <span className="absolute right-2.5 top-2.5 text-xs font-bold text-[var(--muted)]">
                              %
                            </span>
                          </div>
                        </div>
                      </div>

                      {matchedInv &&
                        matchedInv.type === "MOTHER_SIBLING" &&
                        Number(row.profitSharePercent) === 0 && (
                          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 font-medium">
                            Porsi Laba <strong>0%</strong> pada akun Keluarga akan otomatis menggunakan aturan bertingkat <strong>Tier 4 Saudara</strong> saat unit laku lunas.
                          </div>
                        )}

                      {isDuplicate && (
                        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 font-semibold">
                          Pemodal ini dipilih lebih dari sekali. Gabungkan nominalnya ke satu baris saja.
                        </div>
                      )}

                      {matchedInv && diff < 0 && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-[11px] text-red-900 space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-red-800">
                            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                            <span>Saldo Kas Bebas {matchedInv.name} Tidak Mencukupi!</span>
                          </div>
                          <p className="text-red-700 leading-relaxed">
                            Saldo kas bebas {matchedInv.name} hanya tersedia <strong>{formatRupiah(maxAllowed)}</strong>, sedangkan Anda mengalokasikan <strong>{formatRupiah(capShare)}</strong> (Kurang {formatRupiah(Math.abs(diff))}).
                          </p>
                          <p className="text-red-800 font-semibold pt-0.5">
                            Solusi: Setor tambahan modal untuk {matchedInv.name}, atau turunkan nominalnya menjadi maksimal {formatRupiah(maxAllowed)} lalu tambah pemodal lain / biarkan sisanya didanai kas showroom.
                          </p>
                        </div>
                      )}

                      {matchedInv && diff >= 0 && (
                        <div className="p-2.5 bg-white border border-[var(--line)] rounded-lg text-[11px] text-[var(--ink)] flex flex-col sm:flex-row sm:items-center justify-between gap-1 shadow-2xs">
                          <span className="flex items-center gap-1.5 font-medium">
                            <span className="text-[var(--ok)] font-bold">✓</span> Saldo kas bebas mencukupi ({formatRupiah(maxAllowed)})
                          </span>
                          <span className="text-[10px] text-[var(--muted)]">
                            Sisa saldo bebas setelah alokasi ini:{" "}
                            <strong className="text-[var(--ink)]">{formatRupiah(diff)}</strong>
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {availableInvestors.length > investorFundingList.length && (
                <button
                  type="button"
                  onClick={handleAddInvestorRow}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--line)] bg-white hover:bg-[var(--bg)] text-xs font-semibold text-[var(--ink)] shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[var(--accent)]" />
                  Tambah Pemodal Lain (Jika Patungan)
                </button>
              )}

              {/* Ringkasan Kalkulasi Modal Unit */}
              <div className="p-4 bg-white border border-[var(--line)] rounded-xl space-y-3 shadow-xs">
                <div className="text-xs font-bold text-[var(--ink)] flex items-center justify-between">
                  <span>Ringkasan Komposisi Pendanaan Unit:</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--bg)] text-[var(--ink)] border border-[var(--line)]">
                    {investorFundingList.length} Pemodal Dipilih
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div className="p-2.5 bg-[var(--bg)] rounded-lg border border-[var(--line)]">
                    <span className="text-[10px] text-[var(--muted)] block">
                      {extraInitialCosts > 0 ? "Total Biaya Awal Unit" : "Harga Beli Unit"}
                    </span>
                    <span className="font-bold text-[var(--ink)]">
                      {formatRupiah(totalUnitCost)}
                    </span>
                  </div>
                  <div className="p-2.5 bg-[var(--bg)] rounded-lg border border-[var(--line)]">
                    <span className="text-[10px] text-[var(--muted)] block">
                      Total Modal Pemodal ({invPercent}%)
                    </span>
                    <span className="font-bold text-[var(--accent)]">
                      {formatRupiah(totalInvCap)}
                    </span>
                  </div>
                  <div className="p-2.5 bg-[var(--bg)] rounded-lg border border-[var(--line)]">
                    <span className="text-[10px] text-[var(--muted)] block">
                      Didanai Kas Showroom ({100 - invPercent}%)
                    </span>
                    <span className="font-bold text-[var(--ink)]">
                      {formatRupiah(showroomShare)}
                    </span>
                  </div>
                </div>

                {showroomShare > 0 && (
                  <div className="p-2.5 bg-[var(--bg)] border border-[var(--line)] rounded-lg text-[11px] text-[var(--ink)] leading-relaxed">
                    <strong>Pendanaan Patungan Kas Showroom:</strong> Sisa sebesar{" "}
                    <strong>{formatRupiah(showroomShare)}</strong> ({100 - invPercent}%) otomatis didanai dari kas showroom.
                  </div>
                )}

                {totalInvCap > totalUnitCost && totalUnitCost > 0 && (
                  <div className="text-[11px] text-red-800 bg-red-100 p-2.5 rounded-lg border border-red-200">
                    Jumlah total modal pemodal ({formatRupiah(totalInvCap)}) melebihi{" "}
                    {extraInitialCosts > 0 ? "total biaya awal unit" : "harga beli unit"} (
                    {formatRupiah(totalUnitCost)}). Mohon sesuaikan nominal modal masing-masing pemodal.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}


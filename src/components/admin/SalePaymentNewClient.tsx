"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  DollarSign,
  Receipt,
  Car,
  User,
  Calendar,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Clock,
  Check,
  HeartHandshake,
  Coins,
  Sparkles,
  Printer,
  FileText,
  ExternalLink,
  X,
} from "lucide-react";
import { addSalePaymentAction } from "@/app/actions/sale";
import { executeProfitDistribution } from "@/app/actions/finance";
import { formatRupiah, formatDate } from "@/lib/utils";
import { ProofUploadField } from "@/components/admin/ProofUploadField";

interface AvailableVehicle {
  id: string;
  plateNumber: string;
  brand: string;
  model: string;
  year: number;
}

interface SaleDetail {
  id: string;
  saleDate: string | Date;
  saleType: string;
  sellingPrice: number;
  dueDate?: string | Date | null;
  paidAmount: number;
  remainingAmount: number;
  isFullyPaid: boolean;
  percentagePaid: number;
  grossProfit?: number;
  hasInvestor?: boolean;
  investorNames?: string[];
  profitDistributionStatus?: string;
  vehicle: {
    id: string;
    brand: string;
    model: string;
    year: number;
    plateNumber: string;
    color: string;
    status: string;
  };
  buyer: {
    id: string;
    name: string;
    phone?: string | null;
    isShowroom: boolean;
    address?: string | null;
  };
  payments: Array<{
    id: string;
    amount: number;
    paidAt: string | Date;
    method: string;
    notes?: string | null;
    tradeInVehicle?: {
      id: string;
      brand: string;
      model: string;
      plateNumber: string;
    } | null;
  }>;
}

export function SalePaymentNewClient({
  sale,
  availableVehicles,
}: {
  sale: SaleDetail;
  availableVehicles: AvailableVehicle[];
}) {
  const router = useRouter();

  const [amount, setAmount] = useState<number | "">(sale.remainingAmount);
  const [paidAt, setPaidAt] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [method, setMethod] = useState("TRANSFER");
  const [tradeInVehicleId, setTradeInVehicleId] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [proofUrls, setProofUrls] = useState<string[]>([]);

  // Settlement Dialog Modal State
  const [settlementModalOpen, setSettlementModalOpen] = useState(false);
  const [settlementInfo, setSettlementInfo] = useState<{
    hasInvestor: boolean;
    investorNames: string[];
  }>({
    hasInvestor: Boolean(sale.hasInvestor),
    investorNames: sale.investorNames || [],
  });
  const [distributingProfit, setDistributingProfit] = useState(false);
  const [distributedSuccess, setDistributedSuccess] = useState(false);
  const [distributionError, setDistributionError] = useState("");

  const payNum = Number(amount) || 0;
  const newRemaining = Math.max(0, sale.remainingAmount - payNum);
  const isNowSettled = newRemaining === 0;

  const handleExecuteProfitShareNow = async () => {
    setDistributingProfit(true);
    setDistributionError("");
    try {
      const res = await executeProfitDistribution(sale.id);
      if (!res.success) {
        throw new Error(res.error || "Gagal memproses bagi hasil.");
      }
      setDistributedSuccess(true);
    } catch (err: any) {
      setDistributionError(err.message || "Gagal memproses pembagian laba.");
    } finally {
      setDistributingProfit(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setErrorMsg("Nominal pembayaran harus lebih dari Rp 0");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await addSalePaymentAction({
        saleId: sale.id,
        amount: Number(amount),
        paidAt: new Date(paidAt),
        method,
        tradeInVehicleId: method === "TRADE_IN" ? tradeInVehicleId : undefined,
        notes: notes || undefined,
        proofUrl: proofUrls.length > 0 ? JSON.stringify(proofUrls) : undefined,
      });

      if (!res.success) {
        throw new Error(res.error || "Gagal mencatat pembayaran");
      }

      if (isNowSettled) {
        const hasInv = (res.data as any)?.hasInvestor ?? Boolean(sale.hasInvestor);
        const invNames = (res.data as any)?.investorNames ?? sale.investorNames ?? [];
        setSettlementInfo({ hasInvestor: hasInv, investorNames: invNames });
        setSettlementModalOpen(true);
        setLoading(false);
      } else {
        setSuccessMsg("Angsuran berhasil dicatat! Mengalihkan...");
        setTimeout(() => {
          router.push("/admin/sales");
          router.refresh();
        }, 1000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal mencatat pembayaran");
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9D4CB] pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/sales"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#D9D4CB] text-[#1C1917] hover:bg-[#EFECE8] font-semibold text-xs transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-[#6B6560]" />
            <span>Kembali ke Penjualan</span>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#1C1917]">
              Catat Pembayaran Masuk / Pelunasan
            </h1>
            <p className="text-xs text-[#6B6560]">
              Pencatatan angsuran tempo atau pelunasan penjualan unit mobil.
            </p>
          </div>
        </div>
      </div>

      {/* Info Card Unit & Buyer */}
      <div className="bg-[#EFECE8] border border-[#D9D4CB] rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-white rounded-xl border border-[#D9D4CB] text-[#D97706]">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base text-[#1C1917]">
                {sale.vehicle.brand} {sale.vehicle.model}
              </span>
              <span className="text-xs font-mono font-bold text-[#D97706] bg-white px-2 py-0.5 rounded border border-[#D9D4CB]">
                {sale.vehicle.plateNumber}
              </span>
            </div>
            <div className="text-xs text-[#6B6560] mt-1 flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-[#6B6560]" />
              <span>Pembeli: <strong>{sale.buyer.name}</strong></span>
              {sale.buyer.isShowroom && (
                <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.2 rounded-full font-bold">
                  Showroom Rekanan
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 border-t md:border-t-0 md:border-l border-[#D9D4CB] pt-3 md:pt-0 md:pl-5 text-right">
          <div>
            <span className="text-[10px] text-[#6B6560] block font-medium">Harga Jual</span>
            <span className="text-xs font-bold text-[#1C1917]">
              {formatRupiah(sale.sellingPrice)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[#6B6560] block font-medium">Sudah Masuk</span>
            <span className="text-xs font-bold text-emerald-600">
              {formatRupiah(sale.paidAmount)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[#6B6560] block font-bold">Sisa Piutang</span>
            <span className="text-xs font-extrabold text-[#D97706]">
              {formatRupiah(sale.remainingAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border border-[#D9D4CB] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#EBE7E1] pb-3">
            <DollarSign className="w-4 h-4 text-[#D97706]" />
            <h2 className="text-sm font-bold text-[#1C1917] uppercase tracking-wider">
              Form Pencatatan Pembayaran
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                Nominal Pembayaran Masuk (Rp) *
              </label>
              <input
                required
                type="number"
                min={1}
                max={sale.remainingAmount}
                value={amount}
                onChange={(e) =>
                  setAmount(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-bold text-[#16A34A] focus:outline-none focus:ring-2 focus:ring-[#16A34A]/40"
              />
              <span className="text-[10px] text-[#6B6560] mt-1 block">
                Maksimal sisa piutang: {formatRupiah(sale.remainingAmount)}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                Metode Pembayaran
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-semibold text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
              >
                <option value="TRANSFER">Transfer Bank (BCA Rekening Showroom)</option>
                <option value="CASH">Uang Tunai (Cash di Garasi)</option>
                <option value="TRADE_IN">Tukar Tambah (Trade-In Unit)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                Tanggal Pembayaran *
              </label>
              <input
                required
                type="date"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-medium text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
              />
            </div>
          </div>

          {method === "TRADE_IN" && (
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
              <label className="block text-xs font-semibold text-amber-950 mb-1">
                Pilih Unit Tukar Tambah (Trade-In dari Konsumen)
              </label>
              <select
                value={tradeInVehicleId}
                onChange={(e) => setTradeInVehicleId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl text-sm font-semibold text-[#1C1917]"
              >
                <option value="">-- Pilih unit intake trade-in --</option>
                {availableVehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.plateNumber} — {v.brand} {v.model} ({v.year})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-amber-800">
                Pilih mobil yang diserahkan konsumen sebagai pengganti nominal pembayaran.
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
              Catatan Pembayaran (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: Transfer via m-BCA a.n. Bambang Sutrisno..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
            />
          </div>

          {/* Proof Upload */}
          <ProofUploadField
            label="Lampiran Bukti Pembayaran / Transfer / Screenshot (Bisa Beberapa)"
            value={proofUrls}
            onChange={setProofUrls}
            uploadType="TRANSFER_PROOF"
            saleId={sale.id}
          />
        </div>

        {/* Live Calculation */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-amber-950">
            <Receipt className="w-4 h-4 text-amber-700" />
            <span className="font-semibold">
              Status Piutang Setelah Pembayaran Ini:
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[#6B6560]">
              Sisa Baru: <strong>{formatRupiah(newRemaining)}</strong>
            </span>
            {isNowSettled ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#1C1917] text-white">
                <Check className="w-3 h-3" />
                LUNAS 100% (Settled)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-200 text-amber-900">
                <Clock className="w-3 h-3" />
                Masih Ada Tempo
              </span>
            )}
          </div>
        </div>

        {/* Riwayat Pembayaran Sebelumnya */}
        <div className="bg-white border border-[#D9D4CB] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-[#1C1917] uppercase tracking-wider flex items-center gap-2 border-b border-[#EBE7E1] pb-3">
            <CreditCard className="w-4 h-4 text-[#D97706]" />
            <span>Riwayat Pembayaran Sebelumnya ({sale.payments.length})</span>
          </h2>

          {sale.payments.length === 0 ? (
            <p className="text-xs text-[#6B6560] py-2">
              Belum ada mutasi pembayaran yang tercatat untuk transaksi ini.
            </p>
          ) : (
            <div className="divide-y divide-[#EBE7E1]">
              {sale.payments.map((p, idx) => (
                <div
                  key={p.id}
                  className="py-3 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#EFECE8] flex items-center justify-center font-bold text-[10px] text-[#6B6560]">
                      #{idx + 1}
                    </span>
                    <div>
                      <span className="font-bold text-[#1C1917] block">
                        {formatRupiah(p.amount)}
                      </span>
                      <span className="text-[11px] text-[#6B6560]">
                        {formatDate(p.paidAt)} • Metode: {p.method}
                        {p.notes ? ` • ${p.notes}` : ""}
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold">
                    Masuk Rekening Showroom
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Actions Bar */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 bg-[#EFECE8] border border-[#D9D4CB] rounded-2xl p-4">
          <Link
            href="/admin/sales"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#D9D4CB] bg-white text-center text-sm font-semibold text-[#6B6560] hover:text-[#1C1917] hover:bg-[#F7F5F2] transition-colors shadow-xs"
          >
            Batal & Kembali
          </Link>

          <button
            type="submit"
            disabled={loading || !amount || Number(amount) <= 0}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-[#D97706] hover:bg-[#92400E] text-white rounded-xl text-sm font-bold shadow-md transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan Pembayaran...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Simpan Pembayaran Masuk</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* ── SETTLEMENT SUCCESS & INVESTOR PROFIT SHARE MODAL ── */}
      {settlementModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-stone-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header Dialog */}
            <div className="bg-gradient-to-br from-[#1C1917] via-[#292524] to-[#1C1917] text-white p-6 relative">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-400 text-white flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
                  {settlementInfo.hasInvestor ? (
                    <HeartHandshake className="w-6 h-6" />
                  ) : (
                    <CheckCircle className="w-6 h-6 text-white" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                      Lunas 100% • Settled
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-white mt-1">
                    Pembayaran Lunas Berhasil Dicatat!
                  </h3>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-800 text-xs text-stone-300 flex items-center justify-between">
                <span>
                  <strong>{sale.vehicle.brand} {sale.vehicle.model}</strong> ({sale.vehicle.plateNumber})
                </span>
                <span className="text-emerald-400 font-bold">
                  {formatRupiah(sale.sellingPrice)}
                </span>
              </div>
            </div>

            {/* Content Dialog */}
            <div className="p-6 space-y-5">
              {/* Notifikasi Investor vs Modal Sendiri */}
              {settlementInfo.hasInvestor ? (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50/60 border border-amber-200 rounded-2xl p-4.5 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0 mt-0.5">
                      <Coins className="w-5 h-5 text-amber-700" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-sm text-[#78350F]">
                        Unit Mobil Didanai Investor
                      </h4>
                      <p className="text-xs text-[#92400E] leading-relaxed">
                        Mobil ini didanai oleh pemodal:{" "}
                        <strong className="text-stone-900 font-bold">
                          {settlementInfo.investorNames.length > 0
                            ? settlementInfo.investorNames.join(", ")
                            : "Investor Rekanan"}
                        </strong>
                        . Pokok modal dan dividen laba kini siap dibagikan secara otomatis.
                      </p>
                    </div>
                  </div>

                  {distributionError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                      <span>{distributionError}</span>
                    </div>
                  )}

                  {distributedSuccess ? (
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-2">
                      <div className="flex items-center gap-2 font-bold text-emerald-800">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span>Bagi Hasil Sukses Dieksekusi!</span>
                      </div>
                      <p className="text-[11px] text-emerald-700 leading-relaxed">
                        Snapshot aturan deterministik tersimpan, mutasi Capital Ledger tercatat, dan sisa laba bersih masuk kas showroom.
                      </p>
                      <Link
                        href="/admin/investors/history"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 underline hover:text-emerald-900 pt-1"
                      >
                        <span>Buka Riwayat Bagi Hasil Investor</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleExecuteProfitShareNow}
                      disabled={distributingProfit}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                    >
                      {distributingProfit ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Mengeksekusi Bagi Hasil...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Eksekusi Bagi Hasil Investor Sekarang (1-Klik)</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              ) : (
                <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4.5 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 shrink-0">
                    <CheckCircle className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-emerald-950">
                      100% Modal Mandiri Showroom
                    </h4>
                    <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                      Unit ini tidak memiliki investor eksternal. Seluruh penerimaan pembayaran dan laba kotor sebesar{" "}
                      <strong>+{formatRupiah(sale.grossProfit || 0)}</strong> telah resmi masuk kas operasional Nur Mobil.
                    </p>
                  </div>
                </div>
              )}

              {/* Dokumen Serah Terima Resmi */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
                  Cetak Dokumen Transaksi Resmi:
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  <a
                    href={`/api/pdf/bast/${sale.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl border border-stone-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all flex items-center gap-2 text-xs font-bold text-stone-800"
                  >
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>Cetak BAST (PDF)</span>
                  </a>

                  <a
                    href={`/api/pdf/invoice/${sale.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl border border-stone-200 hover:border-stone-800 hover:bg-stone-50 transition-all flex items-center gap-2 text-xs font-bold text-stone-800"
                  >
                    <Printer className="w-4 h-4 text-stone-700" />
                    <span>Kuitansi Lunas (PDF)</span>
                  </a>
                </div>
              </div>

              {/* Tombol Selesai */}
              <div className="pt-2 flex items-center justify-between gap-3 border-t border-stone-100">
                <Link
                  href="/admin/sales"
                  className="w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs text-center transition-colors shadow-sm"
                >
                  Selesai & Ke Daftar Penjualan
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

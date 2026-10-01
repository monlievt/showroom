"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Car,
  DollarSign,
  User,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Loader2,
  FileCheck,
  TrendingUp,
} from "lucide-react";
import { createSaleAction } from "@/app/actions/sale";
import { formatRupiah } from "@/lib/utils";

interface AvailableVehicle {
  id: string;
  plateNumber: string;
  brand: string;
  model: string;
  year: number;
  targetSellingPrice: number | null;
  minSellingPrice: number | null;
  totalHpp: number;
  status: string;
}

export function SaleNewClient({
  availableVehicles,
}: {
  availableVehicles: AvailableVehicle[];
}) {
  const router = useRouter();

  const [vehicleId, setVehicleId] = useState(availableVehicles[0]?.id || "");
  const [saleDate, setSaleDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [saleType, setSaleType] = useState("DIRECT_CUSTOMER");
  const [sellingPrice, setSellingPrice] = useState<number | "">(
    availableVehicles[0]?.targetSellingPrice || ""
  );
  const [dueDate, setDueDate] = useState("");

  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerIsShowroom, setBuyerIsShowroom] = useState(false);
  const [buyerAddress, setBuyerAddress] = useState("");

  const [initialPaymentAmount, setInitialPaymentAmount] = useState<number | "">(
    ""
  );
  const [initialPaymentMethod, setInitialPaymentMethod] = useState("TRANSFER");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const selectedUnit = availableVehicles.find((v) => v.id === vehicleId);

  const priceNum = Number(sellingPrice) || 0;
  const initialNum = Number(initialPaymentAmount) || 0;
  const remainingPiutang = Math.max(0, priceNum - initialNum);
  const estimatedGrossProfit = selectedUnit
    ? priceNum - selectedUnit.totalHpp
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId) {
      setErrorMsg("Pilih unit kendaraan yang dijual");
      return;
    }
    if (!sellingPrice || Number(sellingPrice) <= 0) {
      setErrorMsg("Harga kesepakatan jual harus diisi");
      return;
    }
    if (!buyerName.trim()) {
      setErrorMsg("Nama pembeli / showroom wajib diisi");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await createSaleAction({
        vehicleId,
        saleDate: new Date(saleDate),
        saleType: saleType as any,
        sellingPrice: Number(sellingPrice),
        dueDate: dueDate ? new Date(dueDate) : undefined,
        buyerName,
        buyerPhone: buyerPhone || undefined,
        buyerIsShowroom,
        buyerAddress: buyerAddress || undefined,
        initialPaymentAmount: initialPaymentAmount
          ? Number(initialPaymentAmount)
          : 0,
        initialPaymentMethod,
      });

      if (!res.success) {
        throw new Error(res.error || "Gagal mencatat penjualan unit");
      }

      setSuccessMsg(
        "Transaksi penjualan berhasil dicatat! Mengalihkan ke Buku Penjualan..."
      );
      setTimeout(() => {
        router.push("/admin/sales");
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal mencatat transaksi penjualan");
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
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
              Input Penjualan Unit Baru
            </h1>
            <p className="text-xs text-[#6B6560]">
              Pencatatan transaksi jual retail langsung atau lempar ke showroom rekanan (tempo 2 minggu).
            </p>
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
        {/* SECTION 1: Pilih Unit Kendaraan */}
        <div className="bg-white border border-[#D9D4CB] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#EBE7E1] pb-3">
            <Car className="w-4 h-4 text-[#D97706]" />
            <h2 className="text-sm font-bold text-[#1C1917] uppercase tracking-wider">
              1. Pilih Unit Kendaraan Siap Jual
            </h2>
          </div>

          {availableVehicles.length === 0 ? (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold">
              Tidak ada unit yang berstatus Ready Jual atau Booked di inventori saat ini.
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                Unit Kendaraan *
              </label>
              <select
                required
                value={vehicleId}
                onChange={(e) => {
                  setVehicleId(e.target.value);
                  const found = availableVehicles.find(
                    (v) => v.id === e.target.value
                  );
                  if (found?.targetSellingPrice) {
                    setSellingPrice(found.targetSellingPrice);
                  }
                }}
                className="w-full px-3.5 py-3 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-bold text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
              >
                {availableVehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.plateNumber} — {v.brand} {v.model} ({v.year}) • HPP:{" "}
                    {formatRupiah(v.totalHpp)}
                  </option>
                ))}
              </select>

              {selectedUnit && (
                <div className="flex flex-wrap items-center gap-4 text-xs mt-3 p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
                  <span>
                    HPP Berjalan:{" "}
                    <strong className="text-[#1C1917]">
                      {formatRupiah(selectedUnit.totalHpp)}
                    </strong>
                  </span>
                  {selectedUnit.targetSellingPrice && (
                    <span>
                      Target Banderol:{" "}
                      <strong className="text-[#16A34A]">
                        {formatRupiah(selectedUnit.targetSellingPrice)}
                      </strong>
                    </span>
                  )}
                  {selectedUnit.minSellingPrice && (
                    <span>
                      Batas Nego Net:{" "}
                      <strong className="text-[#92400E]">
                        {formatRupiah(selectedUnit.minSellingPrice)}
                      </strong>
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* SECTION 2: Nilai Transaksi & Jalur */}
        <div className="bg-white border border-[#D9D4CB] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#EBE7E1] pb-3">
            <DollarSign className="w-4 h-4 text-[#D97706]" />
            <h2 className="text-sm font-bold text-[#1C1917] uppercase tracking-wider">
              2. Harga Kesepakatan & Jalur Penjualan
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                Jalur Penjualan *
              </label>
              <select
                value={saleType}
                onChange={(e) => {
                  setSaleType(e.target.value);
                  setBuyerIsShowroom(e.target.value === "SHOWROOM");
                }}
                className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-semibold text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
              >
                <option value="DIRECT_CUSTOMER">
                  Konsumen Langsung (Retail)
                </option>
                <option value="SHOWROOM">
                  Showroom Rekanan (Wholesale / Tempo)
                </option>
              </select>
              <span className="text-[10px] text-[#6B6560] mt-1 block">
                Showroom tempo biasanya lunas 7-14 hari
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                Harga Kesepakatan Jual (Rp) *
              </label>
              <input
                required
                type="number"
                min={1}
                placeholder="Contoh: 165000000"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-bold text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                Tanggal Transaksi / SPK *
              </label>
              <input
                required
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-medium text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: Identitas Pembeli */}
        <div className="bg-white border border-[#D9D4CB] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#EBE7E1] pb-3">
            <User className="w-4 h-4 text-[#D97706]" />
            <h2 className="text-sm font-bold text-[#1C1917] uppercase tracking-wider">
              3. Identitas Pembeli / Showroom
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                Nama Pembeli / Nama Showroom *
              </label>
              <input
                required
                type="text"
                placeholder="Contoh: Bpk. Haryanto / Showroom Auto Lancar"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-semibold text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                Nomor WhatsApp / HP
              </label>
              <input
                type="text"
                placeholder="Contoh: 081234567890"
                value={buyerPhone}
                onChange={(e) => setBuyerPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
              Alamat Lengkap Pembeli (Opsional)
            </label>
            <input
              type="text"
              placeholder="Alamat KTP atau domisili showroom rekanan..."
              value={buyerAddress}
              onChange={(e) => setBuyerAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
            />
          </div>
        </div>

        {/* SECTION 4: Pembayaran Awal (DP) & Jatuh Tempo */}
        <div className="bg-white border border-[#D9D4CB] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#EBE7E1] pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#D97706]" />
              <h2 className="text-sm font-bold text-[#1C1917] uppercase tracking-wider">
                4. Pembayaran Awal (DP) & Jatuh Tempo
              </h2>
            </div>
            <span className="text-[11px] text-[#6B6560]">
              Kosongkan jika tempo bayar 100% saat pelunasan
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                Nominal DP / Pembayaran Masuk (Rp)
              </label>
              <input
                type="number"
                min={0}
                placeholder="Contoh: 20000000"
                value={initialPaymentAmount}
                onChange={(e) =>
                  setInitialPaymentAmount(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-bold text-[#16A34A] focus:outline-none focus:ring-2 focus:ring-[#16A34A]/40"
              />
              <span className="text-[10px] text-[#6B6560] mt-1 block">
                Jika sama dengan harga jual = LUNAS langsung
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                Metode Pembayaran
              </label>
              <select
                value={initialPaymentMethod}
                onChange={(e) => setInitialPaymentMethod(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-semibold text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
              >
                <option value="TRANSFER">Transfer Bank (BCA Rekening Showroom)</option>
                <option value="CASH">Uang Tunai (Cash di Garasi)</option>
                <option value="TRADE_IN">Tukar Tambah (Trade-In Unit)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                Target Jatuh Tempo Pelunasan
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-medium text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
              />
              <span className="text-[10px] text-[#6B6560] mt-1 block">
                Batas waktu 2 minggu atau sesuai kesepakatan
              </span>
            </div>
          </div>
        </div>

        {/* Live Transaction Summary Card */}
        <div className="bg-[#1C1917] text-white rounded-2xl p-5 sm:p-6 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-wider text-white/60 font-semibold block flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-[#D97706]" />
              <span>Ringkasan Kesepakatan Transaksi</span>
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#D97706]">
                {formatRupiah(priceNum)}
              </span>
              <span className="text-xs text-white/70">total harga jual</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 border-t md:border-t-0 md:border-l border-white/20 pt-4 md:pt-0 md:pl-6 text-right">
            <div>
              <span className="text-[10px] text-white/60 block">DP Masuk</span>
              <span className="text-xs font-bold text-emerald-400">
                {formatRupiah(initialNum)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-white/60 block">Sisa Piutang</span>
              <span className="text-xs font-bold text-amber-400">
                {formatRupiah(remainingPiutang)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-white/60 block">Estimasi Gross Profit</span>
              <span className="text-xs font-bold text-white flex items-center justify-end gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                {formatRupiah(estimatedGrossProfit)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 bg-[#EFECE8] border border-[#D9D4CB] rounded-2xl p-4">
          <Link
            href="/admin/sales"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#D9D4CB] bg-white text-center text-sm font-semibold text-[#6B6560] hover:text-[#1C1917] hover:bg-[#F7F5F2] transition-colors shadow-xs"
          >
            Batal & Kembali
          </Link>

          <button
            type="submit"
            disabled={loading || availableVehicles.length === 0}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-[#D97706] hover:bg-[#92400E] text-white rounded-xl text-sm font-bold shadow-md transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan Transaksi...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Simpan Penjualan & Terbitkan Kuitansi</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

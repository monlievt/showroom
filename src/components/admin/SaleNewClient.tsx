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
  ShieldAlert,
  ShieldCheck,
  Camera,
  FileText,
  Upload,
  CheckSquare,
  Square,
  Trash2,
  Eye,
  FileUp,
  Users,
  Gauge,
  ClipboardCheck,
  Receipt,
  FileBadge,
} from "lucide-react";
import { createSaleAction } from "@/app/actions/sale";
import { formatRupiah, cn, formatThousands, parseThousands } from "@/lib/utils";

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

const DEFAULT_CHECKLIST = [
  { id: "BPKB_ORIGINAL", label: "BPKB Asli & Faktur Pembelian Asli" },
  { id: "STNK_ORIGINAL", label: "STNK Asli & Bukti Pajak Berjalan" },
  { id: "SPK_BAST_SIGNED", label: "BAST Bertandatangan & Bermeterai" },
  { id: "SPARE_KEY", label: "Kunci Cadangan / Serep (2 Pcs Lengkap)" },
  { id: "MANUAL_BOOK", label: "Buku Manual & Buku Rekam Servis" },
  { id: "SPARE_TIRE_TOOLKIT", label: "Ban Serep, Dongkrak & Tool Kit Lengkap" },
];

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

  // State Serah Terima Fisik & Dokumen Legalitas
  const [handoverOdometer, setHandoverOdometer] = useState<number | "">("");
  const [handoverPhotoUrl, setHandoverPhotoUrl] = useState("");
  const [bastDocUrl, setBastDocUrl] = useState("");
  const [paymentReceiptUrl, setPaymentReceiptUrl] = useState("");
  const [buyerIdCardUrl, setBuyerIdCardUrl] = useState("");
  const [handoverChecklist, setHandoverChecklist] = useState<string[]>([
    "BPKB_ORIGINAL",
    "STNK_ORIGINAL",
    "SPK_BAST_SIGNED",
    "SPARE_KEY",
    "SPARE_TIRE_TOOLKIT",
  ]);
  const [handoverNotes, setHandoverNotes] = useState("");

  // State Komisi Makelar / Mediator
  const [brokerName, setBrokerName] = useState("");
  const [brokerFee, setBrokerFee] = useState<number | "">("");

  // Upload loading states
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingBast, setUploadingBast] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [uploadingKtp, setUploadingKtp] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const selectedUnit = availableVehicles.find((v) => v.id === vehicleId);

  const priceNum = Number(sellingPrice) || 0;
  const initialNum = Number(initialPaymentAmount) || 0;
  const brokerFeeNum = Number(brokerFee) || 0;
  const remainingPiutang = Math.max(0, priceNum - initialNum);
  const estimatedGrossProfit = selectedUnit
    ? priceNum - selectedUnit.totalHpp - brokerFeeNum
    : 0;

  // Kebijakan Cash Tempo Khusus Nur Mobil
  const isTempo = priceNum > 0 && initialNum < priceNum;
  const minDp70 = Math.ceil(priceNum * 0.7);
  const isDpValid = !isTempo || initialNum >= minDp70;
  const maxDueDate = new Date(new Date(saleDate).getTime() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  // Helper upload file langsung ke /api/upload
  const handleFileUpload = async (
    file: File,
    uploadType: "PHOTO" | "DOCUMENT" | "RECEIPT",
    setLoadingState: (val: boolean) => void,
    setUrlState: (url: string) => void,
    docType?: string,
    tag?: string,
    title?: string
  ) => {
    if (!vehicleId) {
      setErrorMsg("Pilih unit kendaraan terlebih dahulu sebelum mengunggah file.");
      return;
    }
    setLoadingState(true);
    setErrorMsg("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("vehicleId", vehicleId);
      formData.append("uploadType", uploadType);
      if (uploadType === "PHOTO") {
        formData.append("category", "DOCUMENT_PROOF");
        if (tag) formData.append("tag", tag);
        if (title) formData.append("title", title);
      } else {
        if (docType) formData.append("docType", docType);
      }

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Gagal mengunggah file");
      }

      setUrlState(data.fileUrl);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal mengunggah file");
    } finally {
      setLoadingState(false);
    }
  };

  const toggleChecklistItem = (itemId: string) => {
    setHandoverChecklist((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

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

    if (isTempo) {
      if (initialNum < minDp70) {
        setErrorMsg(
          `Kebijakan Nur Mobil: Pembelian Cash Tempo wajib DP minimal 70% (${formatRupiah(minDp70)}). Tidak melayani kredit.`
        );
        return;
      }
      if (!dueDate) {
        setErrorMsg("Tanggal jatuh tempo pelunasan wajib diisi untuk transaksi tempo.");
        return;
      }
      const saleTime = new Date(saleDate).getTime();
      const dueTime = new Date(dueDate).getTime();
      const diffDays = Math.ceil((dueTime - saleTime) / (1000 * 60 * 60 * 24));
      if (diffDays > 30 || diffDays < 0) {
        setErrorMsg(
          "Kebijakan Nur Mobil: Batas jatuh tempo Cash Tempo maksimal 30 hari (1 bulan) dari tanggal transaksi."
        );
        return;
      }
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
        handoverOdometer: handoverOdometer ? Number(handoverOdometer) : undefined,
        handoverPhotoUrl: handoverPhotoUrl || undefined,
        bastDocUrl: bastDocUrl || undefined,
        paymentReceiptUrl: paymentReceiptUrl || undefined,
        buyerIdCardUrl: buyerIdCardUrl || undefined,
        handoverChecklist,
        handoverNotes: handoverNotes || undefined,
        brokerName: brokerName || undefined,
        brokerFee: brokerFee ? Number(brokerFee) : undefined,
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
                type="text"
                inputMode="numeric"
                placeholder="Contoh: 165.000.000"
                value={sellingPrice !== "" ? formatThousands(sellingPrice) : ""}
                onChange={(e) => setSellingPrice(parseThousands(e.target.value) || "")}
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
                4. Pembayaran Awal (DP) & Ketentuan Cash Tempo
              </h2>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">
              100% Cash / Tempo Internal Garasi (Non-Leasing)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                Nominal DP / Pembayaran Masuk (Rp) *
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Contoh: 105.000.000"
                value={initialPaymentAmount !== "" ? formatThousands(initialPaymentAmount) : ""}
                onChange={(e) => setInitialPaymentAmount(parseThousands(e.target.value) || "")}
                className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-bold text-[#16A34A] focus:outline-none focus:ring-2 focus:ring-[#16A34A]/40"
              />
              <span className="text-[10px] text-[#6B6560] mt-1 block">
                {priceNum > 0 && (
                  <>
                    Min. DP 70% Tempo: <strong>{formatRupiah(minDp70)}</strong>
                  </>
                )}
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
                Target Jatuh Tempo Pelunasan {isTempo && <span className="text-red-500">*</span>}
              </label>
              <input
                type="date"
                min={saleDate}
                max={maxDueDate}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-medium text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
              />
              <span className="text-[10px] text-[#6B6560] mt-1 block">
                Batas maksimal 30 hari (s/d {maxDueDate})
              </span>
            </div>
          </div>

          {/* Banner Kebijakan Cash Tempo Khusus Nur Mobil */}
          {isTempo && (
            <div className="space-y-2 pt-1">
              {!isDpValid ? (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold block">DP Kurang dari Batas Minimal 70%!</strong>
                    <p className="mt-0.5 text-[11px] leading-relaxed">
                      Sesuai aturan garasi Nur Mobil, pembelian tempo wajib membayar DP minimal 70% ({formatRupiah(minDp70)}). Sisa maksimal 30% ({formatRupiah(priceNum - minDp70)}) diselesaikan dalam 30 hari.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-950 text-xs flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold text-[#78350F] block">
                      Ketentuan Jaminan Dokumen Cash Tempo Nur Mobil
                    </strong>
                    <p className="mt-0.5 text-[11px] text-[#92400E] leading-relaxed">
                      Asli BPKB dan Asli STNK <strong>wajib ditahan di brankas showroom</strong> sampai sisa pelunasan 100% diterima. Konsumen hanya memegang Surat Jalan resmi sementara.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* SECTION 4: Serah Terima, Berkas Legalitas & Checklist Keluar */}
        <div className="bg-white border border-[#D9D4CB] rounded-2xl p-5 sm:p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-[#EBE7E1] pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-[#D97706]" />
              <div>
                <h2 className="text-sm font-bold text-[#1C1917] uppercase tracking-wider">
                  4. Berkas Legalitas, Dokumen Tanda Tangan & Serah Terima
                </h2>
                <p className="text-[11px] text-[#6B6560]">
                  Unggah berkas BAST bermeterai, bukti kuitansi pelunasan, foto serah kunci, dan verifikasi checklist berkas asli.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              SOP Serah Terima Nur Mobil
            </span>
          </div>

          {/* 4A. GRID UPLOAD BERKAS BUKTI & FOTO */}
          <div>
            <label className="block text-xs font-bold text-[#1C1917] mb-3 flex items-center gap-1.5">
              <FileUp className="w-4 h-4 text-[#D97706]" />
              <span>Arsip Dokumen Fisik & Foto Bukti Transaksi</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Foto Serah Terima */}
              <div className="border border-[#D9D4CB] rounded-xl p-3.5 bg-[#FAF9F6] flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1C1917] flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-[#D97706]" />
                      <span>Foto Serah Terima</span>
                    </span>
                    {handoverPhotoUrl && (
                      <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                        ✓ Terunggah
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-[#6B6560] leading-snug">
                    Foto konsumen & kunci mobil saat serah terima unit di showroom / rumah.
                  </p>
                </div>

                {handoverPhotoUrl ? (
                  <div className="space-y-2">
                    <div className="h-24 w-full rounded-lg overflow-hidden border border-emerald-300 relative bg-black/5">
                      <img
                        src={handoverPhotoUrl}
                        alt="Serah Terima"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setHandoverPhotoUrl("")}
                      className="w-full py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50 rounded border border-red-200 flex items-center justify-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Hapus / Ganti</span>
                    </button>
                  </div>
                ) : (
                  <div>
                    <label className="w-full py-2.5 px-3 border border-dashed border-[#D9D4CB] hover:border-[#D97706] rounded-xl bg-white hover:bg-amber-50/50 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors text-center">
                      {uploadingPhoto ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[#D97706]" />
                      ) : (
                        <Upload className="w-4 h-4 text-[#D97706]" />
                      )}
                      <span className="text-[11px] font-bold text-[#1C1917]">
                        {uploadingPhoto ? "Mengunggah..." : "Pilih Foto Unit"}
                      </span>
                      <span className="text-[9px] text-[#6B6560]">JPG / PNG / WebP</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        disabled={uploadingPhoto}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(
                              file,
                              "PHOTO",
                              setUploadingPhoto,
                              setHandoverPhotoUrl,
                              undefined,
                              "HANDOVER_DELIVERY",
                              "Foto Serah Terima Unit ke Pembeli"
                            );
                          }
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* 2. Scan BAST Bertandatangan */}
              <div className="border border-[#D9D4CB] rounded-xl p-3.5 bg-[#FAF9F6] flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1C1917] flex items-center gap-1.5">
                      <FileBadge className="w-3.5 h-3.5 text-[#D97706]" />
                      <span>BAST Bertandatangan</span>
                    </span>
                    {bastDocUrl && (
                      <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                        ✓ Terunggah
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-[#6B6560] leading-snug">
                    Scan Berita Acara Serah Terima (BAST) bermeterai 10.000 yang ditandatangani.
                  </p>
                </div>

                {bastDocUrl ? (
                  <div className="space-y-2">
                    <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-center">
                      <span className="text-[11px] font-bold text-emerald-800 block truncate">
                        BAST Tersimpan
                      </span>
                      <a
                        href={bastDocUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-[#D97706] hover:underline inline-flex items-center gap-1 mt-1 font-semibold"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Buka Berkas</span>
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBastDocUrl("")}
                      className="w-full py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50 rounded border border-red-200 flex items-center justify-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Hapus / Ganti</span>
                    </button>
                  </div>
                ) : (
                  <div>
                    <label className="w-full py-2.5 px-3 border border-dashed border-[#D9D4CB] hover:border-[#D97706] rounded-xl bg-white hover:bg-amber-50/50 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors text-center">
                      {uploadingBast ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[#D97706]" />
                      ) : (
                        <Upload className="w-4 h-4 text-[#D97706]" />
                      )}
                      <span className="text-[11px] font-bold text-[#1C1917]">
                        {uploadingBast ? "Mengunggah..." : "Upload File BAST"}
                      </span>
                      <span className="text-[9px] text-[#6B6560]">PDF / JPG / PNG</span>
                      <input
                        type="file"
                        accept="application/pdf,image/jpeg,image/png,image/webp"
                        className="hidden"
                        disabled={uploadingBast}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(
                              file,
                              "DOCUMENT",
                              setUploadingBast,
                              setBastDocUrl,
                              "OTHER"
                            );
                          }
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* 3. Kuitansi / Bukti Bayar */}
              <div className="border border-[#D9D4CB] rounded-xl p-3.5 bg-[#FAF9F6] flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1C1917] flex items-center gap-1.5">
                      <Receipt className="w-3.5 h-3.5 text-[#D97706]" />
                      <span>Bukti Pelunasan / Kuitansi</span>
                    </span>
                    {paymentReceiptUrl && (
                      <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                        ✓ Terunggah
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-[#6B6560] leading-snug">
                    Slip transfer rekening BCA showroom atau kuitansi fisik cap lunas.
                  </p>
                </div>

                {paymentReceiptUrl ? (
                  <div className="space-y-2">
                    <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-center">
                      <span className="text-[11px] font-bold text-emerald-800 block truncate">
                        Bukti Bayar Tersimpan
                      </span>
                      <a
                        href={paymentReceiptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-[#D97706] hover:underline inline-flex items-center gap-1 mt-1 font-semibold"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Buka Berkas</span>
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPaymentReceiptUrl("")}
                      className="w-full py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50 rounded border border-red-200 flex items-center justify-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Hapus / Ganti</span>
                    </button>
                  </div>
                ) : (
                  <div>
                    <label className="w-full py-2.5 px-3 border border-dashed border-[#D9D4CB] hover:border-[#D97706] rounded-xl bg-white hover:bg-amber-50/50 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors text-center">
                      {uploadingReceipt ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[#D97706]" />
                      ) : (
                        <Upload className="w-4 h-4 text-[#D97706]" />
                      )}
                      <span className="text-[11px] font-bold text-[#1C1917]">
                        {uploadingReceipt ? "Mengunggah..." : "Upload Slip / Kuitansi"}
                      </span>
                      <span className="text-[9px] text-[#6B6560]">PDF / JPG / PNG</span>
                      <input
                        type="file"
                        accept="application/pdf,image/jpeg,image/png,image/webp"
                        className="hidden"
                        disabled={uploadingReceipt}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(
                              file,
                              "DOCUMENT",
                              setUploadingReceipt,
                              setPaymentReceiptUrl,
                              "KUITANSI"
                            );
                          }
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* 4. Foto KTP Pembeli */}
              <div className="border border-[#D9D4CB] rounded-xl p-3.5 bg-[#FAF9F6] flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1C1917] flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#D97706]" />
                      <span>Foto KTP Pembeli</span>
                    </span>
                    {buyerIdCardUrl && (
                      <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                        ✓ Terunggah
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-[#6B6560] leading-snug">
                    Arsip identitas resmi pembeli untuk lapor jual Samsat & balik nama.
                  </p>
                </div>

                {buyerIdCardUrl ? (
                  <div className="space-y-2">
                    <div className="h-24 w-full rounded-lg overflow-hidden border border-emerald-300 relative bg-black/5">
                      <img
                        src={buyerIdCardUrl}
                        alt="KTP Pembeli"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setBuyerIdCardUrl("")}
                      className="w-full py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50 rounded border border-red-200 flex items-center justify-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Hapus / Ganti</span>
                    </button>
                  </div>
                ) : (
                  <div>
                    <label className="w-full py-2.5 px-3 border border-dashed border-[#D9D4CB] hover:border-[#D97706] rounded-xl bg-white hover:bg-amber-50/50 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors text-center">
                      {uploadingKtp ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[#D97706]" />
                      ) : (
                        <Upload className="w-4 h-4 text-[#D97706]" />
                      )}
                      <span className="text-[11px] font-bold text-[#1C1917]">
                        {uploadingKtp ? "Mengunggah..." : "Upload Foto KTP"}
                      </span>
                      <span className="text-[9px] text-[#6B6560]">JPG / PNG / WebP</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        disabled={uploadingKtp}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(
                              file,
                              "DOCUMENT",
                              setUploadingKtp,
                              setBuyerIdCardUrl,
                              "KTP_PEMILIK"
                            );
                          }
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4B. ODOMETER TERAKHIR & CATATAN SERAH TERIMA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#EBE7E1]">
            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1.5 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-[#D97706]" />
                <span>Odometer Terakhir Saat Serah Terima (KM)</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Contoh: 19.850"
                value={handoverOdometer !== "" ? formatThousands(handoverOdometer) : ""}
                onChange={(e) => setHandoverOdometer(parseThousands(e.target.value) || "")}
                className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-semibold text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
              />
              <span className="text-[10px] text-[#6B6560] mt-1 block">
                Patokan pasti batas klaim garansi toko (misal: 1 bulan / 1.000 KM).
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                Catatan Kondisi Unit Saat Keluar Garasi
              </label>
              <input
                type="text"
                placeholder="Contoh: Bensin terisi 1/2 tangki, sudah salon wax, garansi s/d 20.850 KM."
                value={handoverNotes}
                onChange={(e) => setHandoverNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F7F5F2] border border-[#D9D4CB] rounded-xl text-sm font-normal text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
              />
              <span className="text-[10px] text-[#6B6560] mt-1 block">
                Catatan khusus penyerahan unit kepada pembeli.
              </span>
            </div>
          </div>

          {/* 4C. CHECKLIST KELENGKAPAN BERKAS ASLI & DOKUMEN */}
          <div className="pt-2 border-t border-[#EBE7E1]">
            <label className="block text-xs font-bold text-[#1C1917] mb-2 flex items-center gap-1.5">
              <ClipboardCheck className="w-4 h-4 text-[#D97706]" />
              <span>Checklist Berkas Asli & Kelengkapan yang Diserahkan</span>
            </label>
            <p className="text-[11px] text-[#6B6560] mb-3">
              Centang item kelengkapan yang diserahterimakan langsung ke tangan konsumen.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {DEFAULT_CHECKLIST.map((item) => {
                const isChecked = handoverChecklist.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleChecklistItem(item.id)}
                    className={cn(
                      "flex items-center gap-2.5 p-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer",
                      isChecked
                        ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                        : "bg-[#FAF9F6] border-[#D9D4CB] text-[#6B6560] hover:bg-stone-100"
                    )}
                  >
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-emerald-700 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-[#A8A29E] shrink-0" />
                    )}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4D. KOMISI MAKELAR / MEDIATOR (JIKA ADA) */}
          <div className="pt-2 border-t border-[#EBE7E1] bg-stone-50/70 p-3.5 rounded-xl border border-stone-200">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-[#D97706]" />
              <span className="text-xs font-bold text-[#1C1917]">
                Komisi Makelar / Perantara Penjualan (Opsional)
              </span>
            </div>
            <p className="text-[11px] text-[#6B6560] mb-3">
              Jika penjualan melalui perantara, masukkan nama & komisi. Sistem otomatis memotong laba bersih transaksi.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-[#1C1917] mb-1">
                  Nama Makelar / Mediator
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Pak Bambang (Mediator Malang)"
                  value={brokerName}
                  onChange={(e) => setBrokerName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#D9D4CB] rounded-xl text-xs font-medium text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#1C1917] mb-1">
                  Nominal Komisi Makelar (Rp)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Contoh: 1.500.000"
                  value={brokerFee !== "" ? formatThousands(brokerFee) : ""}
                  onChange={(e) => setBrokerFee(parseThousands(e.target.value) || "")}
                  className="w-full px-3 py-2 bg-white border border-[#D9D4CB] rounded-xl text-xs font-bold text-[#D97706] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40"
                />
                {brokerFeeNum > 0 && (
                  <span className="text-[10px] text-[#D97706] mt-1 block font-semibold">
                    Komisi: {formatRupiah(brokerFeeNum)} (memotong laba kotor)
                  </span>
                )}
              </div>
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

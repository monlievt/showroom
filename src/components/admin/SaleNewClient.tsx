"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Car,
  User,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ChevronDown,
  Upload,
  Trash2,
  Eye,
  CheckSquare,
  Square,
  Info,
} from "lucide-react";
import { createSaleAction } from "@/app/actions/sale";
import {
  formatRupiah,
  cn,
  formatThousands,
  parseThousands,
  normalizePlateNumber,
  formatVehicleTitle,
  getTodayWibDateString,
} from "@/lib/utils";

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

interface SavedBuyer {
  id: string;
  name: string;
  phone: string;
  isShowroom: boolean;
  address: string;
  salesCount: number;
}

interface AlreadySoldInfo {
  saleId: string;
  plateNumber: string;
  brand: string;
  model: string;
  year: number;
  isFullyPaid: boolean;
}

const DEFAULT_CHECKLIST = [
  { id: "BPKB_ORIGINAL", label: "BPKB Asli & Faktur" },
  { id: "STNK_ORIGINAL", label: "STNK Asli & Pajak" },
  { id: "SPK_BAST_SIGNED", label: "BAST Bertandatangan" },
  { id: "SPARE_KEY", label: "Kunci Cadangan" },
  { id: "MANUAL_BOOK", label: "Buku Manual / Servis" },
  { id: "SPARE_TIRE_TOOLKIT", label: "Ban Serep & Dongkrak" },
];

const FALLBACK_PARTNERS = [
  { name: "Showroom Kcunk Motor", address: "Tulungagung, Jawa Timur", isShowroom: true },
  { name: "Balai Lelang JBA Surabaya", address: "Sidoarjo / Surabaya", isShowroom: true },
  { name: "Balai Lelang IBID Surabaya", address: "Surabaya", isShowroom: true },
];

function addDaysToDateStr(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  if (isNaN(d.getTime())) return dateStr;
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function SaleNewClient({
  availableVehicles,
  savedBuyers = [],
  initialVehicleId,
  alreadySoldInfo = null,
}: {
  availableVehicles: AvailableVehicle[];
  savedBuyers?: SavedBuyer[];
  initialVehicleId?: string;
  alreadySoldInfo?: AlreadySoldInfo | null;
}) {
  const router = useRouter();
  const topRef = useRef<HTMLDivElement>(null);

  const preselected = initialVehicleId
    ? availableVehicles.find((v) => v.id === initialVehicleId)
    : undefined;

  const [vehicleId, setVehicleId] = useState(
    preselected?.id || availableVehicles[0]?.id || ""
  );
  const [saleDate, setSaleDate] = useState(() => getTodayWibDateString());
  const [saleType, setSaleType] = useState<"DIRECT_CUSTOMER" | "SHOWROOM">("SHOWROOM");
  const [sellingPrice, setSellingPrice] = useState<number | "">("");

  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerIsShowroom, setBuyerIsShowroom] = useState(true);
  const [buyerAddress, setBuyerAddress] = useState("");

  // Mode pembayaran sederhana: LUNAS vs TEMPO
  const [paymentMode, setPaymentMode] = useState<"LUNAS" | "TEMPO">("LUNAS");
  const [initialPaymentAmount, setInitialPaymentAmount] = useState<number | "">("");
  const [initialPaymentMethod, setInitialPaymentMethod] = useState("TRANSFER");
  const [dueDate, setDueDate] = useState(() => addDaysToDateStr(getTodayWibDateString(), 14));

  // Bagian opsional (dilipat secara default agar tidak membingungkan di HP)
  const [showOptional, setShowOptional] = useState(false);
  const [handoverOdometer, setHandoverOdometer] = useState<number | "">("");
  const [handoverPhotoUrl, setHandoverPhotoUrl] = useState("");
  const [bastDocUrl, setBastDocUrl] = useState("");
  const [paymentReceiptUrl, setPaymentReceiptUrl] = useState("");
  const [buyerIdCardUrl, setBuyerIdCardUrl] = useState("");
  const [handoverChecklist, setHandoverChecklist] = useState<string[]>([
    "STNK_ORIGINAL",
    "SPARE_KEY",
  ]);
  const [handoverNotes, setHandoverNotes] = useState("");
  const [brokerName, setBrokerName] = useState("");
  const [brokerFee, setBrokerFee] = useState<number | "">("");

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingBast, setUploadingBast] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [uploadingKtp, setUploadingKtp] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const selectedUnit = availableVehicles.find((v) => v.id === vehicleId);
  const priceNum = Number(sellingPrice) || 0;
  const effectiveInitialPay =
    paymentMode === "LUNAS" ? priceNum : Number(initialPaymentAmount) || 0;
  const brokerFeeNum = Number(brokerFee) || 0;
  const remainingPiutang = Math.max(0, priceNum - effectiveInitialPay);
  const estimatedGrossProfit = selectedUnit
    ? priceNum - selectedUnit.totalHpp - brokerFeeNum
    : 0;

  // Peringatan lembut (tidak memblokir simpan)
  const minDp70 = Math.ceil(priceNum * 0.7);
  const showLowDpWarning =
    paymentMode === "TEMPO" &&
    saleType === "DIRECT_CUSTOMER" &&
    priceNum > 0 &&
    effectiveInitialPay < minDp70;

  const diffTempoDays =
    paymentMode === "TEMPO" && dueDate
      ? Math.ceil(
          (new Date(`${dueDate}T00:00:00`).getTime() -
            new Date(`${saleDate}T00:00:00`).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;
  const showLongTempoWarning = paymentMode === "TEMPO" && diffTempoDays > 30;

  // Gabungkan rekanan dari database + fallback bila database buyer masih kosong
  const quickPartners =
    savedBuyers.length > 0
      ? savedBuyers.slice(0, 6)
      : FALLBACK_PARTNERS.map((p, idx) => ({
          id: `fallback-${idx}`,
          name: p.name,
          phone: "",
          address: p.address,
          isShowroom: p.isShowroom,
          salesCount: 0,
        }));

  const showError = (msg: string) => {
    setErrorMsg(msg);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleFileUpload = async (
    file: File,
    uploadType: "PHOTO" | "DOCUMENT",
    setLoadingState: (val: boolean) => void,
    setUrlState: (url: string) => void,
    docType?: string,
    tag?: string,
    title?: string
  ) => {
    if (!vehicleId) {
      showError("Pilih unit kendaraan terlebih dahulu sebelum unggah berkas.");
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
      } else if (docType) {
        formData.append("docType", docType);
      }

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Gagal mengunggah file");
      }
      setUrlState(data.fileUrl);
    } catch (err: any) {
      showError(err.message || "Gagal mengunggah file");
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
      showError("Pilih unit kendaraan yang terjual terlebih dahulu.");
      return;
    }
    if (!sellingPrice || Number(sellingPrice) <= 0) {
      showError("Isi harga jual terlebih dahulu.");
      return;
    }
    if (!buyerName.trim()) {
      showError("Isi nama pembeli atau showroom terlebih dahulu.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await createSaleAction({
        vehicleId,
        saleDate: new Date(`${saleDate}T12:00:00+07:00`),
        saleType,
        sellingPrice: Number(sellingPrice),
        dueDate:
          paymentMode === "TEMPO" && dueDate
            ? new Date(`${dueDate}T12:00:00+07:00`)
            : undefined,
        buyerName: buyerName.trim(),
        buyerPhone: buyerPhone.trim() || undefined,
        buyerIsShowroom,
        buyerAddress: buyerAddress.trim() || undefined,
        initialPaymentAmount: effectiveInitialPay,
        initialPaymentMethod,
        handoverOdometer: handoverOdometer ? Number(handoverOdometer) : undefined,
        handoverPhotoUrl: handoverPhotoUrl || undefined,
        bastDocUrl: bastDocUrl || undefined,
        paymentReceiptUrl: paymentReceiptUrl || undefined,
        buyerIdCardUrl: buyerIdCardUrl || undefined,
        handoverChecklist: showOptional ? handoverChecklist : [],
        handoverNotes: handoverNotes.trim() || undefined,
        brokerName: brokerName.trim() || undefined,
        brokerFee: brokerFee ? Number(brokerFee) : undefined,
      });

      if (!res.success) {
        throw new Error(res.error || "Gagal menyimpan penjualan.");
      }

      setSuccessMsg("Penjualan berhasil disimpan! Membuka daftar penjualan...");
      setTimeout(() => {
        router.push("/admin/sales");
        router.refresh();
      }, 700);
    } catch (err: any) {
      showError(err.message || "Gagal menyimpan transaksi penjualan.");
      setLoading(false);
    }
  };

  return (
    <div ref={topRef} className="p-4 sm:p-6 max-w-3xl mx-auto space-y-5">
      {/* Navigasi Kembali Ringkas */}
      <div>
        <Link
          href="/admin/sales"
          className="inline-flex items-center gap-2 px-3.5 py-2 min-h-[44px] rounded-xl bg-white border border-[var(--line)] text-[var(--ink)] hover:bg-[var(--bg)] font-semibold text-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[var(--muted)]" />
          <span>Kembali ke Penjualan</span>
        </Link>
      </div>

      {/* Info Jika Unit dari URL Ternyata Sudah Pernah Dijual */}
      {alreadySoldInfo && (
        <div className="p-4 rounded-xl bg-[var(--warn-light)] border border-[var(--warn)]/40 text-sm space-y-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-[var(--ink)]">
                Unit {normalizePlateNumber(alreadySoldInfo.plateNumber)} (
                {formatVehicleTitle(
                  alreadySoldInfo.brand,
                  alreadySoldInfo.model,
                  alreadySoldInfo.year
                )}
                ) sudah memiliki catatan penjualan.
              </div>
              <p className="text-xs text-[var(--muted)] mt-1">
                {alreadySoldInfo.isFullyPaid
                  ? "Unit ini sudah lunas. Anda bisa melihat detail atau mencetak kuitansi."
                  : "Unit ini masih dalam status tempo / DP. Lanjutkan di halaman pembayaran untuk mencatat pelunasan."}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {!alreadySoldInfo.isFullyPaid && (
              <Link
                href={`/admin/sales/${alreadySoldInfo.saleId}/payment`}
                className="inline-flex items-center justify-center px-4 py-2.5 min-h-[44px] rounded-lg bg-[var(--accent)] text-white text-xs font-bold"
              >
                Catat Pelunasan / Cicilan
              </Link>
            )}
            <Link
              href={`/admin/sales/${alreadySoldInfo.saleId}`}
              className="inline-flex items-center justify-center px-4 py-2.5 min-h-[44px] rounded-lg bg-white border border-[var(--line)] text-[var(--ink)] text-xs font-bold"
            >
              Lihat / Edit Transaksi Ini
            </Link>
          </div>
        </div>
      )}

      {/* Banner Error / Sukses */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-[var(--bad-light)] border border-[var(--bad)]/30 text-[var(--bad)] text-xs sm:text-sm font-semibold flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-[var(--ok-light)] border border-[var(--ok)]/30 text-[var(--ok)] text-xs sm:text-sm font-semibold flex items-center gap-2.5">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ── 1. PILIH UNIT ── */}
        <section className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Car className="w-4 h-4 text-[var(--accent)]" />
            <h2 className="text-sm font-bold text-[var(--ink)]">1. Pilih Unit yang Terjual</h2>
          </div>

          {availableVehicles.length === 0 ? (
            <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--line)] text-xs sm:text-sm text-[var(--muted)]">
              Belum ada unit tersedia untuk dijual. Pastikan unit sudah masuk di menu{" "}
              <Link href="/admin/inventory" className="text-[var(--accent)] font-bold underline">
                Stok Unit
              </Link>
              .
            </div>
          ) : (
            <div className="space-y-2.5">
              <select
                required
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="w-full px-3.5 py-2.5 min-h-[48px] bg-[var(--bg)] border border-[var(--line-input)] rounded-xl text-sm font-semibold text-[var(--ink)]"
              >
                {availableVehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {normalizePlateNumber(v.plateNumber)} |{" "}
                    {formatVehicleTitle(v.brand, v.model, v.year)} (Modal:{" "}
                    {formatRupiah(v.totalHpp)})
                  </option>
                ))}
              </select>

              {selectedUnit && (
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs p-3 bg-[var(--bg)] border border-[var(--line)] rounded-xl">
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[var(--muted)]">
                    <span>
                      Total Modal:{" "}
                      <strong className="text-[var(--ink)]">
                        {formatRupiah(selectedUnit.totalHpp)}
                      </strong>
                    </span>
                    {selectedUnit.targetSellingPrice && (
                      <span>
                        Harga Web:{" "}
                        <strong className="text-[var(--ink)]">
                          {formatRupiah(selectedUnit.targetSellingPrice)}
                        </strong>
                      </span>
                    )}
                  </div>
                  {selectedUnit.targetSellingPrice && (
                    <button
                      type="button"
                      onClick={() => setSellingPrice(selectedUnit.targetSellingPrice!)}
                      className="px-3 py-1.5 min-h-[36px] rounded-lg bg-white border border-[var(--line)] text-[var(--accent)] font-bold text-xs hover:bg-[var(--surface)] cursor-pointer"
                    >
                      Pakai Harga Web
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── 2. PEMBELI / SHOWROOM ── */}
        <section className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-4 sm:p-5 space-y-3.5">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-[var(--accent)]" />
            <h2 className="text-sm font-bold text-[var(--ink)]">2. Pembeli / Showroom</h2>
          </div>

          {/* Toggle Tipe Pembeli */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setSaleType("SHOWROOM");
                setBuyerIsShowroom(true);
              }}
              className={cn(
                "px-3 py-2.5 min-h-[44px] rounded-xl text-xs sm:text-sm font-bold border transition-colors cursor-pointer",
                saleType === "SHOWROOM"
                  ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                  : "bg-[var(--bg)] text-[var(--ink)] border-[var(--line)]"
              )}
            >
              Showroom / Rekanan
            </button>
            <button
              type="button"
              onClick={() => {
                setSaleType("DIRECT_CUSTOMER");
                setBuyerIsShowroom(false);
              }}
              className={cn(
                "px-3 py-2.5 min-h-[44px] rounded-xl text-xs sm:text-sm font-bold border transition-colors cursor-pointer",
                saleType === "DIRECT_CUSTOMER"
                  ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                  : "bg-[var(--bg)] text-[var(--ink)] border-[var(--line)]"
              )}
            >
              Pembeli Langsung
            </button>
          </div>

          {/* Pilihan Cepat Rekanan Tersimpan */}
          {quickPartners.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-xs text-[var(--muted)] font-medium">
                Pilih cepat langganan:
              </div>
              <div className="flex flex-wrap gap-2">
                {quickPartners.map((partner) => {
                  const active = buyerName === partner.name;
                  return (
                    <button
                      key={partner.id}
                      type="button"
                      onClick={() => {
                        setSaleType(partner.isShowroom ? "SHOWROOM" : "DIRECT_CUSTOMER");
                        setBuyerIsShowroom(partner.isShowroom);
                        setBuyerName(partner.name);
                        setBuyerPhone(partner.phone || "");
                        setBuyerAddress(partner.address || "");
                      }}
                      className={cn(
                        "px-3 py-2 min-h-[40px] rounded-lg text-xs font-semibold border transition-colors cursor-pointer",
                        active
                          ? "bg-[var(--ink)] text-white border-[var(--ink)]"
                          : "bg-[var(--bg)] text-[var(--ink)] border-[var(--line)] hover:border-[var(--accent)]"
                      )}
                    >
                      {partner.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                Nama Pembeli / Showroom *
              </label>
              <input
                required
                type="text"
                placeholder="Contoh: Showroom Kcunk Motor / Pak Budi"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                className="w-full px-3.5 py-2.5 min-h-[46px] bg-[var(--bg)] border border-[var(--line-input)] rounded-xl text-sm font-medium text-[var(--ink)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                Nomor WhatsApp (Opsional)
              </label>
              <input
                type="tel"
                inputMode="tel"
                placeholder="Contoh: 082142502419"
                value={buyerPhone}
                onChange={(e) => setBuyerPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 min-h-[46px] bg-[var(--bg)] border border-[var(--line-input)] rounded-xl text-sm text-[var(--ink)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
              Kota / Alamat (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: Tulungagung"
              value={buyerAddress}
              onChange={(e) => setBuyerAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 min-h-[46px] bg-[var(--bg)] border border-[var(--line-input)] rounded-xl text-sm text-[var(--ink)]"
            />
          </div>
        </section>

        {/* ── 3. HARGA JUAL & PEMBAYARAN ── */}
        <section className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-4 sm:p-5 space-y-4">
          <h2 className="text-sm font-bold text-[var(--ink)]">3. Harga Deal &amp; Pembayaran</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                Harga Jual Deal (Rp) *
              </label>
              <input
                required
                type="text"
                inputMode="numeric"
                placeholder="Contoh: 154.000.000"
                value={sellingPrice !== "" ? formatThousands(sellingPrice) : ""}
                onChange={(e) => setSellingPrice(parseThousands(e.target.value) || "")}
                className="w-full px-3.5 py-2.5 min-h-[48px] bg-[var(--bg)] border border-[var(--line-input)] rounded-xl text-base font-bold text-[var(--ink)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                Tanggal Jual *
              </label>
              <input
                required
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className="w-full px-3.5 py-2.5 min-h-[48px] bg-[var(--bg)] border border-[var(--line-input)] rounded-xl text-sm font-medium text-[var(--ink)]"
              />
            </div>
          </div>

          {/* 2 Tombol Besar: Lunas vs Tempo */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => {
                setPaymentMode("LUNAS");
                setInitialPaymentAmount(priceNum || "");
              }}
              className={cn(
                "px-3 py-3 min-h-[50px] rounded-xl text-xs sm:text-sm font-bold border transition-colors cursor-pointer",
                paymentMode === "LUNAS"
                  ? "bg-[var(--ok)] text-white border-[var(--ok)]"
                  : "bg-[var(--bg)] text-[var(--ink)] border-[var(--line)]"
              )}
            >
              Bayar Lunas
            </button>
            <button
              type="button"
              onClick={() => {
                setPaymentMode("TEMPO");
                if (!dueDate) setDueDate(addDaysToDateStr(saleDate, 14));
              }}
              className={cn(
                "px-3 py-3 min-h-[50px] rounded-xl text-xs sm:text-sm font-bold border transition-colors cursor-pointer",
                paymentMode === "TEMPO"
                  ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                  : "bg-[var(--bg)] text-[var(--ink)] border-[var(--line)]"
              )}
            >
              DP / Tempo
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {paymentMode === "TEMPO" && (
              <div>
                <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                  Uang Masuk / DP Sekarang (Rp)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0 jika belum ada DP"
                  value={
                    initialPaymentAmount !== "" ? formatThousands(initialPaymentAmount) : ""
                  }
                  onChange={(e) =>
                    setInitialPaymentAmount(parseThousands(e.target.value) || "")
                  }
                  className="w-full px-3.5 py-2.5 min-h-[46px] bg-[var(--bg)] border border-[var(--line-input)] rounded-xl text-sm font-bold text-[var(--ink)]"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                Cara Bayar
              </label>
              <select
                value={initialPaymentMethod}
                onChange={(e) => setInitialPaymentMethod(e.target.value)}
                className="w-full px-3.5 py-2.5 min-h-[46px] bg-[var(--bg)] border border-[var(--line-input)] rounded-xl text-sm font-medium text-[var(--ink)]"
              >
                <option value="TRANSFER">Transfer Bank</option>
                <option value="CASH">Tunai (Cash)</option>
                <option value="TRADE_IN">Tukar Tambah</option>
              </select>
            </div>

            {paymentMode === "TEMPO" && (
              <div>
                <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                  Jatuh Tempo Pelunasan
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 min-h-[46px] bg-[var(--bg)] border border-[var(--line-input)] rounded-xl text-sm text-[var(--ink)]"
                />
              </div>
            )}
          </div>

          {/* Peringatan lembut (tidak memblokir) */}
          {(showLowDpWarning || showLongTempoWarning) && (
            <div className="p-3 rounded-xl bg-[var(--warn-light)] border border-[var(--warn)]/40 text-xs text-amber-900 flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
              <div className="space-y-0.5">
                {showLowDpWarning && (
                  <p>
                    Catatan: DP pembeli langsung di bawah 70% ({formatRupiah(minDp70)}). Anda tetap bisa menyimpan jika memang sudah sepakat.
                  </p>
                )}
                {showLongTempoWarning && (
                  <p>
                    Catatan: Jarak jatuh tempo lebih dari 30 hari ({diffTempoDays} hari). Anda tetap bisa menyimpan jika memang disepakati.
                  </p>
                )}
              </div>
            </div>
          )}
        </section>

        {/* ── 4. OPSIONAL: DOKUMEN, CEKLIST & MAKELAR (DILIPAT) ── */}
        <section className="bg-[var(--surface)] border border-[var(--line)] rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowOptional((prev) => !prev)}
            className="w-full px-4 sm:px-5 py-3.5 min-h-[52px] flex items-center justify-between gap-2 text-left hover:bg-[var(--bg)] transition-colors cursor-pointer"
          >
            <div>
              <div className="text-sm font-bold text-[var(--ink)]">
                Lengkapi Berkas, Catatan &amp; Komisi Makelar (Opsional)
              </div>
              <div className="text-xs text-[var(--muted)]">
                Bisa dilewati jika sedang buru-buru.
              </div>
            </div>
            <ChevronDown
              className={cn(
                "w-5 h-5 text-[var(--muted)] transition-transform duration-200 shrink-0",
                showOptional && "rotate-180"
              )}
            />
          </button>

          {showOptional && (
            <div className="p-4 sm:p-5 border-t border-[var(--line)] space-y-5">
              {/* Upload Berkas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <UploadCard
                  title="Foto Serah Terima"
                  url={handoverPhotoUrl}
                  uploading={uploadingPhoto}
                  accept="image/jpeg,image/png,image/webp"
                  onClear={() => setHandoverPhotoUrl("")}
                  onSelect={(file) =>
                    handleFileUpload(
                      file,
                      "PHOTO",
                      setUploadingPhoto,
                      setHandoverPhotoUrl,
                      undefined,
                      "HANDOVER_DELIVERY",
                      "Foto Serah Terima Unit"
                    )
                  }
                />
                <UploadCard
                  title="Bukti Transfer / Kuitansi"
                  url={paymentReceiptUrl}
                  uploading={uploadingReceipt}
                  accept="application/pdf,image/jpeg,image/png,image/webp"
                  onClear={() => setPaymentReceiptUrl("")}
                  onSelect={(file) =>
                    handleFileUpload(
                      file,
                      "DOCUMENT",
                      setUploadingReceipt,
                      setPaymentReceiptUrl,
                      "KUITANSI"
                    )
                  }
                />
                <UploadCard
                  title="Scan BAST"
                  url={bastDocUrl}
                  uploading={uploadingBast}
                  accept="application/pdf,image/jpeg,image/png,image/webp"
                  onClear={() => setBastDocUrl("")}
                  onSelect={(file) =>
                    handleFileUpload(file, "DOCUMENT", setUploadingBast, setBastDocUrl, "OTHER")
                  }
                />
                <UploadCard
                  title="Foto KTP Pembeli"
                  url={buyerIdCardUrl}
                  uploading={uploadingKtp}
                  accept="image/jpeg,image/png,image/webp"
                  onClear={() => setBuyerIdCardUrl("")}
                  onSelect={(file) =>
                    handleFileUpload(
                      file,
                      "DOCUMENT",
                      setUploadingKtp,
                      setBuyerIdCardUrl,
                      "KTP_PEMILIK"
                    )
                  }
                />
              </div>

              {/* Odometer & Catatan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                    KM Terakhir (Opsional)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Contoh: 45.000"
                    value={handoverOdometer !== "" ? formatThousands(handoverOdometer) : ""}
                    onChange={(e) => setHandoverOdometer(parseThousands(e.target.value) || "")}
                    className="w-full px-3.5 py-2.5 min-h-[44px] bg-[var(--bg)] border border-[var(--line-input)] rounded-xl text-sm text-[var(--ink)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                    Catatan Serah Terima
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: BPKB menyusul minggu depan"
                    value={handoverNotes}
                    onChange={(e) => setHandoverNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 min-h-[44px] bg-[var(--bg)] border border-[var(--line-input)] rounded-xl text-sm text-[var(--ink)]"
                  />
                </div>
              </div>

              {/* Checklist Berkas */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-[var(--ink)]">
                  Kelengkapan yang Diserahkan
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {DEFAULT_CHECKLIST.map((item) => {
                    const checked = handoverChecklist.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleChecklistItem(item.id)}
                        className={cn(
                          "flex items-center gap-2 p-2.5 min-h-[44px] rounded-xl border text-left text-xs font-medium cursor-pointer",
                          checked
                            ? "bg-white border-[var(--accent)] text-[var(--ink)]"
                            : "bg-[var(--bg)] border-[var(--line)] text-[var(--muted)]"
                        )}
                      >
                        {checked ? (
                          <CheckSquare className="w-4 h-4 text-[var(--accent)] shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-[var(--muted)] shrink-0" />
                        )}
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Komisi Makelar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[var(--line)]">
                <div>
                  <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                    Nama Makelar / Perantara
                  </label>
                  <input
                    type="text"
                    placeholder="Kosongkan jika tanpa makelar"
                    value={brokerName}
                    onChange={(e) => setBrokerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 min-h-[44px] bg-[var(--bg)] border border-[var(--line-input)] rounded-xl text-sm text-[var(--ink)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                    Komisi Makelar (Rp)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Contoh: 1.500.000"
                    value={brokerFee !== "" ? formatThousands(brokerFee) : ""}
                    onChange={(e) => setBrokerFee(parseThousands(e.target.value) || "")}
                    className="w-full px-3.5 py-2.5 min-h-[44px] bg-[var(--bg)] border border-[var(--line-input)] rounded-xl text-sm font-bold text-[var(--ink)]"
                  />
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ── RINGKASAN TRANSAKSI ── */}
        <div className="bg-[var(--ink)] text-white rounded-xl p-4 sm:p-5 space-y-3">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs text-white/75 font-medium">Total Harga Jual</span>
            <span className="text-xl sm:text-2xl font-extrabold">{formatRupiah(priceNum)}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/15 text-xs">
            <div>
              <div className="text-[11px] text-white/65">Uang Masuk</div>
              <div className="font-bold mt-0.5">{formatRupiah(effectiveInitialPay)}</div>
            </div>
            <div>
              <div className="text-[11px] text-white/65">Sisa Tagihan</div>
              <div className="font-bold mt-0.5">{formatRupiah(remainingPiutang)}</div>
            </div>
            <div>
              <div className="text-[11px] text-white/65">Perkiraan Laba</div>
              <div
                className={cn(
                  "font-bold mt-0.5",
                  estimatedGrossProfit < 0 ? "text-red-300" : "text-emerald-300"
                )}
              >
                {formatRupiah(estimatedGrossProfit)}
              </div>
            </div>
          </div>
        </div>

        {/* ── TOMBOL SIMPAN ── */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-1">
          <Link
            href="/admin/sales"
            className="w-full sm:w-auto px-5 py-3 min-h-[48px] rounded-xl border border-[var(--line)] bg-white text-center text-sm font-semibold text-[var(--muted)] hover:text-[var(--ink)] flex items-center justify-center"
          >
            Batal
          </Link>

          <button
            type="submit"
            disabled={loading || availableVehicles.length === 0}
            className="w-full sm:w-auto flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3 min-h-[48px] bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-xl text-sm font-bold disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Simpan Penjualan</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

function UploadCard({
  title,
  url,
  uploading,
  accept,
  onSelect,
  onClear,
}: {
  title: string;
  url: string;
  uploading: boolean;
  accept: string;
  onSelect: (file: File) => void;
  onClear: () => void;
}) {
  return (
    <div className="border border-[var(--line)] rounded-xl p-3 bg-[var(--bg)] space-y-2">
      <div className="text-xs font-bold text-[var(--ink)]">{title}</div>
      {url ? (
        <div className="flex items-center justify-between gap-2">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)] hover:underline"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Lihat berkas</span>
          </a>
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 min-h-[36px] rounded-lg border border-red-200 bg-white text-red-600 text-xs font-semibold cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus</span>
          </button>
        </div>
      ) : (
        <label className="w-full py-2.5 px-3 min-h-[44px] border border-dashed border-[var(--line-input)] rounded-lg bg-white flex items-center justify-center gap-2 cursor-pointer text-xs font-semibold text-[var(--ink)]">
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin text-[var(--accent)]" />
          ) : (
            <Upload className="w-4 h-4 text-[var(--accent)]" />
          )}
          <span>{uploading ? "Mengunggah..." : "Pilih file / foto"}</span>
          <input
            type="file"
            accept={accept}
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onSelect(file);
            }}
          />
        </label>
      )}
    </div>
  );
}

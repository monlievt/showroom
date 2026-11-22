"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Car,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Camera,
  ChevronDown,
  ExternalLink,
  RotateCcw,
  Upload,
  X,
  Info,
  Globe,
} from "lucide-react";
import { createVehicleAction } from "@/app/actions/vehicle";
import { getAuctionHousesAction, AuctionHouseItem } from "@/app/actions/auction-house";
import {
  VehicleFundingSelector,
  type InvestorOption,
  type FundingAllocationRow,
} from "@/components/admin/VehicleFundingSelector";
import {
  cn,
  formatRupiah,
  formatThousands,
  parseThousands,
  normalizePlateNumber,
  getTodayWibDateString,
} from "@/lib/utils";
import { generateVehicleSlug } from "@/lib/utils/slug";

const AUCTION_PRESET_DAYS: Record<string, number> = {
  JBA: 14,
  IBID: 10,
  AUKSI: 7,
  SMARTBID: 30,
  LEGOAS: 14,
  CAREADY: 14,
  ADIRA: 21,
  "BCA FINANCE": 14,
  "STAR AUCTION": 14,
};

interface VehicleNewClientProps {
  availableInvestors?: InvestorOption[];
  currentCashBalance?: number;
}

export function VehicleNewClient({
  availableInvestors = [],
  currentCashBalance = 0,
}: VehicleNewClientProps) {
  const router = useRouter();
  const topRef = useRef<HTMLDivElement>(null);

  const [investors, setInvestors] = useState<InvestorOption[]>(availableInvestors);
  const [cashBalance, setCashBalance] = useState<number>(currentCashBalance);
  const [auctionHouses, setAuctionHouses] = useState<AuctionHouseItem[]>([]);

  // Jenis kendaraan sederhana (Mobil vs Motor) untuk default CC & form bersih
  const [vehicleCategory, setVehicleCategory] = useState<"CAR" | "MOTOR">("CAR");

  // Data pokok harian
  const [plateNumber, setPlateNumber] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [color, setColor] = useState("");
  const [transmission, setTransmission] = useState<"AUTOMATIC" | "MANUAL" | "CVT" | "DCT">("AUTOMATIC");
  const [odometer, setOdometer] = useState<number>(0);
  const [engineCapacity, setEngineCapacity] = useState<number>(1500);

  // Harga & Tayang Web
  const [sourceType, setSourceType] = useState<"AUCTION" | "DIRECT_BUY" | "BROKER">("AUCTION");
  const [auctionHouse, setAuctionHouse] = useState("JBA");
  const [customAuctionHouse, setCustomAuctionHouse] = useState("");
  const [auctionLotType, setAuctionLotType] = useState<"EKS_PERUSAHAAN" | "EKS_TARIKAN_LEASING" | "UNKNOWN">("EKS_PERUSAHAAN");
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [purchaseDate, setPurchaseDate] = useState(() => getTodayWibDateString());
  const [targetSellingPrice, setTargetSellingPrice] = useState<number>(0);
  const [minSellingPrice, setMinSellingPrice] = useState<number>(0);
  const [publishNow, setPublishNow] = useState(true);

  // Foto untuk langsung tayang di katalog web (diupload otomatis setelah unit tersimpan)
  const [selectedPhotos, setSelectedPhotos] = useState<Array<{ file: File; preview: string }>>([]);

  // Bagian lanjutan (dilipat default)
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [currentLocation, setCurrentLocation] = useState("Garasi Utama");
  const [bpkbStatus, setBpkbStatus] = useState<"READY" | "PROCESS_1_2_WEEKS" | "LOST_NEED_REPLACEMENT" | "MUTATION_REQUIRED">("READY");
  const [bpkbLeadDays, setBpkbLeadDays] = useState<number>(14);
  const [stnkStatus, setStnkStatus] = useState<"READY" | "PROCESS_1_2_WEEKS" | "LOST_NEED_REPLACEMENT" | "MUTATION_REQUIRED">("READY");
  const [taxExpiryDate, setTaxExpiryDate] = useState("");
  const [platExpiryDate, setPlatExpiryDate] = useState("");
  const [taxNominal, setTaxNominal] = useState<number>(0);
  const [auctionAdminFee, setAuctionAdminFee] = useState<number>(0);
  const [transportPickupFee, setTransportPickupFee] = useState<number>(0);
  const [transportVendor, setTransportVendor] = useState("");
  const [notes, setNotes] = useState("");

  // Pemodal / Investor
  const [fundingMode, setFundingMode] = useState<"SHOWROOM" | "INVESTOR">("SHOWROOM");
  const [investorFundingList, setInvestorFundingList] = useState<FundingAllocationRow[]>([]);

  // Status UI
  const [loading, setLoading] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [cashNotice, setCashNotice] = useState("");
  const [createdVehicle, setCreatedVehicle] = useState<{
    id: string;
    plateNumber: string;
    brand: string;
    model: string;
    year: number;
    purchasePrice: number;
    status: string;
    uploadedPhotoCount: number;
  } | null>(null);

  useEffect(() => {
    getAuctionHousesAction().then((list) => {
      if (list && list.length > 0) setAuctionHouses(list);
    });
  }, []);

  const isAuction = sourceType === "AUCTION";
  const totalCashOut =
    (Number(purchasePrice) || 0) +
    (isAuction ? Number(auctionAdminFee) || 0 : 0) +
    (Number(transportPickupFee) || 0);
  const isCashShort = totalCashOut > 0 && cashBalance < totalCashOut;

  const showError = (msg: string) => {
    setErrorMsg(msg);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleCategorySwitch = (cat: "CAR" | "MOTOR") => {
    setVehicleCategory(cat);
    setEngineCapacity(cat === "MOTOR" ? 150 : 1500);
    if (cat === "MOTOR") {
      setTransmission("AUTOMATIC");
    }
  };

  const handlePhotoFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const valid = files.slice(0, 6 - selectedPhotos.length).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setSelectedPhotos((prev) => [...prev, ...valid]);
    e.target.value = "";
  };

  const removeSelectedPhoto = (index: number) => {
    setSelectedPhotos((prev) => {
      const copy = [...prev];
      const removed = copy.splice(index, 1)[0];
      if (removed) URL.revokeObjectURL(removed.preview);
      return copy;
    });
  };

  const handleResetForm = () => {
    selectedPhotos.forEach((p) => URL.revokeObjectURL(p.preview));
    setSelectedPhotos([]);
    setCreatedVehicle(null);
    setPlateNumber("");
    setBrand("");
    setModel("");
    setYear(new Date().getFullYear());
    setColor("");
    setOdometer(0);
    setEngineCapacity(vehicleCategory === "MOTOR" ? 150 : 1500);
    setPurchasePrice(0);
    setTargetSellingPrice(0);
    setMinSellingPrice(0);
    setAuctionAdminFee(0);
    setTransportPickupFee(0);
    setTransportVendor("");
    setTaxExpiryDate("");
    setPlatExpiryDate("");
    setTaxNominal(0);
    setNotes("");
    setFundingMode("SHOWROOM");
    setInvestorFundingList([]);
    setErrorMsg("");
    setCashNotice("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setCashNotice("");

    const formattedPlate = normalizePlateNumber(plateNumber);
    if (formattedPlate.length < 3) {
      showError("Isi nomor plat kendaraan minimal 3 karakter (contoh: B 1277 DKS).");
      return;
    }
    if (!brand.trim() || !model.trim()) {
      showError("Isi merk dan tipe kendaraan terlebih dahulu.");
      return;
    }
    if (!purchasePrice || purchasePrice <= 0) {
      showError("Isi harga beli kendaraan terlebih dahulu.");
      return;
    }

    const cleanInvestments =
      fundingMode === "INVESTOR"
        ? investorFundingList.filter((inv) => inv.investorId && Number(inv.capitalShare) > 0)
        : [];

    if (fundingMode === "INVESTOR" && cleanInvestments.length === 0) {
      showError(
        "Pilih pemodal dan isi nominal modalnya, atau ubah sumber dana ke Modal Kas Sendiri."
      );
      return;
    }

    setLoading(true);

    try {
      const finalAuctionHouse = isAuction
        ? auctionHouse === "LAINNYA" && customAuctionHouse.trim()
          ? customAuctionHouse.trim()
          : auctionHouse
        : undefined;

      const res = await createVehicleAction({
        plateNumber: formattedPlate,
        brand: brand.trim(),
        model: model.trim(),
        year: Number(year) || new Date().getFullYear(),
        color: color.trim() || "Hitam",
        odometer: Number(odometer) || 0,
        transmission,
        engineCapacity: Number(engineCapacity) || (vehicleCategory === "MOTOR" ? 150 : 1500),
        sourceType,
        initialStatus: publishNow ? "READY_FOR_SALE" : "INTAKE",
        auctionHouse: finalAuctionHouse,
        auctionLotType: isAuction ? auctionLotType : undefined,
        auctionAdminFee: isAuction ? Number(auctionAdminFee) || 0 : 0,
        transportPickupFee: Number(transportPickupFee) || 0,
        transportVendor: transportVendor.trim() || undefined,
        purchasePrice: Number(purchasePrice),
        purchaseDate: new Date(`${purchaseDate}T12:00:00+07:00`),
        targetSellingPrice: targetSellingPrice > 0 ? Number(targetSellingPrice) : undefined,
        minSellingPrice: minSellingPrice > 0 ? Number(minSellingPrice) : undefined,
        currentLocation: currentLocation.trim() || "Garasi Utama",
        bpkbStatus,
        bpkbLeadDays: Number(bpkbLeadDays) || 14,
        stnkStatus,
        taxExpiryDate: taxExpiryDate ? new Date(`${taxExpiryDate}T12:00:00+07:00`) : undefined,
        platExpiryDate: platExpiryDate ? new Date(`${platExpiryDate}T12:00:00+07:00`) : undefined,
        taxNominal: taxNominal > 0 ? Number(taxNominal) : undefined,
        notes: notes.trim() || undefined,
        investments: cleanInvestments,
      });

      if (!res.success || !res.data) {
        throw new Error(res.error || "Gagal menyimpan unit baru.");
      }

      const savedVehicle = res.data;
      let uploadedCount = 0;

      // Upload foto yang dipilih pengguna agar unit langsung tampil menarik di web katalog
      if (selectedPhotos.length > 0) {
        setUploadingPhotos(true);
        for (let i = 0; i < selectedPhotos.length; i++) {
          const item = selectedPhotos[i];
          const fd = new FormData();
          fd.append("file", item.file);
          fd.append("vehicleId", savedVehicle.id);
          fd.append("uploadType", "PHOTO");
          fd.append("category", publishNow ? "FINAL_LISTING" : "CONDITION_INTAKE");
          fd.append("tag", i === 0 ? "FRONT" : `UNIT_${i + 1}`);
          fd.append("title", i === 0 ? "Foto Utama Unit" : `Foto Unit ${i + 1}`);
          try {
            const upRes = await fetch("/api/upload", { method: "POST", body: fd });
            if (upRes.ok) uploadedCount++;
          } catch {}
        }
        setUploadingPhotos(false);
      }

      setCashBalance((prev) => prev - totalCashOut);
      if (cleanInvestments.length > 0) {
        setInvestors((prev) =>
          prev.map((inv) => {
            const used = cleanInvestments.find((item) => item.investorId === inv.id);
            return used
              ? { ...inv, currentBalance: Math.max(0, inv.currentBalance - Number(used.capitalShare)) }
              : inv;
          })
        );
      }
      if (res.warning) {
        setCashNotice(res.warning);
      }

      setCreatedVehicle({
        id: savedVehicle.id,
        plateNumber: savedVehicle.plateNumber,
        brand: savedVehicle.brand,
        model: savedVehicle.model,
        year: savedVehicle.year,
        purchasePrice: Number(savedVehicle.purchasePrice),
        status: savedVehicle.status,
        uploadedPhotoCount: uploadedCount,
      });
      setLoading(false);
      router.refresh();
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err: any) {
      showError(err.message || "Gagal menyimpan unit baru.");
      setLoading(false);
      setUploadingPhotos(false);
    }
  };

  if (createdVehicle) {
    const slug = generateVehicleSlug({
      plateNumber: createdVehicle.plateNumber,
      brand: createdVehicle.brand,
      model: createdVehicle.model,
      year: createdVehicle.year,
    });

    return (
      <div ref={topRef} className="p-4 sm:p-6 max-w-xl mx-auto space-y-4">
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-5 sm:p-6 space-y-4 text-center">
          <div className="w-12 h-12 rounded-full bg-[var(--ok-light)] text-[var(--ok)] flex items-center justify-center mx-auto">
            <CheckCircle className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-[var(--ink)]">
              Unit Berhasil Disimpan!
            </h2>
            <p className="text-sm font-bold text-[var(--accent)] mt-1">
              {createdVehicle.plateNumber} | {createdVehicle.brand} {createdVehicle.model} (
              {createdVehicle.year})
            </p>
            <p className="text-xs text-[var(--muted)] mt-1">
              {createdVehicle.status === "READY_FOR_SALE"
                ? "Status: Siap Jual (otomatis tayang di katalog web)."
                : "Status: Baru Masuk (belum tayang di katalog web)."}
              {createdVehicle.uploadedPhotoCount > 0 &&
                ` ${createdVehicle.uploadedPhotoCount} foto terunggah.`}
            </p>
          </div>

          {cashNotice && (
            <div className="p-3 rounded-xl bg-[var(--warn-light)] border border-[var(--warn)]/40 text-xs text-amber-900 text-left">
              {cashNotice}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            <Link
              href={`/katalog/${slug}`}
              target="_blank"
              className="flex items-center justify-center gap-2 px-4 py-3 min-h-[46px] rounded-xl bg-[var(--ok)] text-white text-xs sm:text-sm font-bold"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Lihat di Web Katalog</span>
            </Link>
            <Link
              href={`/admin/inventory/${createdVehicle.id}/media`}
              className="flex items-center justify-center gap-2 px-4 py-3 min-h-[46px] rounded-xl bg-[var(--accent)] text-white text-xs sm:text-sm font-bold"
            >
              <Camera className="w-4 h-4" />
              <span>Tambah Foto Lainnya</span>
            </Link>
            <Link
              href={`/admin/inventory/${createdVehicle.id}`}
              className="flex items-center justify-center gap-2 px-4 py-3 min-h-[46px] rounded-xl bg-white border border-[var(--line)] text-[var(--ink)] text-xs sm:text-sm font-semibold"
            >
              <span>Buka Detail Unit</span>
            </Link>
            <button
              type="button"
              onClick={handleResetForm}
              className="flex items-center justify-center gap-2 px-4 py-3 min-h-[46px] rounded-xl bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)] text-xs sm:text-sm font-semibold cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Input Unit Lagi</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={topRef} className="p-4 sm:p-6 max-w-3xl mx-auto space-y-5">
      <div>
        <Link
          href="/admin/inventory"
          className="inline-flex items-center gap-2 px-3.5 py-2 min-h-[44px] rounded-xl bg-white border border-[var(--line)] text-[var(--ink)] hover:bg-[var(--bg)] font-semibold text-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[var(--muted)]" />
          <span>Kembali ke Stok Unit</span>
        </Link>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-[var(--bad-light)] border border-[var(--bad)]/30 text-[var(--bad)] text-xs sm:text-sm font-semibold flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ── 1. DATA KENDARAAN POKOK ── */}
        <section className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-[var(--accent)]" />
              <h2 className="text-sm font-bold text-[var(--ink)]">1. Data Kendaraan</h2>
            </div>

            <div className="inline-flex rounded-lg border border-[var(--line)] p-0.5 bg-[var(--bg)]">
              <button
                type="button"
                onClick={() => handleCategorySwitch("CAR")}
                className={cn(
                  "px-3 py-1.5 min-h-[36px] rounded-md text-xs font-bold cursor-pointer transition-colors",
                  vehicleCategory === "CAR"
                    ? "bg-[var(--accent)] text-white"
                    : "text-[var(--muted)]"
                )}
              >
                Mobil
              </button>
              <button
                type="button"
                onClick={() => handleCategorySwitch("MOTOR")}
                className={cn(
                  "px-3 py-1.5 min-h-[36px] rounded-md text-xs font-bold cursor-pointer transition-colors",
                  vehicleCategory === "MOTOR"
                    ? "bg-[var(--accent)] text-white"
                    : "text-[var(--muted)]"
                )}
              >
                Motor
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                Plat Nomor *
              </label>
              <input
                required
                type="text"
                placeholder="Contoh: B 1277 DKS"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                onBlur={() => {
                  if (plateNumber.trim()) {
                    setPlateNumber(normalizePlateNumber(plateNumber));
                  }
                }}
                className="w-full px-3.5 py-2.5 min-h-[46px] bg-[var(--bg)] border border-[var(--line-input)] rounded-xl text-sm font-bold tracking-wide text-[var(--ink)] uppercase"
              />
              <span className="text-[11px] text-[var(--muted)] mt-1 block">
                Otomatis dirapikan pakai spasi (mis. B 1277 DKS)
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                Tahun *
              </label>
              <input
                required
                type="number"
                inputMode="numeric"
                min={1990}
                max={new Date().getFullYear() + 1}
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 min-h-[46px] bg-[var(--bg)] border border-[var(--line-input)] rounded-xl text-sm font-bold text-[var(--ink)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                Merk *
              </label>
              <input
                required
                type="text"
                placeholder={vehicleCategory === "MOTOR" ? "Contoh: Honda / Yamaha" : "Contoh: Toyota / Daihatsu"}
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-3.5 py-2.5 min-h-[46px] bg-[var(--bg)] border border-[var(--line-input)] rounded-xl text-sm font-medium text-[var(--ink)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                Tipe / Model *
              </label>
              <input
                required
                type="text"
                placeholder={vehicleCategory === "MOTOR" ? "Contoh: Vario 160 ABS" : "Contoh: Avanza E / Sigra D"}
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3.5 py-2.5 min-h-[46px] bg-[var(--bg)] border border-[var(--line-input)] rounded-xl text-sm font-medium text-[var(--ink)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                Warna (Opsional)
              </label>
              <input
                type="text"
                placeholder="Contoh: Hitam / Putih / Silver"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full px-3.5 py-2.5 min-h-[46px] bg-[var(--bg)] border border-[var(--line-input)] rounded-xl text-sm text-[var(--ink)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                Transmisi
              </label>
              <select
                value={transmission}
                onChange={(e) => setTransmission(e.target.value as any)}
                className="w-full px-3.5 py-2.5 min-h-[46px] bg-[var(--bg)] border border-[var(--line-input)] rounded-xl text-sm font-medium text-[var(--ink)]"
              >
                <option value="AUTOMATIC">Matic (AT)</option>
                <option value="MANUAL">Manual (MT)</option>
                <option value="CVT">CVT</option>
                <option value="DCT">DCT</option>
              </select>
            </div>
          </div>
        </section>

        {/* ── 2. HARGA BELI & TAYANG WEB ── */}
        <section className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-4 sm:p-5 space-y-4">
          <h2 className="text-sm font-bold text-[var(--ink)]">2. Harga Beli &amp; Katalog Web</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                Harga Beli (Rp) *
              </label>
              <input
                required
                type="text"
                inputMode="numeric"
                placeholder="Contoh: 145.000.000"
                value={purchasePrice > 0 ? formatThousands(purchasePrice) : ""}
                onChange={(e) => setPurchasePrice(parseThousands(e.target.value))}
                className="w-full px-3.5 py-2.5 min-h-[48px] bg-[var(--bg)] border border-[var(--line-input)] rounded-xl text-base font-bold text-[var(--ink)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                Harga Jual di Web (Opsional)
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Kosongkan jika belum ditentukan"
                value={targetSellingPrice > 0 ? formatThousands(targetSellingPrice) : ""}
                onChange={(e) => setTargetSellingPrice(parseThousands(e.target.value))}
                className="w-full px-3.5 py-2.5 min-h-[48px] bg-[var(--bg)] border border-[var(--line-input)] rounded-xl text-base font-bold text-[var(--ink)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                Tanggal Beli *
              </label>
              <input
                required
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full px-3.5 py-2.5 min-h-[46px] bg-[var(--bg)] border border-[var(--line-input)] rounded-xl text-sm text-[var(--ink)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                Asal Unit
              </label>
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 min-h-[46px] bg-[var(--bg)] border border-[var(--line-input)] rounded-xl text-sm font-medium text-[var(--ink)]"
              >
                <option value="AUCTION">Balai Lelang</option>
                <option value="DIRECT_BUY">Beli Langsung (Pemakai)</option>
                <option value="BROKER">Dari Makelar / Rekanan</option>
              </select>
            </div>
          </div>

          {isAuction && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                  Balai Lelang
                </label>
                <select
                  value={auctionHouse}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAuctionHouse(val);
                    const matched = auctionHouses.find(
                      (a) => a.name.toLowerCase() === val.toLowerCase()
                    );
                    setBpkbLeadDays(matched?.bpkbLeadDays ?? AUCTION_PRESET_DAYS[val] ?? 14);
                  }}
                  className="w-full px-3.5 py-2.5 min-h-[44px] bg-[var(--bg)] border border-[var(--line-input)] rounded-xl text-sm text-[var(--ink)]"
                >
                  {["JBA", "IBID", "AUKSI", "SMARTBID", "LEGOAS", "CAREADY", "ADIRA", "BCA FINANCE", "STAR AUCTION", "LAINNYA"].map(
                    (h) => (
                      <option key={h} value={h}>
                        {h === "LAINNYA" ? "Lainnya (ketik manual)" : h}
                      </option>
                    )
                  )}
                </select>
              </div>
              {auctionHouse === "LAINNYA" && (
                <div>
                  <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                    Nama Balai Lelang
                  </label>
                  <input
                    type="text"
                    placeholder="Ketik nama balai lelang"
                    value={customAuctionHouse}
                    onChange={(e) => setCustomAuctionHouse(e.target.value)}
                    className="w-full px-3.5 py-2.5 min-h-[44px] bg-[var(--bg)] border border-[var(--line-input)] rounded-xl text-sm text-[var(--ink)]"
                  />
                </div>
              )}
            </div>
          )}

          {/* Toggle Langsung Tayangkan di Web */}
          <label className="flex items-start gap-3 p-3.5 rounded-xl border border-[var(--line)] bg-[var(--bg)] cursor-pointer">
            <input
              type="checkbox"
              checked={publishNow}
              onChange={(e) => setPublishNow(e.target.checked)}
              className="mt-0.5 w-5 h-5 accent-[var(--ok)] cursor-pointer shrink-0"
            />
            <div className="min-w-0">
              <div className="text-sm font-bold text-[var(--ink)] flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-[var(--ok)] shrink-0" />
                <span>Langsung tayangkan di Katalog Web (Siap Jual)</span>
              </div>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                Hilangkan centang jika unit masih perlu bengkel/salon dulu sebelum tampil di web.
              </p>
            </div>
          </label>

          {/* Peringatan lembut bila saldo kas kurang (tidak memblokir simpan) */}
          {isCashShort && (
            <div className="p-3 rounded-xl bg-[var(--warn-light)] border border-[var(--warn)]/40 text-xs text-amber-900 flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
              <span>
                Saldo Buku Kas saat ini ({formatRupiah(cashBalance)}) lebih kecil dari harga beli (
                {formatRupiah(totalCashOut)}). Transaksi <strong>tetap bisa disimpan</strong>, dan saldo kas bisa disesuaikan nanti di menu Buku Kas.
              </span>
            </div>
          )}
        </section>

        {/* ── 3. FOTO UNTUK WEB (OPSIONAL, LANGSUNG DARI HP) ── */}
        <section className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-[var(--accent)]" />
              <h2 className="text-sm font-bold text-[var(--ink)]">
                3. Foto Unit untuk Web (Opsional)
              </h2>
            </div>
            <span className="text-xs text-[var(--muted)]">{selectedPhotos.length}/6 foto</span>
          </div>

          {selectedPhotos.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {selectedPhotos.map((p, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square rounded-lg overflow-hidden border border-[var(--line)] bg-[var(--bg)]"
                >
                  <img
                    src={p.preview}
                    alt={`Foto ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeSelectedPhoto(idx)}
                    aria-label="Hapus foto"
                    className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/70 text-white flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  {idx === 0 && (
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-[10px] font-bold">
                      Utama
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {selectedPhotos.length < 6 && (
            <label className="w-full py-3.5 px-4 min-h-[48px] border border-dashed border-[var(--line-input)] hover:border-[var(--accent)] rounded-xl bg-[var(--bg)] flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm font-semibold text-[var(--ink)] transition-colors">
              <Upload className="w-4 h-4 text-[var(--accent)]" />
              <span>Pilih Foto dari HP / Galeri</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={handlePhotoFiles}
              />
            </label>
          )}
        </section>

        {/* ── 4. DETAIL TAMBAHAN (DILIPAT / OPSIONAL) ── */}
        <section className="bg-[var(--surface)] border border-[var(--line)] rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowAdvanced((prev) => !prev)}
            className="w-full px-4 sm:px-5 py-3.5 min-h-[52px] flex items-center justify-between gap-2 text-left hover:bg-[var(--bg)] transition-colors cursor-pointer"
          >
            <div>
              <div className="text-sm font-bold text-[var(--ink)]">
                Detail Tambahan: Pajak, BPKB, Biaya Awal &amp; Pemodal (Opsional)
              </div>
              <div className="text-xs text-[var(--muted)]">
                Bisa dilewati dulu dan dilengkapi kapan saja dari halaman Detail Unit.
              </div>
            </div>
            <ChevronDown
              className={cn(
                "w-5 h-5 text-[var(--muted)] transition-transform duration-200 shrink-0",
                showAdvanced && "rotate-180"
              )}
            />
          </button>

          {showAdvanced && (
            <div className="p-4 sm:p-5 border-t border-[var(--line)] space-y-5">
              {/* Spesifikasi & Lokasi */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                    Kilometer (KM)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Contoh: 42.000"
                    value={odometer > 0 ? formatThousands(odometer) : ""}
                    onChange={(e) => setOdometer(parseThousands(e.target.value))}
                    className="w-full px-3 py-2.5 min-h-[44px] bg-[var(--bg)] border border-[var(--line-input)] rounded-xl text-sm text-[var(--ink)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                    Kapasitas Mesin (cc)
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={engineCapacity}
                    onChange={(e) => setEngineCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2.5 min-h-[44px] bg-[var(--bg)] border border-[var(--line-input)] rounded-xl text-sm text-[var(--ink)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                    Lokasi Unit
                  </label>
                  <input
                    type="text"
                    value={currentLocation}
                    onChange={(e) => setCurrentLocation(e.target.value)}
                    className="w-full px-3 py-2.5 min-h-[44px] bg-[var(--bg)] border border-[var(--line-input)] rounded-xl text-sm text-[var(--ink)]"
                  />
                </div>
              </div>

              {/* Batas Harga Bawah & Biaya Awal */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                    Batas Bawah Nego (Rp)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Internal saja"
                    value={minSellingPrice > 0 ? formatThousands(minSellingPrice) : ""}
                    onChange={(e) => setMinSellingPrice(parseThousands(e.target.value))}
                    className="w-full px-3 py-2.5 min-h-[44px] bg-[var(--bg)] border border-[var(--line-input)] rounded-xl text-sm text-[var(--ink)]"
                  />
                </div>
                {isAuction && (
                  <div>
                    <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                      Biaya Admin Lelang (Rp)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Contoh: 3.000.000"
                      value={auctionAdminFee > 0 ? formatThousands(auctionAdminFee) : ""}
                      onChange={(e) => setAuctionAdminFee(parseThousands(e.target.value))}
                      className="w-full px-3 py-2.5 min-h-[44px] bg-[var(--bg)] border border-[var(--line-input)] rounded-xl text-sm text-[var(--ink)]"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                    Ongkos Ambil / Towing (Rp)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Contoh: 1.500.000"
                    value={transportPickupFee > 0 ? formatThousands(transportPickupFee) : ""}
                    onChange={(e) => setTransportPickupFee(parseThousands(e.target.value))}
                    className="w-full px-3 py-2.5 min-h-[44px] bg-[var(--bg)] border border-[var(--line-input)] rounded-xl text-sm text-[var(--ink)]"
                  />
                </div>
              </div>

              {/* STNK, BPKB & Pajak */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[var(--line)]">
                <div>
                  <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                    Status BPKB
                  </label>
                  <select
                    value={bpkbStatus}
                    onChange={(e) => setBpkbStatus(e.target.value as any)}
                    className="w-full px-3 py-2.5 min-h-[44px] bg-[var(--bg)] border border-[var(--line-input)] rounded-xl text-sm text-[var(--ink)]"
                  >
                    <option value="READY">BPKB di Tangan</option>
                    <option value="PROCESS_1_2_WEEKS">Menunggu Balai Lelang</option>
                    <option value="MUTATION_REQUIRED">Perlu Mutasi</option>
                    <option value="LOST_NEED_REPLACEMENT">Hilang / Urus Duplikat</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                    Jatuh Tempo Pajak STNK
                  </label>
                  <input
                    type="date"
                    value={taxExpiryDate}
                    onChange={(e) => setTaxExpiryDate(e.target.value)}
                    className="w-full px-3 py-2.5 min-h-[44px] bg-[var(--bg)] border border-[var(--line-input)] rounded-xl text-sm text-[var(--ink)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                    Perkiraan Pajak Tahunan (Rp)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Contoh: 2.500.000"
                    value={taxNominal > 0 ? formatThousands(taxNominal) : ""}
                    onChange={(e) => setTaxNominal(parseThousands(e.target.value))}
                    className="w-full px-3 py-2.5 min-h-[44px] bg-[var(--bg)] border border-[var(--line-input)] rounded-xl text-sm text-[var(--ink)]"
                  />
                </div>
              </div>

              {/* Sumber Modal Investor (jika ada) */}
              {investors.length > 0 && (
                <div className="pt-2 border-t border-[var(--line)]">
                  <VehicleFundingSelector
                    availableInvestors={investors}
                    purchasePrice={Number(purchasePrice) || 0}
                    extraInitialCosts={
                      (isAuction ? Number(auctionAdminFee) || 0 : 0) +
                      (Number(transportPickupFee) || 0)
                    }
                    showroomCashBalance={cashBalance}
                    fundingMode={fundingMode}
                    onFundingModeChange={setFundingMode}
                    investorFundingList={investorFundingList}
                    onInvestorFundingListChange={setInvestorFundingList}
                  />
                </div>
              )}

              {/* Catatan */}
              <div>
                <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                  Catatan Kondisi Unit
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Body mulus, ban masih tebal, perlu ganti oli."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--line-input)] rounded-xl text-sm text-[var(--ink)]"
                />
              </div>
            </div>
          )}
        </section>

        {/* ── TOMBOL SIMPAN ── */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-1">
          <Link
            href="/admin/inventory"
            className="w-full sm:w-auto px-5 py-3 min-h-[48px] rounded-xl border border-[var(--line)] bg-white text-center text-sm font-semibold text-[var(--muted)] hover:text-[var(--ink)] flex items-center justify-center"
          >
            Batal
          </Link>

          <button
            type="submit"
            disabled={loading || uploadingPhotos}
            className="w-full sm:w-auto flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3 min-h-[48px] bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-xl text-sm font-bold disabled:opacity-50 cursor-pointer"
          >
            {loading || uploadingPhotos ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{uploadingPhotos ? "Mengunggah foto..." : "Menyimpan unit..."}</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>{publishNow ? "Simpan & Tayangkan di Web" : "Simpan Unit Masuk"}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
